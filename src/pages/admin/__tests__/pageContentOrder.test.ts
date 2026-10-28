import { describe, expect, it } from "vitest";
import { PAGE_CONTENT, movePageBlock, orderedPageContent, parsePageContent } from "../pageContentOrder";
import { parseBlocks, type TextBlock } from "@/components/PageBlocks";
const a: TextBlock = { id: "a", type: "text", text: "A", align: "left", size: "md" };
const b = { ...a, id: "b" };
describe("page content ordering", () => {
  it("inserts one marker when a component moves above page content", () => {
    expect(movePageBlock([a, b], "a", 0)).toEqual([a, PAGE_CONTENT, b]);
  });
  it("removes the marker when page content becomes first again", () => {
    expect(movePageBlock([a, PAGE_CONTENT, b], "a", 1)).toEqual([a, b]);
  });
  it("clamps moves and does not move the marker or unknown ids", () => {
    expect(movePageBlock([a, b], "a", 999)).toEqual([b, a]);
    expect(movePageBlock([a], "page-content", 1)).toEqual([a]);
    expect(movePageBlock([a], "missing", 0)).toEqual([a]);
  });
  it("keeps a single marker and consumers ignore it", () => {
    expect(parsePageContent([a, PAGE_CONTENT, b, PAGE_CONTENT])).toEqual([a, PAGE_CONTENT, b]);
    expect(parseBlocks(JSON.stringify([a, PAGE_CONTENT, b]))).toEqual([a, b]);
    expect(orderedPageContent([a])).toEqual([PAGE_CONTENT, a]);
  });
});