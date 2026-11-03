import { useRef, useState } from "react";
import { postToHelper, RELAY, type Entry, type RelayState } from "./helper";
type Attempt = { body: Record<string, unknown>; after: number; sentAt: number; userAt?: number };
const KEY = `nova:request-retries:${RELAY}`;
function restore(): Attempt[] {
  try { const rows = JSON.parse(sessionStorage.getItem(KEY) ?? "[]"); return Array.isArray(rows) ? rows.filter(r => r?.body && typeof r.body.message === "string" && typeof r.after === "number" && typeof r.sentAt === "number") : []; } catch { return []; }
}
export function useRequestRetry(state: RelayState | null, offline: boolean, refresh: () => void) {
  const attempts = useRef<Attempt[]>(restore());
  const lock = useRef(false);
  const [sending, setSending] = useState(false);
  const [optimisticAt, setOptimisticAt] = useState<number | null>(null);
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(attempts.current)); } catch { /* In-memory snapshots still include attachments and drawings. */ } };
  const history = state?.history ?? [];
  for (const a of attempts.current) {
    if (a.userAt === undefined) {
      const user = history.find(e => e.role === "user" && (e.ts ?? 0) > a.after && e.text === a.body.message);
      if (user?.ts) { a.userAt = user.ts; save(); }
    }
  }
  const disabled = sending || offline || !!state?.busy || !!state?.approval || /^(queued|working|running|reviewing|publishing|updating)$/.test(state?.job?.status ?? "");
  const sendPrepared = async (body: Record<string, unknown>) => {
    const attempt = { body: structuredClone(body), after: Math.max(0, ...history.filter(e => e.role === "user").map(e => e.ts ?? 0)), sentAt: Date.now() };
    attempts.current.push(attempt); save();
    return postToHelper("/send", body);
  };
  const attemptFor = (at: number) => {
    const user = [...history].reverse().find(e => e.role === "user" && (e.ts ?? Infinity) <= at + 1000);
    return [...attempts.current].reverse().find(a => a.userAt === user?.ts || a.userAt === undefined && user?.text === a.body.message && (user.ts ?? 0) > a.after);
  };
  const retry = async (at: number, clear: () => void) => {
    const attempt = attemptFor(at);
    if (!attempt || disabled || lock.current) return;
    lock.current = true; setSending(true);
    try {
      const result = await sendPrepared(attempt.body);
      if (result.ok) { clear(); setOptimisticAt(Date.now()); }
      return result;
    } finally { lock.current = false; setSending(false); refresh(); }
  };
  const retryNote = (at: number) => attemptFor(at) ? undefined : "The original request details are unavailable. Reattach any files or drawings and send the request again.";
  const currentJob = state?.job;
  const statusFailed = /^(failed|error|blocked)$/.test(currentJob?.status ?? "") && !/^(publish|review|content)/.test(currentJob?.kind ?? "");
  const syntheticError: Entry | null = statusFailed && currentJob && !history.some(e => e.role === "error" && (e.ts ?? 0) >= currentJob.startedAt)
    ? { role: "error", text: "The change couldn't finish", ts: currentJob.startedAt } : null;
  const optimisticState = optimisticAt && state && (currentJob?.startedAt ?? 0) < optimisticAt && !history.some(e => e.role === "user" && (e.ts ?? 0) >= optimisticAt)
    ? { ...state, busy: true, job: { id: `retry:${optimisticAt}`, kind: "change", status: "queued", startedAt: optimisticAt } } : state;
  return { sendPrepared, retry, retryNote, canRetry: (at: number) => !!attemptFor(at), disabled, syntheticError, optimisticState };
}