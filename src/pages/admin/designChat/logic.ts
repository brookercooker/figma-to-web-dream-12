/**
 * The rules for what the Design Chat shows. Plain functions (no React) so they can be tested on their own.
 */
import type { Approval, ApprovalField, Entry, Finding, Job, RelayState, UploadRules } from "./helper";

export const IDLE_HINT = "Enter to send · Shift+Enter for a new line";

export const fmtDur = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// ---- the chat history: only what the person can use ------------------------------------------
const NOTES: [RegExp, (text: string) => string][] = [
  [/paused for a check-in/i, () => "This change is paused for a check-in that can only be answered in the builder's own editor. Someone with access to the builder's editor needs to continue it there, or you can try rewording the request."],
  [/taking longer than 15 minutes/i, () => "This is taking longer than usual. It may still finish. You can press Submit for review later to put your changes live."],
  [/^The draft is published/i, () => "Your changes are live."],
  [/^Approval (granted|declined)/i, (t) => t],
];

/** The text to show for a history entry, or null to hide it (internal notes stay out). */
export function visibleText(entry: Entry): string | null {
  if (entry.role === "note") {
    for (const [re, out] of NOTES) if (re.test(entry.text)) return out(entry.text);
    return null;
  }
  if (entry.role === "error") return `${entry.text}\nTry sending it again in a moment.`;
  return entry.text;
}

// ---- the live "working on it" line ------------------------------------------------------------
export function workLabel(job: Job): string {
  const st = job.status;
  if (st === "approval") return "Waiting for an approval…";
  if (job.kind === "change") return st === "working" ? "Making your change…" : "Sending your request…";
  if (job.kind === "dev") return "Updating the page…";
  if (st === "publishing") return "Going live…";
  if (st === "updating") return "Waiting for the live site to update…";
  return "Reviewing your changes…";
}

export function workHint(job: Job, s: RelayState, now: number): string {
  const elapsed = now - (job.stepStartedAt || job.startedAt);
  if (job.kind === "change" && job.status === "working" && elapsed > 45000) return "Bigger changes take longer. You can keep this page open.";
  if (job.status === "reviewing" && s.review?.mode === "github") return "A review usually takes a minute or two.";
  if (job.status === "updating") return "The live site can take a minute or two to show the new version.";
  return "";
}

export const isWorking = (s: RelayState | null) =>
  Boolean(s && s.job && s.job.status !== "approval" && (s.busy || s.job.status === "queued"));

// ---- approvals ---------------------------------------------------------------------------------
export function approvalView(a: Approval): { title: string; canApprove: boolean; canDecline: boolean; note: string; editorUrl: string | null; approveLabel: string; declineLabel: string } {
  return {
    title: a.title,
    canApprove: a.rule === "ok" && !a.deciding,
    canDecline: !a.deciding,
    note: a.rule === "editor"
      ? "This one can only be answered in the builder's own editor (for example it involves a secret or key, or a form this chat can't show). Someone with access to the builder's editor can answer it there, or you can decline."
      : a.rule === "never"
        ? "Publishing can't be approved here. Decline this, then use Submit for review."
        : "",
    editorUrl: a.rule === "editor" ? a.editorUrl : null,
    approveLabel: a.kind === "plan" ? "Approve plan" : "Approve",
    declineLabel: "Decline",
  };
}

export function missingField(fields: ApprovalField[] | null, answers: Record<string, string | number | boolean | undefined>): string | null {
  for (const f of fields ?? []) {
    if (!f.required) continue;
    const v = answers[f.key];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return f.label;
  }
  return null;
}
