import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FramedPageEditor, { type FramedPageEditorProps } from "../FramedPageEditor";
import { editFrameUrl, objectEditScope, objectEditorNote, objectFramePath, objectScopePayload } from "../framedPageProtocol";
import { copyPageOf } from "../designChat/ObjectEditorHeader";

afterEach(() => cleanup());
const header = { objectId: "h1", name: "Header", status: "Ready", component_key: "Header", siteWide: true };
const designed = { objectId: "d1", name: "About Us", status: "Draft", component_key: null, siteWide: false };
function setup(patch: Partial<FramedPageEditorProps> = {}) {
  const props: FramedPageEditorProps = { base: "https://public.example.com/", path: objectFramePath("d1"), edits: {}, objectEdits: { "object:d1": { "text:0": "Hi" } }, collapsed: new Set(), selectedKey: null,
    onChange: vi.fn(), onSelect: vi.fn(), onToggle: vi.fn(), onReorder: vi.fn(), onOpenObject: vi.fn(), onNavigate: vi.fn(), onObjectClick: vi.fn(), objectScope: designed, ...patch };
  const view = render(<FramedPageEditor {...props} />);
  const frame = () => view.container.querySelector("iframe")!;
  const send = vi.spyOn(frame().contentWindow!, "postMessage").mockImplementation(() => {});
  const receive = (type: string, payload = {}, origin = "https://public.example.com") =>
    act(() => { window.dispatchEvent(new MessageEvent("message", { origin, source: frame().contentWindow, data: { source: "nova-site", type, ...payload } })); });
  const sent = (type: string) => send.mock.calls.map((c) => c[0] as any).filter((m) => m.type === type);
  return { props, frame, sent, receive };
}
describe("object editor protocol", () => {
  it("opens the single-object public route in edit mode", () => {
    expect(objectFramePath("a b")).toBe("/__object/a%20b");
    expect(editFrameUrl("https://public.example.com/", objectFramePath("d1"))).toBe("https://public.example.com/__object/d1?nova-edit=1");
  });
  it("scopes coded objects by component key and designed objects by id", () => {
    expect(objectEditScope(header)).toBe("Header");
    expect(objectEditScope(designed)).toBe("object:d1");
    expect(objectScopePayload(designed, { "object:d1": { a: "1" } })).toEqual({ scope: "object", objectId: "d1", object: { name: "About Us", status: "Draft", component_key: null, siteWide: false }, inlineEdits: { a: "1" } });
  });
  it("edit-init carries object scope and the object's saved edits unchanged", () => {
    const s = setup(); s.receive("edit-ready", {});
    expect(s.sent("edit-init")[0]).toMatchObject({ scope: "object", objectId: "d1", inlineEdits: { "text:0": "Hi" } });
  });
  it("ignores page navigation and object clicks, and messages from other origins", () => {
    const s = setup(); s.receive("edit-ready", {});
    s.receive("edit-navigate", { path: "/about" });
    s.receive("edit-object-click", { objectId: "x", componentKey: "Y", name: "Y", slot: "s" });
    s.receive("edit-change", { scope: "object:d1", next: { "text:0": "b" } }, "https://evil.example.com");
    expect(s.props.onNavigate).not.toHaveBeenCalled();
    expect(s.props.onObjectClick).not.toHaveBeenCalled();
    expect(s.props.onChange).not.toHaveBeenCalled();
    s.receive("edit-change", { scope: "object:d1", next: { "text:0": "b" } });
    expect(s.props.onChange).toHaveBeenCalledWith("object:d1", { "text:0": "b" });
  });
  it("page frames ask to scroll back to the object after it closes", () => {
    const s = setup({ objectScope: null, path: "/", scrollToSlot: { slot: null, objectId: "d1" } }); s.receive("edit-ready", {});
    expect(s.sent("scroll-to-slot")[0]).toMatchObject({ objectId: "d1" });
    expect(s.sent("edit-init")[0]).not.toHaveProperty("scope");
  });
});
describe("object editor header note", () => {
  it("names site-wide, page-copy and shared objects in plain words", () => {
    expect(objectEditorNote(header, [])).toBe("Site-wide object · shown on every page");
    expect(objectEditorNote(designed, ["Homepage", "About"])).toBe("Shared object · used on Homepage, About");
    const copy = { ...designed, name: "About Us (Contact)", usedOn: ["Contact"] };
    expect(copyPageOf(copy)).toBe("Contact");
    expect(objectEditorNote(copy, copy.usedOn, copyPageOf(copy))).toBe("This copy is only used on Contact");
    expect(copyPageOf({ ...designed, usedOn: ["Contact"] })).toBeNull();
  });
});
