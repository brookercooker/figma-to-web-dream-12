import { useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

/** Things to check before submitting; every box must be ticked before the confirm button turns on. */
export const SUBMIT_CHECKLIST = [
  "I looked at my changes in the preview on every page they affect.",
  "The wording, pictures and links are correct.",
  "I checked how the changes look on phone and desktop sizes.",
] as const;

/**
 * Explains what Submit for Review (or Publish) does and asks the person to run through the checklist first.
 * Controlled, so a host that outlives its opener (the phone overflow menu) can keep it open.
 */
export function SubmitConfirmDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { state, refreshSoon } = useDesignChat();
  const [checked, setChecked] = useState<boolean[]>(() => SUBMIT_CHECKLIST.map(() => false));
  const [sending, setSending] = useState(false);
  useEffect(() => { if (open) setChecked(SUBMIT_CHECKLIST.map(() => false)); }, [open]);
  const count = state?.publish?.open ?? 0;
  const reviewOn = state?.review?.enabled !== false;
  const label = reviewOn ? "Submit for Review" : "Publish";
  const changes = `${count} ${count === 1 ? "change" : "changes"}`;
  const allChecked = checked.every(Boolean);
  const confirm = async () => {
    if (!allChecked || sending) return;
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
                <p>This sends all {changes} waiting in your draft to a reviewer. Until a reviewer approves them, they stay in the draft preview and visitors won't see them.</p>
                <p className="font-medium text-foreground">Any changes that are approved will be put on the public site.</p>
                <p>You can keep working while the review runs. If something needs fixing, you'll see it here before anything goes live.</p>
              </> : <>
                <p>This puts all {changes} waiting in your draft on the public site right away.</p>
                <p className="font-medium text-foreground">Visitors will see these changes as soon as publishing finishes.</p>
              </>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset className="space-y-2 rounded-md border p-3" aria-label="Submission Checklist">
          <legend className="px-1 text-sm font-semibold">Before You Submit</legend>
          {SUBMIT_CHECKLIST.map((item, i) => (
            <label key={item} className="flex cursor-pointer items-start gap-2 text-sm">
              <Checkbox className="mt-0.5" checked={checked[i]} onCheckedChange={(v) => setChecked((c) => c.map((x, j) => (j === i ? v === true : x)))} />
              <span>{item}</span>
            </label>
          ))}
        </fieldset>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
          <Button type="button" variant="review" disabled={!allChecked || sending} onClick={() => void confirm()}>
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
