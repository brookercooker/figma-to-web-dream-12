import type { RelayState } from "./helper";

export type PreviewStage = 1 | 2 | 3 | 4;
export const PREVIEW_STEPS = ["Request Sent", "Making Your Change", "Building the Preview", "Preview Updating"] as const;
export const LONG_UPDATE_MS = 90_000;
export function previewExpectation(elapsedMs: number): string {
  return elapsedMs >= LONG_UPDATE_MS ? "This is taking longer than expected, but it's still working and nothing is lost." : "Most updates take about a minute";
}
export function elapsedLabel(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function previewExcluded(state: RelayState | null): boolean {
  if (!state) return true;
  const job = state.job;
  const status = job?.status.toLowerCase();
  if (job?.kind && !["change", "dev"].includes(job.kind)) return true;
  if (["failed", "error", "cancelled", "canceled", "approval", "plan", "plan-only", "reviewing", "publishing"].includes(status ?? "")) return true;
  if (state.publish?.status === "reviewing" || state.approval?.kind === "plan") return true;
  const latest = state.history.at(-1);
  return !!(latest?.role === "error" && job && (latest.ts !== undefined ? latest.ts >= job.startedAt : !state.busy));
}
/** Relay facts only: absence of busy does not mean a build has been served. */
export function previewStage(state: RelayState | null, waiting: boolean, buildDetected: boolean): PreviewStage | null {
  if (previewExcluded(state)) return null;
  if (buildDetected) return 4;
  if (state?.previewChecking) return 3;
  const step = state?.job?.lastStep ?? state?.job?.status;
  if (["building", "build", "previewChecking"].includes(step ?? "")) return 3;
  if (["reload", "reloading", "preview-updating"].includes(step ?? "")) return 4;
  if (state?.job && (state.busy || step === "queued" || step === "sending")) {
    if (step === "queued" || step === "sending") return 1;
    return 2;
  }
  return waiting ? 3 : null;
}
