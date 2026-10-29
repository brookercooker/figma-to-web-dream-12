import { describe, expect, it } from "vitest";
import { inheritedFont } from "../fontOptions";
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