import { useState } from "react";
import { ExternalLink, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postToHelper, type Approval } from "./helper";
import { approvalView } from "./logic";
import { useIsAdmin } from "./useIsAdmin";

/** Shown when the builder has paused a change to ask a person first. Admins can approve or decline it here. */
export default function ApprovalCard({ approval, onAnswered }: { approval: Approval; onAnswered: () => void }) {
  const isAdmin = useIsAdmin();
  const view = approvalView(approval, isAdmin);
  const [pressed, setPressed] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState("");
  const sending = pressed !== null || approval.deciding;

  const answer = async (decision: "approve" | "decline") => {
    if (sending) return;
    setPressed(decision);
    setError("");
    const res = await postToHelper("/admin/approval", { id: approval.id, decision });
    if (!res.ok) setError(res.error || "That didn't go through. Try again.");
    setPressed(null);
    onAnswered();
  };

  return (
    <div role="group" aria-label="Approval needed" className="self-stretch rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2 text-xs text-amber-900">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" /> Approval needed
      </h3>
      <p className="font-bold">{view.title}</p>
      <p>The builder paused this change and is waiting for a decision.</p>
      {approval.detail && (
        <details>
          <summary className="cursor-pointer">What exactly is being asked</summary>
          <pre className="mt-1 whitespace-pre-wrap break-words text-xs max-h-48 overflow-auto font-sans">{approval.detail}</pre>
        </details>
      )}
      {view.note && <p>{view.note}</p>}
      {view.editorUrl && (
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href={view.editorUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open in the builder's editor
          </a>
        </Button>
      )}
      {(view.canDecline || view.canApprove) && (
        <div className="flex gap-2">
          {view.canApprove && (
            <Button type="button" size="sm" disabled={sending} onClick={() => answer("approve")} className="gap-1.5">
              {pressed === "approve" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />} Approve
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" disabled={sending} onClick={() => answer("decline")} className="gap-1.5">
            {pressed === "decline" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />} Decline
          </Button>
        </div>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
