import { describe, it, expect } from "vitest";
import type { Approval, ApprovalField, RelayState } from "../helper";
import { approvalView, isWorking, missingField, visibleText, workLabel } from "../logic";

const base: Approval = { id: "a1", title: "Change the site's database", detail: "x", kind: "action", rule: "ok", editorUrl: "https://editor.example", fields: null, createdAt: 0, deciding: false };
const state = (busy: boolean, status: string): RelayState => ({ busy, job: { status, startedAt: 0 }, previewVersion: 0, history: [] });

describe("approvalView", () => {
  it("rule ok", () => {
    const v = approvalView(base);
    expect(v.canApprove).toBe(true);
    expect(v.canDecline).toBe(true);
    expect(v.note).toBe("");
    expect(v.approveLabel).toBe("Approve");
    expect(approvalView({ ...base, kind: "plan" }).approveLabel).toBe("Approve plan");
  });
  it("rule editor", () => {
    const v = approvalView({ ...base, rule: "editor" });
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(true);
    expect(v.editorUrl).toBe("https://editor.example");
    expect(approvalView(base).editorUrl).toBeNull();
    expect(approvalView({ ...base, rule: "never" }).editorUrl).toBeNull();
  });
  it("rule never", () => {
    const v = approvalView({ ...base, rule: "never" });
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(true);
  });
  it("deciding", () => {
    const v = approvalView({ ...base, deciding: true });
    expect(v.canApprove).toBe(false);
    expect(v.canDecline).toBe(false);
  });
});

describe("missingField", () => {
  const fields: ApprovalField[] = [
    { key: "name", label: "Name", kind: "text", required: true },
    { key: "ok", label: "Agree", kind: "yesno", required: true },
    { key: "extra", label: "Extra", kind: "text", required: false },
  ];
  it("null when no fields", () => {
    expect(missingField(null, {})).toBeNull();
    expect(missingField([], {})).toBeNull();
  });
  it("null when required filled (yesno false counts)", () => {
    expect(missingField(fields, { name: "Pat", ok: false })).toBeNull();
  });
  it("first missing required label", () => {
    expect(missingField(fields, {})).toBe("Name");
    expect(missingField(fields, { name: "Pat" })).toBe("Agree");
  });
  it("whitespace counts as missing", () => {
    expect(missingField(fields, { name: "   ", ok: true })).toBe("Name");
  });
});

describe("approval notes and status", () => {
  it("visibleText", () => {
    expect(visibleText({ role: "note", text: "Approval needed: Change the site's database" })).toBeNull();
    const g = "Approval granted by pat@example.com: Change the site's database";
    expect(visibleText({ role: "note", text: g })).toBe(g);
    expect(visibleText({ role: "note", text: "This change is paused for a check-in that can only be answered in the builder's own editor. Someone with access to the builder's editor needs to continue it there, or you can rephrase the request." }))
      .toBe("This change is paused for a check-in that can only be answered in the builder's own editor. Someone with access to the builder's editor needs to continue it there, or you can try rewording the request.");
  });
  it("workLabel", () => {
    expect(workLabel({ kind: "change", status: "approval", startedAt: 0 })).toBe("Waiting for an approval…");
  });
  it("isWorking", () => {
    expect(isWorking(state(true, "approval"))).toBe(false);
    expect(isWorking(state(true, "working"))).toBe(true);
  });
});
