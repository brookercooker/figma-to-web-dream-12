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
    newest: Math.max(0, ...(state?.history ?? []).map(e => e.ts ?? 0)),
    replyTimestamp: last?.ts ?? 0,
    errorTimestamp: error?.ts ?? 0,
    approvalTimestamp: state?.approval?.createdAt ?? 0,
    approvalId: state?.approval?.id ?? "",
    problems: JSON.stringify(problems),
    working: isWorking(state) || Boolean(state?.busy),
  };
}

export function usePhoneChat(phone: boolean, manual: boolean, state: RelayState | null, completedAt = 0, onAttention?: () => void) {
  const attentionCallback = useRef(onAttention); attentionCallback.current = onAttention;
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [opening, setOpening] = useState(0);
  const signals = phoneChatSignals(state);
  const baseline = useRef<number | null>(null);
  const seen = useRef<{ newest: number; approvalId: string; problems: string; completedAt: number } | null>(null);
  const show = () => { setOpen(true); setUnread(false); setOpening(n => n + 1); };
  const close = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setOpen(false);
  };
  useEffect(() => {
    if (!phone || manual) setOpen(false);
    // The first populated poll is history, even when it arrives after a null loading state.
    if (!state) return;
    const prior = seen.current;
    seen.current = { newest: signals.newest, approvalId: signals.approvalId, problems: signals.problems, completedAt };
    if (baseline.current === null) { baseline.current = signals.newest; return; }
    if (!prior || !phone || manual) return;
    const after = Math.max(baseline.current, prior.newest);
    const newReply = signals.replyTimestamp > after;
    const newError = signals.errorTimestamp > after;
    const newApproval = Boolean(signals.approvalId && signals.approvalId !== prior.approvalId && signals.approvalTimestamp > baseline.current);
    const newProblem = signals.problems !== "null" && signals.problems !== prior.problems;
    const newLive = completedAt > prior.completedAt;
    if ((newReply || newApproval || newProblem || newLive) && !open) setUnread(true);
    if (newError || newApproval || newProblem) { attentionCallback.current?.(); show(); }
  }, [phone, manual, state, signals.newest, signals.replyTimestamp, signals.errorTimestamp, signals.approvalId, signals.approvalTimestamp, signals.problems, completedAt]);
  useEffect(() => {
    if (!phone || !open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phone, open]);
  return { open: phone && !manual && open, unread, opening, working: signals.working, show, close };
}