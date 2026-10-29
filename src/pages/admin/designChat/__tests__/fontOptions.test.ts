import { describe, expect, it } from "vitest";
import { inheritedFont, inheritedWeight } from "../fontOptions";
describe("inherited fonts", () => {
  it("names the actual computed first font", () => {
    expect(inheritedFont('"Cormorant Garamond", serif', "H2")).toEqual({ family: '"Cormorant Garamond", serif', name: "Cormorant Garamond" });
    expect(inheritedFont("Arial, sans-serif", "P").name).toBe("Arial");
  });
  it("falls back to heading or body fonts", () => {
    expect(inheritedFont("", "H1").name).toBe("Cormorant Garamond");
    expect(inheritedFont(undefined, "P").name).toBe("Figtree");
  });
});
it.each([["400", "Regular"], ["normal", "Regular"], ["300", "Light"], ["600", "Semibold"], ["700", "Bold"], ["bold", "Bold"], [undefined, "Regular"]])("names inherited weight %s", (value, name) => {
  expect(inheritedWeight(value)).toBe(name);
});