import { describe, expect, it } from "vitest";
import { parseFrameSections } from "../frameSections";
const row = (key: string, kind = "page") => ({ key, name: key, kind, collapsed: false, movable: true, deletable: true });
describe("frame section list", () => {
  it("pins Header first and Footer last and forbids site mutations", () => {
    expect(parseFrameSections([row("site-footer", "site"), row("Categories", "object"), row("site-header", "site")])).toEqual([
      { ...row("site-header", "site"), movable: false, deletable: false }, row("Categories", "object"), { ...row("site-footer", "site"), movable: false, deletable: false },
    ]);
  });
  it("rejects duplicates and malformed or unbounded lists", () => {
    expect(parseFrameSections([row("a"), row("a")])).toBeNull();
    expect(parseFrameSections([{ ...row("a"), collapsed: "yes" }])).toBeNull();
    expect(parseFrameSections(Array.from({ length: 501 }, (_, i) => row(String(i))))).toBeNull();
    expect(parseFrameSections([])).toEqual([]);
  });
});