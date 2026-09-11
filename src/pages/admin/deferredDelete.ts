import { toast } from "sonner";

/**
 * Deferred delete: hide immediately in local state, show an Undo toast for ~5s.
 * If the user clicks Undo before the timeout, restore locally and never hit the DB.
 * Otherwise perform the DB delete when the timer fires.
 *
 * Callers manage their own local state via `hide`/`restore` closures so the row
 * disappears from the UI right away.
 */
export function scheduleDeleteWithUndo(opts: {
  label: string;
  hide: () => void;
  restore: () => void;
  commit: () => Promise<void>;
  onCommitted?: () => void;
  durationMs?: number;
}) {
  const { label, hide, restore, commit, onCommitted, durationMs = 5000 } = opts;
  let cancelled = false;
  hide();
  const timer = setTimeout(async () => {
    if (cancelled) return;
    try {
      await commit();
      onCommitted?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
      restore();
    }
  }, durationMs);
  toast(label, {
    duration: durationMs,
    action: {
      label: "Undo",
      onClick: () => {
        cancelled = true;
        clearTimeout(timer);
        restore();
        toast.success("Restored");
      },
    },
  });
}
