import { useState } from "react";
import { ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postToHelper, type Approval, type ApprovalField } from "./helper";
import { approvalView, missingField } from "./logic";

type Answers = Record<string, string | number | boolean | undefined>;

/** Shown when the builder has paused a change to ask a person first: a plan to review, or an action to approve. */
export default function ApprovalCard({ approval, onAnswered }: { approval: Approval; onAnswered: () => void }) {
  const view = approvalView(approval);
  const isPlan = approval.kind === "plan";
  const [pressed, setPressed] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [note, setNote] = useState("");
  const sending = pressed !== null || approval.deciding;
  const fields = approval.fields ?? [];
  const showForm = fields.length > 0 && view.canApprove;

  const answer = async (decision: "approve" | "decline") => {
    if (sending) return;
    setError("");
    let body: Record<string, unknown> = { id: approval.id, decision };
    if (decision === "approve" && showForm) {
      const missing = missingField(fields, answers);
      if (missing) { setError(`Fill in "${missing}".`); return; }
      body = { ...body, answers };
    }
    if (decision === "decline" && note.trim()) body = { ...body, note: note.trim() };
    setPressed(decision);
    const res = await postToHelper("/approval", body);
    if (!res.ok) setError(res.error || "That didn't go through. Try again.");
    setPressed(null);
    onAnswered();
  };

  const set = (key: string, v: string | number | boolean | undefined) => setAnswers((a) => ({ ...a, [key]: v }));

  const control = (f: ApprovalField) => {
    const id = `approval-${approval.id}-${f.key}`;
    const v = answers[f.key];
    if (f.kind === "yesno") {
      return <input id={id} type="checkbox" checked={v === true} onChange={(e) => set(f.key, e.target.checked)} className="h-4 w-4" />;
    }
    if (f.kind === "longtext") {
      return <Textarea id={id} maxLength={5000} rows={3} value={typeof v === "string" ? v : ""} onChange={(e) => set(f.key, e.target.value)} className="bg-background text-xs" />;
    }
    if (f.kind === "choice") {
      return (
        <select id={id} value={typeof v === "string" ? v : ""} onChange={(e) => set(f.key, e.target.value || undefined)}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs">
          <option value="">Choose…</option>
          {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.kind === "number") {
      return <Input id={id} type="number" value={typeof v === "number" ? String(v) : ""} className="bg-background text-xs"
        onChange={(e) => set(f.key, e.target.value === "" ? undefined : Number(e.target.value))} />;
    }
    return <Input id={id} maxLength={500} value={typeof v === "string" ? v : ""} onChange={(e) => set(f.key, e.target.value)} className="bg-background text-xs" />;
  };

  return (
    <div role="group" aria-label="Approval needed" className="self-stretch rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs text-amber-900">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" /> Approval needed
      </h3>
      <p className="font-bold">{view.title}</p>
      <p>{isPlan ? "The builder wrote a plan and is waiting for your go-ahead." : "The builder paused this change and is waiting for a decision."}</p>
      {approval.detail && (isPlan ? (
        <div className="space-y-1">
          <h4 className="font-semibold">The plan</h4>
          <pre className="rounded-md border border-amber-300 bg-background p-2 whitespace-pre-wrap break-words text-xs max-h-64 overflow-auto font-sans">{approval.detail}</pre>
        </div>
      ) : (
        <details>
          <summary className="cursor-pointer">What exactly is being asked</summary>
          <pre className="mt-1 whitespace-pre-wrap break-words text-xs max-h-48 overflow-auto font-sans">{approval.detail}</pre>
        </details>
      ))}
      {view.note && <p>{view.note}</p>}
      {view.editorUrl && (
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href={view.editorUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open in the builder's editor
          </a>
        </Button>
      )}
      {showForm && (
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <div className={f.kind === "yesno" ? "flex items-center gap-2" : "space-y-1"}>
                {f.kind === "yesno" && control(f)}
                <Label htmlFor={`approval-${approval.id}-${f.key}`} className="text-xs">{f.label}{f.required && " *"}</Label>
                {f.kind !== "yesno" && control(f)}
              </div>
              {f.help && <p className="text-muted-foreground">{f.help}</p>}
            </div>
          ))}
        </div>
      )}
      {view.canDecline && (
        <div className="space-y-1">
          <Label htmlFor={`approval-${approval.id}-note`} className="text-xs">
            {isPlan ? "Want it changed? Decline and say what to change (optional)" : "Add a note for the builder (optional, only sent if you decline)"}
          </Label>
          <Textarea id={`approval-${approval.id}-note`} maxLength={2000} rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            className="min-h-0 bg-background text-xs" />
        </div>
      )}
      {(view.canDecline || view.canApprove) && (
        <div className="flex gap-2">
          {view.canApprove && (
            <Button type="button" size="sm" disabled={sending} onClick={() => answer("approve")} className="gap-1.5">
              {pressed === "approve" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />} {view.approveLabel}
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" disabled={sending} onClick={() => answer("decline")} className="gap-1.5">
            {pressed === "decline" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />} {view.declineLabel}
          </Button>
        </div>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
