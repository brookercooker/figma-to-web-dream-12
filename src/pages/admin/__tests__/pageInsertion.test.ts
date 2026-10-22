import { describe, expect, it } from "vitest";
import { insertPickedBlock, pageInsertPosition } from "../pageInsertion";

describe("page insertion", () => {
  const blocks = [{ id: "first" }, { id: "second" }, { id: "third" }];
  it("inserts after the selected block", () => {
    expect(pageInsertPosition(blocks, "second")).toBe(2);
  });
  it("appends without a selected block", () => {
    expect(pageInsertPosition(blocks, "")).toBe(3);
    expect(pageInsertPosition(blocks, "missing")).toBe(3);
    expect(pageInsertPosition([], "")).toBe(0);
  });
  it("uses explicit row and gap positions instead of the selection", () => {
    expect(pageInsertPosition(blocks, "second", 0)).toBe(0);
    expect(pageInsertPosition(blocks, "first", 3)).toBe(3);
    expect(pageInsertPosition(blocks, "third", 1)).toBe(1);
  });
  it("clamps explicit positions to the page bounds", () => {
    expect(pageInsertPosition(blocks, "second", -2)).toBe(0);
    expect(pageInsertPosition(blocks, "second", 99)).toBe(3);
  });
  it.each(["image", "video"])("leaves the list unchanged for a cancelled %s pick", () => {
    expect(insertPickedBlock(blocks, null, 1)).toBe(blocks);
    expect(blocks).toEqual([{ id: "first" }, { id: "second" }, { id: "third" }]);
  });
  it("inserts a completed pick at the remembered position", () => {
    expect(insertPickedBlock(blocks, { id: "picked" }, 1).map((b) => b.id)).toEqual(["first", "picked", "second", "third"]);
  });
});