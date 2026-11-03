import { describe, expect, it } from "vitest";
import { matchesObjectPickerFilter } from "../objectPickerFilter";

const row = (labels: string[] | null, name = "Hero") => ({ labels, search: (term: string) => name.toLowerCase().includes(term.toLowerCase()) });

describe("Chat object picker matching", () => {
  it("matches one label", () => {
    expect(matchesObjectPickerFilter(row(["Homepage"]), "", ["Homepage"], "any")).toBe(true);
    expect(matchesObjectPickerFilter(row(["Brand"]), "", ["Homepage"], "any")).toBe(false);
  });
  it("combines two labels with Any", () => {
    expect(matchesObjectPickerFilter(row(["Homepage"]), "", ["Homepage", "Marketing"], "any")).toBe(true);
    expect(matchesObjectPickerFilter(row(["Brand"]), "", ["Homepage", "Marketing"], "any")).toBe(false);
  });
  it("requires both labels with All", () => {
    expect(matchesObjectPickerFilter(row(["Homepage", "Marketing"]), "", ["Homepage", "Marketing"], "all")).toBe(true);
    expect(matchesObjectPickerFilter(row(["Homepage"]), "", ["Homepage", "Marketing"], "all")).toBe(false);
  });
  it("matches descendants for each parent before combining", () => {
    const child = row(["Homepage/Hero", "Marketing/Campaign/Summer"]);
    expect(matchesObjectPickerFilter(child, "", ["Homepage", "Marketing"], "all")).toBe(true);
    expect(matchesObjectPickerFilter(row(["HomepageElse/Hero"]), "", ["Homepage"], "any")).toBe(false);
  });
  it("combines search with labels", () => {
    expect(matchesObjectPickerFilter(row(["Homepage"]), "hero", ["Homepage"], "any")).toBe(true);
    expect(matchesObjectPickerFilter(row(["Homepage"]), "footer", ["Homepage"], "any")).toBe(false);
    expect(matchesObjectPickerFilter(row(["Brand"]), "hero", ["Homepage"], "any")).toBe(false);
  });
  it("returns all labels including null when no labels are selected", () => {
    for (const labels of [null, [], ["Brand"]]) {
      expect(matchesObjectPickerFilter(row(labels), "", [], "any")).toBe(true);
      expect(matchesObjectPickerFilter(row(labels), "", [], "all")).toBe(true);
    }
  });
});