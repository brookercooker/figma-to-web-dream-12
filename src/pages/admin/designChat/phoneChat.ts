import { useEffect, useRef, useState } from "react";
import type { RelayState } from "./helper";
import { isWorking, problemsModel, visibleText } from "./logic";

/** Presentation-only signals; the relay continues to own requests and approvals. */
export function phoneChatSignals(state: RelayState | null) {
  const entries = (state?.history ?? []).filter(e => e.role !== "user" && visibleText(e) !== null);
  const last = entries.at(-1);
  const error = [...entries].reverse().find(e => e.role === "error");
  const problems = problemsModel(state);
  return {
    activity: last ? JSON.stringify([entries.length, last.role, last.ts, last.text]) : "",
    attention: JSON.stringify([state?.approval?.id ?? "", error ? [error.ts, error.text] : null, problems ?? null]),
    urgent: Boolean(state?.approval || error || problems),
    working: isWorking(state) || Boolean(state?.busy),
  };
}

export function usePhoneChat(phone: boolean, manual: boolean, state: RelayState | null, completedAt = 0) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [opening, setOpening] = useState(0);
  const signals = phoneChatSignals(state);
  const seen = useRef<{ activity: string; attention: string; completedAt: number } | null>(null);
  const show = () => { setOpen(true); setUnread(false); setOpening(n => n + 1); };
  const close = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setOpen(false);
  };
  useEffect(() => {
    if (!phone || manual) { setOpen(false); return; }
    const prior = seen.current;
    seen.current = { activity: signals.activity, attention: signals.attention, completedAt };
    const changed = prior && (prior.activity !== signals.activity || prior.completedAt !== completedAt);
    if (changed && !open) setUnread(true);
    if (signals.urgent && (!prior || prior.attention !== signals.attention)) show();
  }, [phone, manual, signals.activity, signals.attention, signals.urgent, completedAt]);
  useEffect(() => {
    if (!phone || !open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phone, open]);
  return { open: phone && !manual && open, unread, opening, working: signals.working, show, close };
}