import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FramedPageEditor, { type FramedEditorController, type FramedPageEditorProps } from "../FramedPageEditor";
import { editFrameUrl } from "../framedPageProtocol";
import { remoteSelection, selectionComputedStyle } from "../remoteSelection";
import { originalLink } from "@/lib/inlineEditCore";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const defaults = (): FramedPageEditorProps => ({ base: "https://public.example.com/?embed=fixture", path: "/draft", edits: {}, objectEdits: {}, collapsed: new Set(), selectedKey: null, onChange: vi.fn(), onSelect: vi.fn(), onToggle: vi.fn(), onReorder: vi.fn(), onOpenObject: vi.fn() });
function setup(patch: Partial<FramedPageEditorProps> = {}) {
  const props = { ...defaults(), ...patch };
  const view = render(<FramedPageEditor {...props} />);
  const frame = view.container.querySelector("iframe");
  if (!frame?.contentWindow) throw new Error("Expected public frame");
  const frameWindow = frame.contentWindow;
  Object.defineProperty(frame, "contentWindow", { configurable: true, get: () => frameWindow });
  const send = vi.spyOn(frameWindow, "postMessage").mockImplementation(() => {});
  const receive = (type: string, payload = {}, origin = "https://public.example.com", source: MessageEventSource | null = frame.contentWindow) => act(() => { window.dispatchEvent(new MessageEvent("message", { origin, source, data: { source: "nova-site", type, ...payload } })); });
  return { ...view, props, frame, send, receive };
}
describe("public edit-frame guards", () => {
  it.each([null, undefined, "", "/draft", "http://public.example.com", window.location.origin + "/draft"])("never creates a frame for %s", (base) => {
    expect(editFrameUrl(base, "/draft")).toBeNull();
    const view = render(<FramedPageEditor {...defaults()} base={base ?? null} />);
    expect(view.container.querySelector("iframe")).toBeNull();
  });
  it("never frames from a nested manager", () => {
    vi.stubGlobal("top", {});
    expect(editFrameUrl("https://public.example.com", "/draft")).toBeNull();
    const view = render(<FramedPageEditor {...defaults()} />);
    expect(view.container.querySelector("iframe")).toBeNull();
  });
  it("preserves embed query and uses the exact public origin", () => {
    expect(editFrameUrl("https://public.example.com/?embed=fixture", "/draft")).toBe("https://public.example.com/draft?embed=fixture&nova-edit=1");
  });
  it("does not reload or create another frame after a failing load", () => {
    vi.useFakeTimers();
    const { frame, container } = setup();
    fireEvent.error(frame);
    act(() => vi.advanceTimersByTime(60000));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(container.querySelector("iframe")).toBe(frame);
  });
  it("times out visibly and reloads only on explicit Retry", () => {
    vi.useFakeTimers();
    const s = setup();
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't reach the public page");
    expect(s.container.querySelector("iframe")).toBe(s.frame);
    act(() => vi.advanceTimersByTime(60000));
    expect(s.container.querySelector("iframe")).toBe(s.frame);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(s.container.querySelector("iframe")).not.toBe(s.frame);
    expect(s.container.querySelectorAll("iframe")).toHaveLength(1);
  });
});
describe("edit-frame protocol", () => {
  it("ignores wrong origins and sources, then initializes and synchronizes", () => {
    const s = setup();
    s.receive("edit-ready", {}, "https://evil.example");
    s.receive("edit-ready", {}, "https://public.example.com", window);
    expect(s.send).not.toHaveBeenCalled();
    s.receive("edit-ready");
    expect(s.send).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-init", edits: {}, objectEdits: {}, collapsed: [], selectedKey: null, objectSwaps: {} }, "https://public.example.com");
    s.rerender(<FramedPageEditor {...s.props} edits={{ "0": "Changed" }} collapsed={new Set(["0"])} selectedKey="page|0" />);
    expect(s.send).toHaveBeenLastCalledWith(expect.objectContaining({ type: "edit-update", edits: { "0": "Changed" }, collapsed: ["0"], selectedKey: "page|0" }), "https://public.example.com");
    expect(s.container.querySelector("iframe")).toBe(s.frame);
  });
  it("routes valid scoped changes to the supplied changeScope callback only after ready", () => {
    const s = setup();
    s.receive("edit-change", { scope: "page", next: { "0": "No" } });
    expect(s.props.onChange).not.toHaveBeenCalled();
    s.receive("edit-ready");
    s.receive("edit-change", { scope: "page", next: { "0": "Example Header" } });
    s.receive("edit-change", { scope: "Header", next: { "style:0": '{"font-weight":"700"}' } });
    expect(s.props.onChange).toHaveBeenCalledWith("page", { "0": "Example Header" });
    expect(s.props.onChange).toHaveBeenCalledWith("Header", { "style:0": '{"font-weight":"700"}' });
    s.receive("edit-change", { scope: "page", next: { "link:0": '{"href":"javascript:alert(1)"}' } });
    expect(s.props.onChange).toHaveBeenCalledTimes(2);
  });
  it("adapts selections, reorder, collapse and object entry", () => {
    const s = setup(); s.receive("edit-ready");
    s.receive("edit-select", { selection: { key: "0", scope: "page", kind: "text", tag: "h1", text: "Example Header", rect: { width: 600, height: 48 }, style: { fontSize: "40px" } } });
    expect(s.props.onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "0", scope: "page", kind: "text", el: expect.any(HTMLElement) }));
    s.receive("edit-toggle", { key: "0" });
    expect(s.props.onToggle).toHaveBeenCalledWith("0");
    s.receive("edit-open-object", { key: "Categories", section: "0" });
    expect(s.props.onOpenObject).toHaveBeenCalledWith("Categories", "0");
    s.receive("edit-reorder", { from: "0", to: "1", after: true, all: [{ key: "0", parent: "" }, { key: "1", parent: "" }] });
    expect(s.props.onReorder).toHaveBeenCalledWith(expect.objectContaining({ key: "0", parent: "" }), expect.objectContaining({ key: "1", parent: "" }), true, expect.any(Array));
  });
  it("sends edit-exit on discard/exit and once on unmount", () => {
    const apiRef = { current: null as FramedEditorController | null };
    const s = setup({ apiRef }); s.receive("edit-ready");
    act(() => apiRef.current?.exit());
    s.receive("edit-change", { scope: "page", next: { "0": "Late" } });
    expect(s.props.onChange).not.toHaveBeenCalled();
    s.unmount();
    expect(s.send.mock.calls.filter(([message]) => message.type === "edit-exit")).toHaveLength(1);
    expect(s.send).toHaveBeenLastCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
  });
  it("sends edit-exit when leaving without explicit discard", () => {
    const s = setup(); s.receive("edit-ready"); s.unmount();
    expect(s.send).toHaveBeenLastCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
  });
  it("reloads exactly once for a held section revision, not inline edits or failing loads", () => {
    vi.useFakeTimers();
    const s = setup({ sectionRevision: 0 }); s.receive("edit-ready");
    s.rerender(<FramedPageEditor {...s.props} sectionRevision={1} />);
    const changed = s.container.querySelector("iframe");
    expect(changed).not.toBe(s.frame);
    expect(s.container.querySelectorAll("iframe")).toHaveLength(1);
    s.rerender(<FramedPageEditor {...s.props} sectionRevision={1} edits={{ "0": "Held text" }} />);
    expect(s.container.querySelector("iframe")).toBe(changed);
    if (!changed) throw new Error("Missing reloaded frame");
    fireEvent.error(changed);
    act(() => vi.advanceTimersByTime(60000));
    expect(s.container.querySelector("iframe")).toBe(changed);
    expect(s.container.querySelectorAll("iframe")).toHaveLength(1);
  });
  it("uses correlated queries for missing computed style and measurements", async () => {
    const s = setup(); s.receive("edit-ready");
    s.receive("edit-select", { selection: { key: "0", scope: "page", kind: "image", tag: "img", attrs: { src: "/test.jpg" } } });
    const messages = s.send.mock.calls.map(([m]) => m).filter((m) => m.type === "edit-query");
    expect(messages.map((m) => m.op)).toEqual(["computed", "measure"]);
    await act(async () => {
      for (const m of messages) s.receive("edit-reply", { id: m.id, ok: true, result: m.op === "computed" ? { objectFit: "contain" } : { width: 800, height: 400 } });
    });
    const selection = vi.mocked(s.props.onSelect).mock.calls.at(-1)?.[0];
    if (!selection) throw new Error("Missing selection");
    expect(selectionComputedStyle(selection.el).objectFit).toBe("contain");
    expect(selection.el.getBoundingClientRect().width).toBe(800);
  });
});
it("builds inert panel-compatible text, link, geometry and computed data from a snapshot", () => {
  const selection = remoteSelection({ key: "0.1", scope: "Header", kind: "text", tag: "span", text: "Example Header", html: "<strong>Example Header</strong>", rect: { width: 400, height: 50 }, attrs: { alt: "Test" }, style: { fontSize: "32px", "border-top-width": "2px" }, link: { key: "0", scope: "Header", attrs: { href: "/contact", target: "_blank" } } });
  expect(selection.el.textContent).toBe("Example Header");
  expect(selection.el.innerHTML).toBe("<strong>Example Header</strong>");
  expect(selection.el.getBoundingClientRect().height).toBe(50);
  expect(selectionComputedStyle(selection.el).fontSize).toBe("32px");
  expect(selectionComputedStyle(selection.el).getPropertyValue("border-top-width")).toBe("2px");
  expect(selection.el.closest("a")).toBe(selection.link?.el);
  if (!selection.link) throw new Error("Missing link");
  expect(originalLink(selection.link.el)).toEqual({ href: "/contact", target: "_blank" });
  expect(selection.el.isConnected).toBe(false);
});