import { describe, it, expect } from "vitest";
import { createReplay, validateEdits } from "@/lib/inlineEditCore";
import { validSnapshot } from "@/pages/admin/remoteSelection";

describe("placeholder edits", () => {
  it("accepts placeholder keys without claiming to mutate hints in the shared replay", () => {
    const root = document.createElement("div");
    root.innerHTML = '<form><input placeholder="Your name"></form>';
    const r = createReplay();
    const rep = r.apply(root, { "placeholder:0.0": "Full name" });
    expect(rep.applied).toEqual(["placeholder:0.0"]);
    expect(rep.rejected).toEqual([]);
    expect(root.querySelector("input")?.getAttribute("placeholder")).toBe("Your name");
    r.apply(root, {});
    expect(root.querySelector("input")?.getAttribute("placeholder")).toBe("Your name");
  });
  it("rejects hints over 300 characters", () => {
    expect(validateEdits({ "placeholder:0": "x".repeat(301) })).toEqual({
      ok: {}, rejected: [{ key: "placeholder:0", reason: "Placeholder must be at most 300 characters" }],
    });
  });
  it("accepts empty and 300-character placeholders", () => {
    const edits = { "placeholder:0": "", "placeholder:1": "x".repeat(300) };
    expect(validateEdits(edits)).toEqual({ ok: edits, rejected: [] });
  });
  it("validates a persisted mixed map containing hidden and placeholder keys in full", () => {
    const saved = JSON.parse(JSON.stringify({
      "hidden:0.0": "1",
      "placeholder:0.1": "Full name",
      "0.2": "Contact us",
      "icon:0.2": "Mail",
      "icon-position:0.2": "before",
      "link:0.2": '{"href":"/contact"}',
      "fp:0.0": '{"v":1,"tag":"img","t":"original","s":"picture"}',
    }));
    expect(validateEdits(saved)).toEqual({ ok: saved, rejected: [] });
  });
  it.each(["0", "true", "", " 1", 1, true])("rejects hidden values other than the string 1: %j", value => {
    expect(validateEdits({ "hidden:0": value }).ok).toEqual({});
    expect(validateEdits({ "hidden:0": value }).rejected).toHaveLength(1);
  });
  it("rejects non-string placeholders", () => {
    expect(validateEdits({ "placeholder:0": 123 })).toEqual({
      ok: {}, rejected: [{ key: "placeholder:0", reason: "Edit must be a string" }],
    });
  });
  it("still rejects unknown kinds while retaining valid saved keys", () => {
    expect(validateEdits({ "hidden:0": "1", "placeholder:1": "Name", "unknown:2": "value" })).toEqual({
      ok: { "hidden:0": "1", "placeholder:1": "Name" },
      rejected: [{ key: "unknown:2", reason: "Unknown edit key or invalid path" }],
    });
  });
  it("accepts both input and older field selections", () => {
    for (const kind of ["input", "field"]) expect(validSnapshot({ key: "0.1", scope: "page", kind, tag: "input" })).toBe(true);
  });
});
