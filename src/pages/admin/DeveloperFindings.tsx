import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Finding } from "./designChat/helper";

/** What the automatic review found, with "Fix this for me". Developer Review only; everyone else just sees that a review is needed. */
export function FindingsList({ items, onFix, onReject }: { items: Finding[]; onFix: (ids: string[]) => Promise<void>; onReject?: (reason: string) => Promise<string | null> }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  if (!items.length && !onReject) return null;
  return (
    <div className="space-y-2">
      <h2 className="font-semibold">Review Findings</h2>
      {items.map((f) => (
        <div key={f.id} className="rounded-md border bg-background p-2 text-xs space-y-1">
          <div>{f.issue}</div>
          {f.request && <div className="text-muted-foreground">From the request: {f.request}</div>}
          {f.file && <div className="text-muted-foreground">File: {f.file}</div>}
          {f.fix && <div className="text-muted-foreground">Suggested fix: {f.fix}</div>}
          <Button type="button" size="sm" variant="outline" onClick={(ev) => { (ev.currentTarget as HTMLButtonElement).disabled = true; void onFix([f.id]); }}>
            Fix this for me
          </Button>
        </div>
      ))}
      {items.length > 1 && (
        <Button type="button" size="sm" onClick={(ev) => { (ev.currentTarget as HTMLButtonElement).disabled = true; void onFix(items.map((f) => f.id)); }}>
          Fix All {items.length} for me
        </Button>
      )}
      {onReject && (
        <>
          <Button type="button" size="sm" variant="destructive" onClick={() => { setError(null); setReason(""); setConfirm(true); }}>Reject Changes</Button>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <AlertDialog open={confirm} onOpenChange={setConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject These Changes?</AlertDialogTitle>
                <AlertDialogDescription>None of the changes waiting for review will go on the public site. Use this only when no part of them should be implemented.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Reason</Label>
                <Input id="reject-reason" value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={300} aria-describedby="reject-reason-help" />
                <p id="reject-reason-help" className="text-xs text-muted-foreground">Kept with each rejected request and shown to staff.</p>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={reason.trim().length < 3} onClick={() => { void onReject(reason.trim()).then(setError); }}>Reject Changes</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
