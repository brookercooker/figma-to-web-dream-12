import { describe, expect, it } from "vitest";
import { inlineEditAction, ManualEditHistory, manualHistoryShortcut, type ManualEditSnapshot } from "../designChat/manualEditHistory";
const initial = (): ManualEditSnapshot => ({ blocks: [], inlineEdits: {}, objectEdits: {} });
describe("local edit history", () => {
  it("word formatting remains a separate style step rather than merged typing", () => {
    expect(inlineEditAction("page", { "0": "Words" }, { "0": "<b>Words</b>" })).toEqual({ label: "style change" });
  });
  it.each(["wording", "style", "placeholder", "add", "remove", "replace", "move", "video settings", "shared object"])("%s is one snapshot action", label => {
    const h = new ManualEditHistory(); const a = initial(); const b = { ...a, inlineEdits: { "0": label } };
    h.record(a, b, { label }); expect(h.undo()).toEqual(a); expect(h.undo()).toBeNull(); expect(h.redo()).toEqual(b);
  });
  it.each(["0", "placeholder:0"])("merges consecutive typing on %s within 1 second", key => {
    const h = new ManualEditHistory(); const a = initial(); const b = { ...a, inlineEdits: { [key]: "a", "fp:0": "metadata" } }; const c = { ...b, inlineEdits: { ...b.inlineEdits, [key]: "ab" } };
    h.record(a, b, inlineEditAction("page", a.inlineEdits, b.inlineEdits), 0);
    h.record(b, c, inlineEditAction("page", b.inlineEdits, c.inlineEdits), 999);
    expect(h.undo()).toEqual(a); expect(h.undo()).toBeNull(); expect(h.redo()).toEqual(c);
  });
  it("does not merge different targets, scopes, styles or typing more than 1 second apart", () => {
    const h = new ManualEditHistory(); let before = initial();
    for (const [scope, key, time] of [["page", "0", 0], ["page", "0", 1001], ["page", "1", 1200], ["Header", "1", 1300], ["page", "style:1", 1400], ["page", "style:1", 1500]] as const) {
      const after = { ...before, inlineEdits: { ...before.inlineEdits, [key]: String(time) } };
      h.record(before, after, inlineEditAction(scope, before.inlineEdits, after.inlineEdits), time); before = after;
    }
    let count = 0; while (h.undo()) count++; expect(count).toBe(6);
  });
  it("clears redo after a new action and caps history at 100", () => {
    const h = new ManualEditHistory(); let before = initial();
    for (let n = 0; n < 101; n++) { const after = { ...before, inlineEdits: { "0": String(n) } }; h.record(before, after, { label: "style change" }); before = after; }
    let count = 0; while (h.undo()) count++; expect(count).toBe(100);
    h.record(initial(), before, { label: "new action" }); expect(h.redo()).toBeNull();
    h.reset(); expect(h.undoLabel).toBe(""); expect(h.redoLabel).toBe("");
  });
  it("ignores unchanged snapshots and protects snapshots from later mutation", () => {
    const h = new ManualEditHistory(); const a = initial(); const b = { ...a, inlineEdits: { "0": "next" } };
    expect(h.record(a, a, { label: "none" })).toBe(false);
    h.record(a, b, { label: "text change" }); b.inlineEdits["0"] = "mutated";
    h.undo(); expect(h.redo()?.inlineEdits).toEqual({ "0": "next" });
  });
});
describe("manager keyboard shortcuts", () => {
  it.each([["z", true, false, false, "undo"], ["z", false, true, false, "undo"], ["z", true, false, true, "redo"], ["z", false, true, true, "redo"], ["y", true, false, false, "redo"]] as const)("handles key %s", (key, ctrlKey, metaKey, shiftKey, expected) => {
    expect(manualHistoryShortcut(new KeyboardEvent("keydown", { key, ctrlKey, metaKey, shiftKey }))).toBe(expected);
  });
  it.each(["input", "textarea", "select", "editable"])("leaves native %s undo untouched", tag => {
    const el = document.createElement(tag === "editable" ? "div" : tag);
    if (tag === "editable") el.setAttribute("contenteditable", "true");
    const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true }); Object.defineProperty(event, "target", { value: el });
    expect(manualHistoryShortcut(event)).toBeNull();
  });
  it("ignores unmodified, alt and already-handled keys", () => {
    expect(manualHistoryShortcut(new KeyboardEvent("keydown", { key: "z" }))).toBeNull();
    expect(manualHistoryShortcut(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, altKey: true }))).toBeNull();
    const e = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true }); e.preventDefault(); expect(manualHistoryShortcut(e)).toBeNull();
  });
});