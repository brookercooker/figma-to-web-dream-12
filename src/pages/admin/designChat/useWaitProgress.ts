import { useEffect, useRef, useState } from "react";
import { RELAY, type RelayState } from "./helper";
import { detectWaitKind, timedProgress, WAIT_ESTIMATES, type WaitKind, type WaitView } from "./waitEstimates";

type Track = { id: number; version: number; kind: WaitKind; high: number; replyAt?: number; pausedAt?: number; paused: number; doneAt?: number; error?: boolean; hasBuild?: boolean; stageStart?: number; view?: WaitView; ribbonStage?: number; ribbonHigh?: number; committed?: boolean; built?: boolean; ready?: boolean };
const terminal = /^(done|complete|completed|published|live)$/;
const failed = /^(failed|error|blocked)$/;
const stopped = /^(stopped|cancelled|canceled)$/;
const storageKey = `nova:wait-progress:${RELAY}`;
function restoreTrack(id: number): Track | null {
  try { const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); return saved?.id === id && typeof saved.high === "number" && typeof saved.paused === "number" ? saved : null; } catch { return null; }
}
function rememberTrack(t: Track | null) {
  try { if (t) sessionStorage.setItem(storageKey, JSON.stringify(t)); else sessionStorage.removeItem(storageKey); } catch { /* Server timestamps remain the fallback. */ }
}
export function useWaitProgress(state: RelayState | null, frameCompletedAt = 0): { request: WaitView | null; submit: WaitView | null } {
  const [now, setNow] = useState(Date.now);
  const track = useRef<Track | null>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []);
  const job = state?.job;
  if (!state) return { request: null, submit: null };
  const status = job?.status ?? "";
  // Draft sync has its own save indicator, including after a tracker reload.
  if (status === "content" || /^content(?:[-_]?sync)?$/i.test(job?.kind ?? "")) {
    track.current = null; rememberTrack(null); return { request: null, submit: null };
  }
  const submitJob = job?.kind === "publish" || job?.kind === "review" || /^(reviewing|publishing|updating)$/.test(status);
  const history = state.history ?? [];
  if (!job && state.previewChecking && !track.current) {
    const latestUser = [...history].reverse().find(e => e.role === "user" && typeof e.ts === "number");
    if (latestUser?.ts) track.current = restoreTrack(latestUser.ts) ?? { id: latestUser.ts, version: state.previewVersion, kind: detectWaitKind(latestUser.text), high: 0, paused: 0, hasBuild: true };
  }
  const user = [...history].reverse().find(e => e.role === "user" && (!job || !e.ts || e.ts <= job.startedAt + 1000));
  const startId = job?.startedAt ?? track.current?.id;
  const reply = history.find(e => e.role === "assistant" && startId !== undefined && typeof e.ts === "number" && e.ts >= startId);
  const error = history.find(e => e.role === "error" && startId !== undefined && typeof e.ts === "number" && e.ts >= startId);
  if (job && track.current?.id !== job.startedAt && (state.busy || state.previewChecking || status === "approval" || status === "queued")) {
    const content = state.draft?.requests?.some(r => r.source === "content");
    track.current = restoreTrack(job.startedAt) ?? { id: job.startedAt, version: state.previewVersion, high: 0, paused: 0,
      kind: submitJob ? content ? "contentSubmit" : "submit" : detectWaitKind(user?.text ?? "", job.planOnly || /^(question|plan|plan-only|planOnly)$/.test(job.kind ?? "")) };
  }
  const t = track.current;
  if (!t) return { request: null, submit: null };
  const isSubmit = t.kind === "submit" || t.kind === "contentSubmit";
  const committed = state.draft?.requests?.some(r => r.source !== "content" && !!r.sha && Number(typeof r.at === "string" ? Date.parse(r.at) : r.at ?? 0) >= t.id);
  t.committed ||= !!committed;
  t.built ||= !!t.replyAt && (state.previewBuiltAt ?? 0) > t.replyAt;
  t.ready ||= !!t.replyAt && frameCompletedAt > t.replyAt;
  const decorate = (view: WaitView): WaitView => {
    if (isSubmit || t.kind === "question" || view.done && !t.committed && !t.hasBuild) return view;
    const stage = t.ready ? 4 : t.built ? 3 : t.committed && t.hasBuild ? 2 : 1;
    const current = Math.max(t.ribbonStage ?? 1, stage);
    if (current !== t.ribbonStage) { t.ribbonStage = current; t.ribbonHigh = 0; }
    const elapsed = Math.max(0, (now - (current >= 2 ? t.replyAt ?? t.id : t.id) - t.paused) / 1000);
    const estimate = WAIT_ESTIMATES[t.kind][current >= 2 ? 1 : 0] ?? 50;
    if (!view.error && !t.pausedAt) t.ribbonHigh = Math.max(t.ribbonHigh ?? 0, Math.min(.95, 1 - Math.exp(-elapsed / estimate * 1.6)));
    return { ...view, ribbon: { received: true, changed: !!t.committed, built: !!t.built, ready: !!t.ready, current: Math.min(3, current), partial: t.ribbonHigh ?? 0, elapsed: Math.max(0, (now - t.id) / 1000), paused: t.pausedAt !== undefined, long: elapsed > estimate * 2 } };
  };
  if (stopped.test(status) || (!job && !reply && !t.replyAt && !t.doneAt && !state.previewChecking)) {
    track.current = null; rememberTrack(null); return { request: null, submit: null };
  }
  if (state.approval || status === "approval") {
    t.pausedAt ??= state.approval?.createdAt ?? now;
    rememberTrack(t);
    const view = decorate({ value: t.high, label: "Waiting for your approval" });
    return { request: isSubmit ? null : view, submit: isSubmit ? view : null };
  }
  if (t.pausedAt !== undefined) { t.paused += Math.max(0, now - t.pausedAt); t.pausedAt = undefined; }
  if (failed.test(status) || error || isSubmit && failed.test(state.draft?.review?.state ?? "")) t.error = true;
  if (!isSubmit && !t.replyAt && (reply?.ts || state.previewChecking && job?.stepStartedAt)) t.replyAt = reply?.ts ?? job?.stepStartedAt;
  // A question/no-change reply has no build stage. A reload with previewChecking is already in that stage.
  t.hasBuild ||= !!state.previewChecking || state.previewVersion > t.version || (t.kind !== "question" && !!t.replyAt && ((state.previewBuiltAt ?? 0) > t.replyAt || /^(building|build|previewChecking)$/.test(job?.lastStep ?? status)));
  const hasBuild = !!t.hasBuild;
  if (!t.error && !t.doneAt) {
    if (isSubmit ? terminal.test(state.publish?.status ?? status) || history.some(e => e.role === "note" && (e.ts ?? 0) >= t.id && /^The draft is published|^Your changes are live/i.test(e.text))
      : !!t.replyAt && (!(hasBuild || t.committed) || frameCompletedAt > t.replyAt)) t.doneAt = now;
  }
  let view: WaitView;
  if (t.doneAt) {
    if (now - t.doneAt > 1700) return { request: null, submit: null };
    view = { value: 1, label: isSubmit ? "Live" : hasBuild ? "Preview updated" : "Done", done: true, fading: now - t.doneAt >= 1500 };
  } else if (t.error) view = { value: t.high, label: "The change couldn't finish", error: true };
  else {
    const stage = isSubmit ? /^(publishing|updating)$/.test(status) ? 1 : 0 : t.replyAt && hasBuild ? 1 : 0;
    if (!stage) t.stageStart ??= job?.stepStartedAt ?? t.id;
    const started = stage ? isSubmit ? job?.stepStartedAt ?? t.id : t.replyAt ?? t.id : t.stageStart ?? t.id;
    const label = isSubmit ? stage ? "Publishing" : "Checking your changes" : stage ? "Building the preview" : t.kind === "question" ? "Thinking" : "Making your change";
    view = timedProgress(t.kind, stage, (now - started - (stage ? 0 : t.paused)) / 1000, label, t.high);
    t.high = view.value;
  }
  t.built ||= !!t.replyAt && (state.previewBuiltAt ?? 0) > t.replyAt;
  t.ready ||= !!t.replyAt && frameCompletedAt > t.replyAt;
  view = decorate(view);
  t.view = view;
  rememberTrack(t);
  return { request: isSubmit ? null : view, submit: isSubmit ? view : null };
}