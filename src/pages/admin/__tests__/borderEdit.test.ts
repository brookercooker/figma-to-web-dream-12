import { describe, expect, it } from "vitest";
import { setAllSides, setBorderPart, isMixed } from "../borderEdit";
import { createReplay, validateEdits } from "@/lib/inlineEditCore";

const none = () => "";
const bottomOnly = (p: string) => ({
  "border-bottom-width": "1px", "border-bottom-style": "solid", "border-bottom-color": "rgb(0, 0, 0)",
} as Record<string, string>)[p] ?? (p.endsWith("-style") ? "none" : p.endsWith("-width") ? "0px" : "rgb(0, 0, 0)");

describe("whole-border editing", () => {
  it("all-sides width writes four equal sides with accepted keys", () => {
    const s = setAllSides({}, none, "width", "2px");
    for (const side of ["top", "right", "bottom", "left"]) expect(s[`border-${side}-width`]).toBe("2px");
    expect(validateEdits({ "style:0": JSON.stringify(s) }).rejected).toEqual([]);
  });
  it("Mixed state (bottom only) applies to every side", () => {
    expect(isMixed({}, bottomOnly)).toBe(true);
    const s = setAllSides({}, bottomOnly, "color", "red");
    for (const side of ["top", "right", "bottom", "left"]) {
      expect(s[`border-${side}-color`]).toBe("red");
      expect(s[`border-${side}-style`]).toBe("solid");
      expect(s[`border-${side}-width`]).toBe("1px");
    }
    expect(isMixed(s, bottomOnly)).toBe(false);
  });
  it("none removes the whole border", () => {
    const s = setAllSides({}, bottomOnly, "style", "none");
    for (const side of ["top", "right", "bottom", "left"]) expect(s[`border-${side}-style`]).toBe("none");
  });
  it("individual mode changes one side only", () => {
    expect(setBorderPart({}, "width", "3px", ["left"])).toEqual({ "border-left-width": "3px" });
  });
  it("Reset Element restores the original border exactly", () => {
    const root = document.createElement("div");
    root.innerHTML = '<div style="border-bottom: 1px solid red;">x</div>';
    const el = root.children[0] as HTMLElement, before = el.getAttribute("style");
    const replay = createReplay();
    replay.apply(root, { "style:0": JSON.stringify(setAllSides({}, none, "width", "4px")) });
    expect(el.style.borderTopWidth).toBe("4px");
    replay.apply(root, {}); // Reset deletes the style:<path> key.
    expect(el.getAttribute("style")).toBe(before);
  });
});
