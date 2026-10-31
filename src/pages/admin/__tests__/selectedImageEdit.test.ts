import { describe, expect, it } from "vitest";
import { selectedImageDelete } from "../selectedImageEdit";
describe("selected page image deletion", () => {
  it("uses reversible hidden edits and ignores text or repeated deletes", () => {
    const selection = { kind: "image" as const, key: "0.2" };
    const original = { "0": "Saved text" };
    const deleted = selectedImageDelete(selection, original);
    expect(deleted).toEqual({ ...original, "hidden:0.2": "1" });
    expect(selectedImageDelete(selection, deleted ?? {})).toBeNull();
    expect(selectedImageDelete(selection, deleted ?? {}, true)).toEqual(original);
    expect(selectedImageDelete({ kind: "text", key: "0.2" }, original)).toBeNull();
  });
});