import { useEffect, useRef, useState } from "react";
import { RELAY, type RelayState, type Job } from "./helper";
import { detectWaitKind, timedProgress, type WaitKind, type WaitView } from "./waitEstimates";

type Track = { id: number; jobId?: string; job?: Job; version: number; kind: WaitKind; high: number; replyAt?: number; pausedAt?: number; paused: number; doneAt?: number; error?: boolean; hasBuild?: boolean; stageStart?: number; view?: WaitView; ribbonStage?: number; ribbonHigh?: number; committed?: boolean; built?: boolean; ready?: boolean; changeAt?: number; changeVersion?: number; changeBuiltAt?: number; lastVersion?: number; lastBuiltAt?: number; authoritativeBuiltAt?: number; frameBaseline?: number };
const terminal = /^(done|complete|completed|published|live)$/;
const failed = /^(failed|error|blocked)$/;
const stopped = /^(stopped|cancelled|canceled)$/;
const storageKey = `nova:wait-progress:${RELAY}`;
function restoreTracks(): Track[] {
  try { const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); return (Array.isArray(saved) ? saved : saved ? [saved] : []).filter(t => typeof t.id === "number" && typeof t.high === "number" && typeof t.paused === "number"); } catch { return []; }
}
function rememberTracks(tracks: Track[]) {
  try { if (tracks.length) sessionStorage.setItem(storageKey, JSON.stringify(tracks)); else sessionStorage.removeItem(storageKey); } catch { /* Server timestamps remain the fallback. */ }
}
export function useWaitProgress(state: RelayState | null, frameCompletedAt = 0): { request: WaitView | null; submit: WaitView | null } {
  const [now, setNow] = useState(Date.now);
  const tracks = useRef<Track[]>(restoreTracks());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []);
  const currentJob = state?.job;
  if (!state) return { request: null, submit: null };
  const currentStatus = currentJob?.status ?? "";
  // Draft sync has its own save indicator, including after a tracker reload.
  if (currentStatus === "content" || /^content(?:[-_]?sync)?$/i.test(currentJob?.kind ?? "")) {
    tracks.current = []; rememberTracks([]); return { request: null, submit: null };
  }
  const submitJob = currentJob?.kind === "publish" || currentJob?.kind === "review" || /^(reviewing|publishing|updating)$/.test(currentStatus);
  const history = state.history ?? [];
  if (!currentJob && !tracks.current.length) {
    const latestUser = [...history].reverse().find(e => e.role === "user" && typeof e.ts === "number");
    if (latestUser?.ts && state.previewChecking) tracks.current.push({ id: latestUser.ts, version: state.previewVersion, kind: detectWaitKind(latestUser.text), high: 0, paused: 0, hasBuild: true });
  }
  const matchesJob = (t: Track, job: Job) => t.jobId && job.id ? t.jobId === job.id : t.id === job.startedAt;
  if (currentJob && !tracks.current.some(t => matchesJob(t, currentJob)) && (state.busy || state.previewChecking || currentStatus === "approval" || currentStatus === "queued")) {
    const content = state.draft?.requests?.some(r => r.source === "content");
    const user = [...history].reverse().find(e => e.role === "user" && (!e.ts || e.ts <= currentJob.startedAt + 1000));
    tracks.current.push({ id: currentJob.startedAt, jobId: currentJob.id, job: currentJob, version: state.previewVersion, high: 0, paused: 0,
      kind: submitJob ? content ? "contentSubmit" : "submit" : detectWaitKind(user?.text ?? "", currentJob.planOnly || /^(question|plan|plan-only|planOnly)$/.test(currentJob.kind ?? "")) });
  }
  tracks.current.sort((a, b) => a.id - b.id);
  let request: WaitView | null = null, submit: WaitView | null = null;
  for (const [index, t] of tracks.current.entries()) {
  const ownsJob = !!currentJob && matchesJob(t, currentJob);
  if (ownsJob && currentJob) { t.job = currentJob; t.jobId ??= currentJob.id; }
  const job = ownsJob ? currentJob : t.job;
  const status = job?.status ?? "";
  const nextStart = tracks.current[index + 1]?.id ?? Infinity;
  const reply = history.find(e => e.role === "assistant" && typeof e.ts === "number" && e.ts >= t.id && e.ts < nextStart);
  const error = history.find(e => e.role === "error" && typeof e.ts === "number" && e.ts >= t.id && e.ts < nextStart);
  const isSubmit = t.kind === "submit" || t.kind === "contentSubmit";
  const commit = [...(state.draft?.requests ?? []), ...(state.changes ?? [])].filter(r => r.source !== "content" && !!r.sha && (t.jobId ? r.id === t.jobId :
    // Older relays without job.id use the timestamp rule; exact IDs always win.
    Number(typeof r.at === "string" ? Date.parse(r.at) : r.at ?? 0) >= t.id && Number(typeof r.at === "string" ? Date.parse(r.at) : r.at ?? 0) < nextStart))
    .sort((a, b) => Number(typeof a.at === "string" ? Date.parse(a.at) : a.at) - Number(typeof b.at === "string" ? Date.parse(b.at) : b.at))[0];
  // Missing SHA/timestamp is not evidence of a change. A reply or a timer cannot supply it.
  if (!isSubmit && !t.error && !failed.test(status) && !error && t.pausedAt === undefined && !(ownsJob && state.approval) && status !== "approval") {
    if (commit && !t.changeAt) {
      const at = Number(typeof commit.at === "string" ? Date.parse(commit.at) : commit.at);
      t.changeAt = Number.isFinite(at) && at >= t.id ? at : now;
      t.changeVersion = t.lastVersion ?? t.version;
      t.changeBuiltAt = t.lastBuiltAt ?? 0;
      t.committed = true;
      t.frameBaseline = frameCompletedAt;
    }
    if (commit && typeof commit.builtAt === "number" && Number.isFinite(commit.builtAt)) t.authoritativeBuiltAt = commit.builtAt;
    if (t.changeAt) {
      t.built ||= t.authoritativeBuiltAt !== undefined ? t.authoritativeBuiltAt >= t.changeAt : !state.previewChecking && ((state.previewBuiltAt ?? 0) > Math.max(t.changeAt, t.changeBuiltAt ?? 0) || state.previewVersion > (t.changeVersion ?? t.version));
      t.ready ||= !!t.built && frameCompletedAt > Math.max(t.changeAt, t.frameBaseline ?? 0, t.authoritativeBuiltAt ?? state.previewBuiltAt ?? 0);
    }
  }
  t.lastVersion = state.previewVersion; t.lastBuiltAt = state.previewBuiltAt ?? 0;
  const decorate = (view: WaitView): WaitView => {
    if (isSubmit || t.kind === "question") return view;
    const stage = t.ready ? 3 : t.committed ? 2 : 0;
    const current = Math.max(t.ribbonStage ?? 0, stage);
    if (current !== t.ribbonStage) { t.ribbonStage = current; t.ribbonHigh = 0; }
    // Segmentation decorates the existing estimate, never introduces another clock/easing.
    return { ...view, ribbon: { received: true, changed: !!t.committed, built: !!t.ready, ready: !!t.ready, current, partial: view.value, elapsed: Math.max(0, ((t.pausedAt ?? now) - t.id - t.paused) / 1000), paused: t.pausedAt !== undefined } };
  };
  if (stopped.test(status) || (!job && !reply && !t.replyAt && !t.doneAt && !state.previewChecking)) {
    t.doneAt ??= now - 2000; continue;
  }
  if (ownsJob && state.approval || status === "approval") {
    t.pausedAt ??= state.approval?.createdAt ?? now;
    const view = decorate({ value: t.high, label: "Waiting for your approval" });
    if (isSubmit) submit ??= view; else request ??= view;
    continue;
  }
  if (t.pausedAt !== undefined) { t.paused += Math.max(0, now - t.pausedAt); t.pausedAt = undefined; }
  if (failed.test(status) || error || isSubmit && failed.test(state.draft?.review?.state ?? "")) t.error = true;
  if (!isSubmit && !t.replyAt && (reply?.ts || state.previewChecking && job?.stepStartedAt)) t.replyAt = reply?.ts ?? job?.stepStartedAt;
  // A question/no-change reply has no build stage. A reload with previewChecking is already in that stage.
  t.hasBuild ||= !!state.previewChecking || state.previewVersion > t.version || (t.kind !== "question" && !!t.replyAt && ((state.previewBuiltAt ?? 0) > t.replyAt || /^(building|build|previewChecking)$/.test(job?.lastStep ?? status)));
  const hasBuild = !!t.hasBuild;
  if (!isSubmit && t.kind !== "question" && t.doneAt && t.committed && !t.ready) t.doneAt = undefined;
  if (!t.error && !t.doneAt) {
    if (isSubmit ? terminal.test(state.publish?.status ?? status) || history.some(e => e.role === "note" && (e.ts ?? 0) >= t.id && /^The draft is published|^Your changes are live/i.test(e.text))
      : t.ready || !!t.replyAt && !t.committed && (!ownsJob || !state.busy) && !state.previewChecking) t.doneAt = now;
  }
  let view: WaitView;
  if (t.doneAt) {
    if (now - t.doneAt > 1700) continue;
    view = { value: 1, label: isSubmit ? "Live" : "Done", done: true, fading: now - t.doneAt >= 1500 };
  } else if (t.error) view = { value: t.high, label: "The change couldn't finish", error: true };
  else {
    const stage = isSubmit ? /^(publishing|updating)$/.test(status) ? 1 : 0 : t.replyAt && hasBuild ? 1 : 0;
    if (!stage) t.stageStart ??= job?.stepStartedAt ?? t.id;
    const started = stage ? isSubmit ? job?.stepStartedAt ?? t.id : t.replyAt ?? t.id : t.stageStart ?? t.id;
    const label = isSubmit ? stage ? "Publishing" : "Checking your changes" : stage ? "Building the preview" : t.kind === "question" ? "Thinking" : "Making your change";
    view = timedProgress(t.kind, stage, (now - started - (stage ? 0 : t.paused)) / 1000, label, t.high);
    t.high = view.value;
  }
  view = decorate(view);
  t.view = view;
  if (isSubmit) submit ??= view; else request ??= view;
  }
  rememberTracks(tracks.current);
  return { request, submit };
}