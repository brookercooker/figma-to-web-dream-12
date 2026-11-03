import { useEffect, useRef, useState } from "react";
import type { RelayState } from "./helper";
export interface QueuedChange { id: string; message: string; body: Record<string, unknown>; page: string; after: number; status: "pending" | "sending" | "error"; error?: string }
const KEY = "nova:next-changes";
function restore(): QueuedChange[] {
  try { const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "[]"); return Array.isArray(saved) ? saved.filter(q => q && typeof q.id === "string" && typeof q.message === "string" && typeof q.page === "string" && typeof q.after === "number" && Number.isFinite(q.after) && ["pending", "sending", "error"].includes(q.status) && q.body && typeof q.body.message === "string").map(q => ({ ...q, status: q.status === "sending" ? "error" : q.status, ...(q.status === "sending" ? { error: "Check whether this was sent before trying again." } : {}) })) : []; } catch { return []; }
}
export function useChangeQueue(state: RelayState | null, page: string, send: (body: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>, onPageClear: () => void) {
  const [items, setItems] = useState<QueuedChange[]>(restore);
  const itemsRef = useRef(items); itemsRef.current = items;
  const sendRef = useRef(send); sendRef.current = send;
  const sending = useRef(false);
  const gate = useRef<{ after: number; awaitingStart: boolean; previousJob: number } | null>(null);
  const previousPage = useRef(page);
  useEffect(() => { try { if (items.length) sessionStorage.setItem(KEY, JSON.stringify(items)); else sessionStorage.removeItem(KEY); } catch { /* Queue remains usable in this tab. */ } }, [items]);
  useEffect(() => {
    if (itemsRef.current.some(q => q.page !== page)) { setItems([]); onPageClear(); }
    if (previousPage.current === page) return;
    previousPage.current = page;
    if (itemsRef.current.length) { setItems([]); onPageClear(); }
    gate.current = null;
  }, [page, onPageClear]);
  const deliver = async (item: QueuedChange, afterReply = false) => {
    if (sending.current || state?.approval || !state || state.busy && !afterReply || /^(publish|review|content)/i.test(state.job?.kind ?? "")) return;
    sending.current = true;
    setItems(old => old.map(q => q.id === item.id ? { ...q, status: "sending" } : q));
    let result: { ok: boolean; error?: string };
    try { result = await sendRef.current(item.body); } catch { result = { ok: false, error: "That didn't go through. Try again." }; }
    if (result.ok) {
      gate.current = { after: Date.now(), awaitingStart: true, previousJob: state.job?.startedAt ?? 0 };
      setItems(old => old.filter(q => q.id !== item.id).map(q => ({ ...q, after: Date.now() })));
    } else setItems(old => old.map(q => q.id === item.id ? { ...q, status: "error", error: result.error } : q));
    sending.current = false;
  };
  useEffect(() => {
    const first = items[0]; if (!first || first.page !== page || first.status !== "pending" || !state || state.approval || sending.current) return;
    const g = gate.current;
    if (g?.awaitingStart) {
      if (state.job && state.job.startedAt !== g.previousJob) { g.after = state.job.startedAt; g.awaitingStart = false; }
      else if (!state.history.some(e => e.role === "user" && (e.ts ?? 0) >= g.after)) return;
      else g.awaitingStart = false;
    }
    const after = g?.after ?? first.after;
    const error = /^(failed|error|blocked|stopped|cancelled|canceled)$/.test(state.job?.status ?? "") || state.history.some(e => e.role === "error" && (e.ts ?? 0) >= after);
    if (error) { setItems(old => old.map(q => ({ ...q, status: "error" }))); return; }
    if (state.history.some(e => e.role === "assistant" && (e.ts ?? 0) >= after)) void deliver(first, true);
  }, [state, items, page]);
  return { items, add: (message: string, body: Record<string, unknown>) => setItems(old => [...old, { id: crypto.randomUUID(), message, body, page, after: state?.job?.startedAt ?? Date.now(), status: "pending" }]), remove: (id: string) => setItems(old => old.filter(q => q.id !== id)), sendNow: (id: string) => { const item = itemsRef.current.find(q => q.id === id); if (item) void deliver(item); } };
}