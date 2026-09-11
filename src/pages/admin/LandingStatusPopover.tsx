import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  WorkStatus, workBadgeClass, workLabel,
  scheduleStatus, scheduleBadgeClass, scheduleLabel,
} from "./workStatus";
import { formatSchedule, isoToLocalParts, localDateToIso } from "./landingDates";

interface Props {
  value: {
    work: WorkStatus;
    startAt: string | null;
    endAt: string | null;
  };
  onSave: (next: { work: WorkStatus; startAt: string | null; endAt: string | null }) => Promise<void> | void;
  disabled?: boolean;
}

/**
 * The single control for changing a landing page's Work status AND
 * its schedule window. Replaces the "…" menu path entirely.
 * Shows a live preview of the resulting Schedule status.
 */
export default function LandingStatusPopover({ value, onSave, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [work, setWork] = useState<WorkStatus>(value.work);
  const [sd, setSd] = useState(""); const [st, setSt] = useState("");
  const [ed, setEd] = useState(""); const [et, setEt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWork(value.work);
    const s = isoToLocalParts(value.startAt);
    const e = isoToLocalParts(value.endAt);
    setSd(s.date); setSt(s.time === "00:00" ? "" : s.time);
    setEd(e.date); setEt(e.time === "00:00" ? "" : e.time);
  }, [open, value.work, value.startAt, value.endAt]);

  if (disabled) return null;

  const startAt = localDateToIso(sd, st);
  const endAt = localDateToIso(ed, et);
  const preview = scheduleStatus(work, startAt, endAt);

  const previewText = (() => {
    if (work !== "ready") return "Draft — never publicly visible.";
    if (preview === "scheduled") return `Scheduled — will go Live on ${formatSchedule(startAt)}.`;
    if (preview === "expired")   return "Expired — no longer publicly visible.";
    return "Live — publicly visible now.";
  })();

  const save = async () => {
    setSaving(true);
    try { await onSave({ work, startAt, endAt }); setOpen(false); }
    finally { setSaving(false); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline focus:outline-none focus:underline"
          aria-label="Change status and schedule"
        >
          Change
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={16}
        avoidCollisions
        className="w-[420px] max-w-[calc(100vw-2rem)] p-3"
      >
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Work status</div>
        <div className="flex gap-2 mb-3">
          {(["draft", "ready"] as WorkStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setWork(s)}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                work === s ? workBadgeClass(s) : "bg-background text-muted-foreground border-border"
              }`}
            >
              {workLabel(s)}
            </button>
          ))}
        </div>

        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Schedule</div>
        <div className="grid grid-cols-[1fr_96px] gap-2 mb-2">
          <div>
            <label className="text-[10px] text-muted-foreground block">Start date</label>
            <Input type="date" value={sd} onChange={(e) => setSd(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block">Time</label>
            <Input type="time" value={st} onChange={(e) => setSt(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-2 mb-2">
          <div>
            <label className="text-[10px] text-muted-foreground block">End date</label>
            <Input type="date" value={ed} onChange={(e) => setEd(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block">Time</label>
            <Input type="time" value={et} onChange={(e) => setEt(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">Leave dates empty for "Always on".</p>

        <div className="rounded border bg-muted/30 px-2.5 py-2 mb-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Result</div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${workBadgeClass(work)}`}>
              {workLabel(work)}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${scheduleBadgeClass(preview)}`}>
              {scheduleLabel(preview)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">{previewText}</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
