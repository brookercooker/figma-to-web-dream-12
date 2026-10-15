import { describe, it, expect } from "vitest";
import type { Approval, RelayState } from "../helper";
import { approvalView, isWorking, visibleText, workLabel } from "../logic";

const base: Approval = { id: "a1", title: "Change the site's database", detail: "x", rule: "ok", editorUrl: "https://editor.example", createdAt: 0, deciding: false };
const state = (busy: boolean, status: string): RelayState => ({ busy, job: { status, startedAt: 0 }, previewVersion: 0, history: [] });

describe("approvalView", () => {
  it("admin, rule ok", () => {
    const v = approvalView(base, true);
    expect(v.canApprove).toBe(true);
    expect(v.canDecline).toBe(true);
    expect(v.note).toBe("");
  });
  it("non-admin", () => {
    const v = approvalView(base, false);
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(false);
    expect(v.note.startsWith("Waiting for an admin")).toBe(true);
  });
  it("rule editor", () => {
    const a = { ...base, rule: "editor" as const };
    const v = approvalView(a, true);
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(true);
    expect(v.editorUrl).toBe("https://editor.example");
    expect(approvalView(a, false).editorUrl).toBeNull();
  });
  it("rule never", () => {
    const v = approvalView({ ...base, rule: "never" }, true);
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(true);
  });
  it("deciding", () => {
    const v = approvalView({ ...base, deciding: true }, true);
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(false);
  });
});

describe("approval notes and status", () => {
  it("visibleText", () => {
    expect(visibleText({ role: "note", text: "Approval needed: Change the site's database" })).toBeNull();
    const g = "Approval granted by pat@example.com: Change the site's database";
    expect(visibleText({ role: "note", text: g })).toBe(g);
    expect(visibleText({ role: "note", text: "This change is paused for a check-in that can only be answered in the builder's own editor. Ask an admin to open the project there and continue it, or rephrase the request." }))
      .toBe("This change is paused for a check-in that only an admin can answer in the builder's own editor. Ask an admin, or try rewording the request.");
  });
  it("workLabel", () => {
    expect(workLabel({ kind: "change", status: "approval", startedAt: 0 })).toBe("Waiting for an approval…");
  });
  it("isWorking", () => {
    expect(isWorking(state(true, "approval"))).toBe(false);
    expect(isWorking(state(true, "working"))).toBe(true);
  });
});
