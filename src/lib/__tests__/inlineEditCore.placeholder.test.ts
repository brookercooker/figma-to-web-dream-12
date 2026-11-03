import { describe, it, expect } from "vitest";
import { createReplay, validateEdits } from "@/lib/inlineEditCore";
import { validSnapshot } from "@/pages/admin/remoteSelection";

describe("placeholder edits", () => {
  it("rejects unsupported placeholder edits without altering a form field's hint", () => {
    const root = document.createElement("div");
    root.innerHTML = '<form><input placeholder="Your name"></form>';
    const r = createReplay();
    const rep = r.apply(root, { "placeholder:0.0": "Full name" });
    expect(rep.applied).toEqual([]);
    expect(rep.rejected).toEqual([{ key: "placeholder:0.0", reason: "Unknown edit key or invalid path" }]);
    expect(root.querySelector("input")?.getAttribute("placeholder")).toBe("Your name");
    r.apply(root, {});
    expect(root.querySelector("input")?.getAttribute("placeholder")).toBe("Your name");
  });
  it("rejects hints over 300 characters", () => {
    expect(validateEdits({ "placeholder:0": "x".repeat(301) }).rejected).toHaveLength(1);
  });
  it("accepts both input and older field selections", () => {
    for (const kind of ["input", "field"]) expect(validSnapshot({ key: "0.1", scope: "page", kind, tag: "input" })).toBe(true);
  });
});
