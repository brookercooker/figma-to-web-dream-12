import { useState } from "react";
import { Monitor, Smartphone, Tablet, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { postToHelper } from "./helper";
import { useDesignChat, type Device } from "./DesignChatContext";
import WaitProgress from "./WaitProgress";

/**
 * Device size stays with the component pickers; navigation lives in PreviewToolbar.
 * Submit for review stays in the top bar (SubmitButton).
 */
export default function PreviewTools({ showViewControls, tight = false }: { showViewControls: boolean; tight?: boolean }) {
  const { device, setDevice } = useDesignChat();

  return (
    <div className="flex shrink-0 items-center gap-2">
      {showViewControls && (
        <>
          {!tight && <ToggleGroup type="single" value={device} onValueChange={(v) => v && setDevice(v as Device)} variant="outline" size="sm"
            className="flex gap-0 [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button+button]:-ml-px" aria-label="Preview Size">
            <ToggleGroupItem value="mobile" aria-label="Mobile Preview" title="Mobile Preview"><Smartphone className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet Preview" title="Tablet Preview"><Tablet className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop Preview" title="Desktop Preview"><Monitor className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>}
        </>
      )}
    </div>
  );
}

/** Reminders shown as a plain bulleted list before submitting; nothing needs to be ticked. */
export const SUBMIT_CHECKLIST = [
  "You've looked at your changes in the preview on every page they affect.",
  "The wording, pictures and links are correct.",
  "The changes look right on phone and desktop sizes.",
] as const;

/**
 * Explains what Submit for Review (or Publish) does: an automatic review first, a developer for anything it can't approve.
 * Controlled, so a host that outlives its opener (the phone overflow menu) can keep it open.
 */
export function SubmitConfirmDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, refreshSoon } = useDesignChat();
  const [sending, setSending] = useState(false);
  const count = state?.publish?.open ?? 0;
  const reviewOn = state?.review?.enabled !== false;
  const label = reviewOn ? "Submit for Review" : "Publish";
  const changes = `${count} ${count === 1 ? "change" : "changes"}`;
  const confirm = async () => {
    if (sending) return;
    setSending(true);
    try { await postToHelper("/publish"); refreshSoon(); onOpenChange(false); }
    finally { setSending(false); }
  };
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!sending) onOpenChange(next); }}>
      <AlertDialogContent data-submit-confirm>
        <AlertDialogHeader>
          <AlertDialogTitle>{reviewOn ? "Submit Your Changes for Review?" : "Publish Your Changes?"}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              {reviewOn ? <>
                <p>Your {changes} will be reviewed automatically, and anything it can't approve may go to a developer. <span className="font-medium text-foreground">Approved changes are put on the public site.</span></p>
              </> : <>
                <p>This puts all {changes} waiting in your draft on the public site right away.</p>
                <p className="font-medium text-foreground">Visitors will see these changes as soon as publishing finishes.</p>
              </>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <section className="rounded-md border p-3" aria-labelledby="submit-checklist-heading">
          <h3 id="submit-checklist-heading" className="mb-1.5 text-sm font-semibold">Before You Submit, Check That:</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm" aria-label="Submission Checklist">
            {SUBMIT_CHECKLIST.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <Button type="button" variant="review" disabled={sending} onClick={() => void confirm()}>
            <Send className="h-4 w-4" aria-hidden />{sending ? "Sending…" : label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Submit for review (or Publish, when review is off): changes can be waiting whichever tab is open.
 * It opens SubmitConfirmDialog first; pass onRequestSubmit when the dialog is hosted elsewhere.
 */
export function SubmitButton({ compact = false, showProgress = true, onRequestSubmit }: { compact?: boolean; showProgress?: boolean; onRequestSubmit?: () => void }) {
  const { state, waitProgress } = useDesignChat();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const p = state?.publish ?? { ok: true, open: 0 };
  const reviewOn = state?.review?.enabled;
  const submitDisabled = !state || state.busy || p.open === 0 || (!p.ok && !p.willReview);
  const label = reviewOn === false ? "Publish" : "Submit for Review";
  return (
    <div className="shrink-0"><Button type="button" variant="review" size="sm" className={compact ? "w-9 shrink-0 px-0" : "shrink-0"} aria-label={label} title={label} disabled={submitDisabled} onClick={() => (onRequestSubmit ? onRequestSubmit() : setConfirmOpen(true))}>
      <Send className="h-4 w-4" aria-hidden />
      {!compact && label}
    </Button>{showProgress && <WaitProgress progress={waitProgress?.submit} className="mt-2 w-full max-w-64" />}
    {!onRequestSubmit && <SubmitConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} />}</div>
  );
}
