import { describe, expect, it } from "vitest";
import { retainTextOrigins } from "../textEditOrigins";
import { editMap } from "../framedPageProtocol";
import { withoutPath } from "@/lib/inlineEditCore";
import { inlineEditAction, ManualEditHistory } from "../designChat/manualEditHistory";
import { previewContentPayload } from "../designChat/previewContent";

describe("coded text originals", () => {
  it("saves the first original for existing and text-prefixed keys", () => {
    expect(retainTextOrigins({}, { "0.1": "Hand edit" }, { "0.1": "Coded text" })).toEqual({ "0.1": "Hand edit", "orig:0.1": "Coded text" });
    expect(retainTextOrigins({}, { "text:0.1": "Hand edit" }, { "0.1": "Coded text" })).toEqual({ "text:0.1": "Hand edit", "orig:text:0.1": "Coded text" });
  });
  it("retains saved originals and leaves legacy edits unchanged", () => {
    expect(retainTextOrigins({ "0": "Old edit", "orig:0": "First code" }, { "0": "Next edit" }, { "0": "New code" })).toEqual({ "0": "Next edit", "orig:0": "First code" });
    expect(retainTextOrigins({ "0": "Legacy" }, { "0": "Changed" }, { "0": "Unknown old code" })).toEqual({ "0": "Changed" });
  });
  it("removes metadata with Restore Original and whole-map reset", () => {
    const edits = { "0.1": "Edit", "orig:0.1": "Code", "style:0.1": "{}", "text:0.2": "Second", "orig:text:0.2": "Second code" };
    expect(retainTextOrigins(edits, withoutPath(edits, "0.1"))).toEqual({ "text:0.2": "Second", "orig:text:0.2": "Second code" });
    expect(retainTextOrigins(edits, {})).toEqual({});
    expect(retainTextOrigins(edits, { "orig:0.1": "Code" })).toEqual({});
  });
  it("accepts only valid text metadata without changing or interpreting it", () => {
    const edits = { "0": "Edit", "orig:0": "<script>data only</script>", "text:0.1": "Edit two", "orig:text:0.1": "Code two" };
    expect(editMap(edits)).toEqual(edits);
    expect(editMap({ "orig:style:0": "Code" })).toBeNull();
    expect(editMap({ "orig:0": 2 })).toBeNull();
  });
  it("undo/redo retains originals and explicit restoration updates the baseline", () => {
    const before = { blocks: [], inlineEdits: { "0": "My edit", "orig:0": "Old code" }, objectEdits: {} };
    const after = { ...before, inlineEdits: { ...before.inlineEdits, "orig:0": "New code" } };
    const h = new ManualEditHistory();
    h.record(before, after, inlineEditAction("page", before.inlineEdits, after.inlineEdits));
    expect(h.undo()).toEqual(before);
    expect(h.redo()).toEqual(after);
    expect(retainTextOrigins(before.inlineEdits, after.inlineEdits)).toEqual(after.inlineEdits);
    expect(inlineEditAction("page", {}, { "0": "Edit", "orig:0": "Code" }).mergeKey).toBe("page|html|0");
  });
  it("carries original metadata unchanged for both page and object packages", () => {
    const edits = { "0": "Edit", "orig:0": "Code", "text:0.1": "Edit two", "orig:text:0.1": "Code two" };
    const payload = previewContentPayload([{ path: "/", build_status: "ready", inline_edits: edits }], [{ id: "object", name: "Object", inline_edits: edits }]);
    expect(payload.pages[0].inline_edits).toEqual(edits);
    expect(payload.objects[0].inline_edits).toEqual(edits);
  });
});