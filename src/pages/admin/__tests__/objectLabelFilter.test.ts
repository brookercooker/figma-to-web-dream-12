import { describe, expect, it } from "vitest";
import { countObjectLabels, filterObjects, hiddenSelectedCount, objectLabels, recentObjectLabels } from "../objectLabelFilter";
const items = [
  { id: "a", name: "Welcome", labels: [" Hero ", "hero", "Photo", ""] },
  { id: "b", name: "Gallery", labels: ["HERO", "Footer"] },
  { id: "c", name: "Contact", description: "Photo form", labels: null },
];
describe("object label filtering", () => {
  it("counts once per object, merges casing, trims and orders by popularity", () => {
    expect(countObjectLabels(items)).toEqual([{ key: "hero", name: "Hero", count: 2 }, { key: "footer", name: "Footer", count: 1 }, { key: "photo", name: "Photo", count: 1 }]);
  });
  it("ignores null and empty labels", () => {
    expect(objectLabels(items[2])).toEqual([]);
    expect(countObjectLabels([{ id: "x", name: "X", labels: ["  "] }])).toEqual([]);
  });
  it("matches any selected label by default and all in all mode", () => {
    const labels = new Set([" HERO ", "photo"]);
    expect(filterObjects(items, "", labels, "any").map(o => o.id)).toEqual(["a", "b"]);
    expect(filterObjects(items, "", labels, "all").map(o => o.id)).toEqual(["a"]);
  });
  it("combines search with labels and preserves description and label search", () => {
    expect(filterObjects(items, "gallery", new Set(["hero"]), "any").map(o => o.id)).toEqual(["b"]);
    expect(filterObjects(items, "photo", new Set(), "any").map(o => o.id)).toEqual(["a", "c"]);
    expect(filterObjects(items, "contact", new Set(["hero"]), "any")).toEqual([]);
  });
  it("counts selected objects hidden by filters", () => {
    expect(hiddenSelectedCount(new Set(["a", "b"]), [items[0]])).toBe(1);
    expect(hiddenSelectedCount(new Set(["a"]), items)).toBe(0);
  });
  it("keeps only the last three distinct recently selected labels", () => {
    expect(recentObjectLabels(["photo", "hero", "footer"], " HERO ")).toEqual(["hero", "photo", "footer"]);
  });
});