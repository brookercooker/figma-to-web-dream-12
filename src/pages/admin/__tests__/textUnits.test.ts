import { expect, it } from "vitest";
import { spacingPixels, lineHeightMultiplier } from "../textUnits";
it("displays existing letter spacing in px", () => {
  expect(spacingPixels("0.2em", "20px")).toBe("4");
  expect(spacingPixels("0.25rem", "20px")).toBe("4");
  expect(spacingPixels("4px", "20px")).toBe("4");
});
it("displays line height as a unitless multiplier", () => {
  expect(lineHeightMultiplier("30px", "20px")).toBe("1.5");
  expect(lineHeightMultiplier("150%", "20px")).toBe("1.5");
  expect(lineHeightMultiplier("1.5", "20px")).toBe("1.5");
});