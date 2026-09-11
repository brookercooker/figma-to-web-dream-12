import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { WorkStatus, workBadgeClass, workLabel } from "./workStatus";

interface Props {
  value: WorkStatus;
  onSave: (next: WorkStatus) => Promise<void> | void;
  disabled?: boolean;
  /** Optional label shown next to the icon (default "Change"). */
  label?: string;
}

/**
 * Small "Change" trigger placed directly beneath a work-status pill.
 * Opens a popover with explicit Draft / Ready choice + Save.
 * A stray single click on the pill area can never change status.
 */
export default function WorkStatusPopover({ value, onSave, disabled, label = "Change" }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<WorkStatus>(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setPending(value); }, [open, value]);

  if (disabled) return null;

  const save = async () => {
    if (pending === value) { setOpen(false); return; }
    setSaving(true);
    try { await onSave(pending); setOpen(false); }
    finally { setSaving(false); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline focus:outline-none focus:underline"
          aria-label="Change work status"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={6} collisionPadding={16} avoidCollisions className="w-60 p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Work status</div>
        <div className="flex flex-col gap-1.5 mb-3">
          {(["draft", "ready"] as WorkStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPending(s)}
              className={`flex items-center gap-2 text-left px-2 py-1.5 rounded border text-xs ${
                pending === s ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
              }`}
            >
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${workBadgeClass(s)}`}>
                {workLabel(s)}
              </span>
              <span className="text-muted-foreground">
                {s === "ready" ? "Complete — safe to reference" : "Still being built"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving || pending === value}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
