/**
 * Shared work-status + schedule-status model used by Static Pages,
 * Landing Pages, and Objects. Keeps pill colors and derivation rules
 * consistent across every admin tool.
 */

export type WorkStatus = "draft" | "ready";
export type ScheduleStatus = "not-live" | "scheduled" | "live" | "expired";

/** Soft pill for the two Work statuses (Objects-style). */
export function workBadgeClass(s: WorkStatus): string {
  return s === "ready"
    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/40"
    : "bg-amber-400/20 text-amber-800 border-amber-500/40";
}

export function workLabel(s: WorkStatus): string {
  return s === "ready" ? "Ready" : "Draft";
}

/** Derived schedule status. Never "click-set". */
export function scheduleStatus(
  work: WorkStatus,
  startAt: string | null,
  endAt: string | null,
): ScheduleStatus {
  if (work !== "ready") return "not-live";
  const now = Date.now();
  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;
  if (s && now < s) return "scheduled";
  if (e && now > e) return "expired";
  return "live";
}

/**
 * Live uses a distinct BRIGHT solid green so it's clearly different from
 * the soft green used for the Ready work pill.
 */
export function scheduleBadgeClass(s: ScheduleStatus): string {
  switch (s) {
    case "live":      return "bg-green-600 text-white border-green-700";
    case "scheduled": return "bg-sky-500/15 text-sky-700 border-sky-500/40";
    case "expired":   return "bg-rose-500/15 text-rose-700 border-rose-500/40";
    case "not-live":
    default:          return "bg-muted text-muted-foreground border-border";
  }
}

export function scheduleLabel(s: ScheduleStatus): string {
  switch (s) {
    case "live":      return "Live";
    case "scheduled": return "Scheduled";
    case "expired":   return "Expired";
    case "not-live":
    default:          return "Not live";
  }
}

/**
 * Publish rule (single source of truth). A landing page is publicly
 * viewable ONLY when it is BOTH Ready AND currently Live within its
 * window. Draft is never public; Scheduled/Expired are not public.
 */
export function isLandingPublic(
  work: WorkStatus,
  startAt: string | null,
  endAt: string | null,
): boolean {
  return scheduleStatus(work, startAt, endAt) === "live";
}
