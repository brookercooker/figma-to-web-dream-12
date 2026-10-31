import { describe, expect, it } from "vitest";
import { parseFrameSections } from "../frameSections";
const row = (key: string, kind = "page") => ({ key, name: key, kind, collapsed: false, movable: true, deletable: true });
describe("frame section list", () => {
  it("keeps drag handles out of section names", () => {
    expect(parseFrameSections([{ ...row("about"), name: "⠇ About Us" }])?.[0].name).toBe("About Us");
  });
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
  it.each([
    ["Shared object: Categories", "Categories"],
    ["Shared object · You May Like", "You May Like"],
    ["Hinkley · Shared object: Hinkley New Arrivals", "Hinkley New Arrivals"],
    ["Categories", "Categories"],
    ["Categories · New Arrivals", "Categories · New Arrivals"],
  ])("normalizes object metadata in %s without changing identity", (name, expected) => {
    const section = { ...row("categories", "object"), name, objectId: "object-123" };
    expect(parseFrameSections([section])).toEqual([{ ...section, name: expected }]);
  });
  it("normalizes held object names but preserves non-object section names", () => {
    const name = "Shared object: Categories";
    const held = { ...row("held", "held"), name, objectId: "object-123" };
    const page = { ...row("page"), name };
    expect(parseFrameSections([held, page])).toEqual([{ ...held, name: "Categories" }, page]);
  });
});