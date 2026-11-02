import { useEffect, useRef, useState } from "react";
import type { RelayState } from "./helper";
import { detectWaitKind, timedProgress, type WaitKind, type WaitView } from "./waitEstimates";

type Track = { id: number; version: number; kind: WaitKind; high: number; replyAt?: number; pausedAt?: number; paused: number; doneAt?: number; error?: boolean; hasBuild?: boolean; view?: WaitView };
const terminal = /^(done|complete|completed|published|live)$/;
const failed = /^(failed|error|blocked)$/;
const stopped = /^(stopped|cancelled|canceled)$/;
export function useWaitProgress(state: RelayState | null, frameCompletedAt = 0): { request: WaitView | null; submit: WaitView | null } {
  const [now, setNow] = useState(Date.now);
  const track = useRef<Track | null>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []);
  const job = state?.job;
  if (!state) return { request: null, submit: null };
  const status = job?.status ?? "";
  const submitJob = job?.kind === "publish" || job?.kind === "review" || /^(reviewing|publishing|updating|content)$/.test(status);
  const history = state.history ?? [];
  const user = [...history].reverse().find(e => e.role === "user" && (!job || !e.ts || e.ts <= job.startedAt + 1000));
  const reply = history.find(e => e.role === "assistant" && job && typeof e.ts === "number" && e.ts >= job.startedAt);
  const error = history.find(e => e.role === "error" && job && typeof e.ts === "number" && e.ts >= job.startedAt);
  if (job && track.current?.id !== job.startedAt && (state.busy || state.previewChecking || status === "approval" || status === "queued")) {
    const content = state.draft?.requests?.some(r => r.source === "content");
    track.current = { id: job.startedAt, version: state.previewVersion, high: 0, paused: 0,
      kind: submitJob ? content || status === "content" ? "contentSubmit" : "submit" : detectWaitKind(user?.text ?? "", job.planOnly || /^(question|plan|plan-only|planOnly)$/.test(job.kind ?? "")) };
  }
  const t = track.current;
  if (!t) return { request: null, submit: null };
  const isSubmit = t.kind === "submit" || t.kind === "contentSubmit";
  if (stopped.test(status) || (!job && !t.replyAt && !t.doneAt && !state.previewChecking)) {
    track.current = null; return { request: null, submit: null };
  }
  if (state.approval || status === "approval") {
    t.pausedAt ??= state.approval?.createdAt ?? now;
    const view = { value: t.high, label: "Waiting for your approval" };
    return { request: isSubmit ? null : view, submit: isSubmit ? view : null };
  }
  if (t.pausedAt !== undefined) { t.paused += Math.max(0, now - t.pausedAt); t.pausedAt = undefined; }
  if (failed.test(status) || error) t.error = true;
  if (!isSubmit && !t.replyAt && (reply?.ts || state.previewChecking && job?.stepStartedAt)) t.replyAt = reply?.ts ?? job?.stepStartedAt;
  // A question/no-change reply has no build stage. A reload with previewChecking is already in that stage.
  t.hasBuild ||= !!state.previewChecking || state.previewVersion > t.version || (t.kind !== "question" && !!t.replyAt && ((state.previewBuiltAt ?? 0) > t.replyAt || /^(building|build|previewChecking)$/.test(job?.lastStep ?? status)));
  const hasBuild = !!t.hasBuild;
  if (!t.error && !t.doneAt) {
    if (isSubmit ? terminal.test(state.publish?.status ?? status) || history.some(e => e.role === "note" && (e.ts ?? 0) >= t.id && /^The draft is published|^Your changes are live/i.test(e.text))
      : !!t.replyAt && (!hasBuild || (state.previewBuiltAt ?? 0) > t.replyAt || frameCompletedAt > t.replyAt)) t.doneAt = now;
  }
  let view: WaitView;
  if (t.doneAt) {
    if (now - t.doneAt > 1700) return { request: null, submit: null };
    view = { value: 1, label: isSubmit ? "Live" : hasBuild ? "Preview updated" : "Done", done: true, fading: now - t.doneAt >= 1500 };
  } else if (t.error) view = { value: t.high, label: "The change couldn't finish", error: true };
  else {
    const stage = isSubmit ? /^(publishing|updating)$/.test(status) ? 1 : 0 : t.replyAt && hasBuild ? 1 : 0;
    const started = stage ? isSubmit ? job?.stepStartedAt ?? t.id : t.replyAt ?? t.id : job?.stepStartedAt ?? t.id;
    const label = isSubmit ? stage ? "Publishing" : "Checking your changes" : stage ? "Building the preview" : t.kind === "question" ? "Thinking" : "Making your change";
    view = timedProgress(t.kind, stage, (now - started - (stage ? 0 : t.paused)) / 1000, label, t.high);
    t.high = view.value;
  }
  t.view = view;
  return { request: isSubmit ? null : view, submit: isSubmit ? view : null };
}