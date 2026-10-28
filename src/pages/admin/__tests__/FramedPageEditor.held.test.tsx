import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FramedPageEditor, { type FramedPageEditorProps } from "../FramedPageEditor";
import { clampEditSize, heldBlocksPayload } from "../framedPageProtocol";

afterEach(() => cleanup());
const blocks = [{ id: "a", type: "text", html: "A" }, { id: "b", type: "text", html: "B" }];
function setup(patch: Partial<FramedPageEditorProps> = {}) {
  const props: FramedPageEditorProps = { base: "https://public.example.com/", path: "/draft", edits: {}, objectEdits: {}, collapsed: new Set(), selectedKey: null,
    onChange: vi.fn(), onSelect: vi.fn(), onToggle: vi.fn(), onReorder: vi.fn(), onOpenObject: vi.fn(), heldBlocks: blocks, activeBlockId: null,
    onBlockSelect: vi.fn(), onHeldInFrame: vi.fn(), sectionRevision: 0, ...patch };
  const view = render(<FramedPageEditor {...props} />);
  const frame = () => view.container.querySelector("iframe")!;
  const w = frame().contentWindow!;
  const send = vi.spyOn(w, "postMessage").mockImplementation(() => {});
  const receive = (type: string, payload = {}, origin = "https://public.example.com", source: MessageEventSource | null = frame().contentWindow) =>
    act(() => { window.dispatchEvent(new MessageEvent("message", { origin, source, data: { source: "nova-site", type, ...payload } })); });
  const sent = (type: string) => send.mock.calls.map((c) => c[0] as any).filter((m) => m.type === type);
  return { ...view, props, frame, send, sent, receive };
}
describe("held blocks payload", () => {
  it("passes ordered blocks and caps count and size", () => {
    expect(heldBlocksPayload(blocks)).toEqual(blocks);
    expect(heldBlocksPayload(Array.from({ length: 51 }, (_, i) => ({ id: String(i) })))).toBeNull();
    expect(heldBlocksPayload([{ id: "x", html: "x".repeat(600_000) }])).toBeNull();
  });
  it("clamps edit-size", () => { expect(clampEditSize(10)).toBe(400); expect(clampEditSize(99999)).toBe(20000); expect(clampEditSize(1500)).toBe(1500); });
});
describe("held blocks handshake", () => {
  it("sends heldBlocks only to capable frames and reports in-frame drawing", () => {
    const s = setup({ activeBlockId: "b" });
    s.receive("edit-ready", { capabilities: { heldBlocks: true } });
    expect(s.sent("edit-init")[0]).toMatchObject({ heldBlocks: blocks, activeBlockId: "b" });
    expect(s.props.onHeldInFrame).toHaveBeenLastCalledWith(true);
  });
  it("keeps the local list without the capability", () => {
    const s = setup();
    s.receive("edit-ready", {});
    expect(s.sent("edit-init")[0].heldBlocks).toBeUndefined();
    expect(s.props.onHeldInFrame).not.toHaveBeenCalledWith(true);
  });
  it("falls back to the local list when too large", () => {
    const big = Array.from({ length: 60 }, (_, i) => ({ id: String(i) }));
    const s = setup({ heldBlocks: big });
    s.receive("edit-ready", { capabilities: { heldBlocks: true } });
    expect(s.sent("edit-init")[0].heldBlocks).toEqual([]);
    expect(s.props.onHeldInFrame).not.toHaveBeenCalledWith(true);
  });
  it("block changes go as edit-update without reload; capability resets on reload", () => {
    const s = setup();
    s.receive("edit-ready", { capabilities: { heldBlocks: true } });
    const first = s.frame();
    const next = [...blocks, { id: "c", type: "text", html: "C" }];
    s.rerender(<FramedPageEditor {...s.props} heldBlocks={next} sectionRevision={1} activeBlockId="c" />);
    expect(s.frame()).toBe(first);
    expect(s.sent("edit-update").at(-1)).toMatchObject({ heldBlocks: next, activeBlockId: "c" });
  });
  it("reloads on section changes when the frame lacks the capability", () => {
    const s = setup();
    s.receive("edit-ready", {});
    const first = s.frame();
    s.rerender(<FramedPageEditor {...s.props} sectionRevision={1} />);
    expect(s.frame()).not.toBe(first);
    expect(s.props.onHeldInFrame).not.toHaveBeenCalledWith(true);
  });
  it("validates edit-block-select", () => {
    const s = setup();
    s.receive("edit-ready", { capabilities: { heldBlocks: true } });
    s.receive("edit-block-select", { id: "a" }, "https://evil.example");
    s.receive("edit-block-select", { id: "zzz" });
    expect(s.props.onBlockSelect).not.toHaveBeenCalled();
    s.receive("edit-block-select", { id: "b" });
    expect(s.props.onBlockSelect).toHaveBeenCalledWith("b");
  });
  it("selects a held block even when the frame's ready message lacked the capability", () => {
    const s = setup();
    s.receive("edit-ready", {});
    s.receive("edit-block-select", { id: "b" });
    expect(s.props.onBlockSelect).toHaveBeenCalledWith("b");
  });
  it("uses clamped edit-size for the frame height", () => {
    const s = setup();
    s.receive("edit-ready", { capabilities: { heldBlocks: true } });
    s.receive("edit-size", { height: 50 });
    expect(s.frame().getAttribute("height")).toBe("400");
    s.receive("edit-size", { height: 3000 });
    expect(s.frame().getAttribute("height")).toBe("3000");
  });
  it("capable frames fill the canvas; others keep 1200 px", () => {
    const a = setup({ fill: true });
    expect(a.frame().getAttribute("height")).toBe("1200");
    a.receive("edit-ready", { capabilities: { heldBlocks: true } });
    expect(a.frame().getAttribute("height")).toBe("100%");
    a.receive("edit-size", { height: 3000 });
    expect(a.frame().getAttribute("height")).toBe("3000");
    cleanup();
    const b = setup({ fill: true });
    b.receive("edit-ready", {});
    expect(b.frame().getAttribute("height")).toBe("1200");
    cleanup();
    const c = setup({ fill: false });
    c.receive("edit-ready", { capabilities: { heldBlocks: true } });
    expect(c.frame().getAttribute("height")).toBe("1200");
  });
});
