import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useWaitProgress } from "../useWaitProgress";
import type { RelayState } from "../helper";
const base = (): RelayState => ({ busy: true, job: { kind: "change", status: "working", startedAt: 10_000 }, previewVersion: 1, history: [{ role: "user", ts: 10_000, text: "Make the heading bigger" }] });
beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(30_000); });
afterEach(() => vi.useRealTimers());
it("reloads a running request using server elapsed time", () => { const one = renderHook(() => useWaitProgress(base())); const value = one.result.current.request?.value; one.unmount(); const two = renderHook(() => useWaitProgress(base())); expect(two.result.current.request?.value).toBe(value); expect(value).toBeGreaterThan(0.2); });
it("jumps at reply, waits for real build, then completes for 1.5s", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  const reply: RelayState = { ...s, busy: false, previewVersion: 2, previewChecking: true, history: [...s.history, { role: "assistant", text: "Changed", ts: 30_000 }] };
  h.rerender({ state: reply }); expect(h.result.current.request?.value).toBeGreaterThanOrEqual(40 / 90); expect(h.result.current.request?.done).not.toBe(true);
  h.rerender({ state: { ...reply, previewChecking: false, previewBuiltAt: 31_000 } }); expect(h.result.current.request?.value).toBe(1);
  act(() => vi.advanceTimersByTime(1500)); expect(h.result.current.request?.fading).toBe(true);
  act(() => vi.advanceTimersByTime(250)); expect(h.result.current.request).toBeNull();
});
it("finishes a no-change question immediately on reply", () => { const s = base(); s.job = { kind: "question", status: "working", startedAt: 10_000 }; const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } }); h.rerender({ state: { ...s, busy: false, history: [...s.history, { role: "assistant", text: "Answer", ts: 30_000 }] } }); expect(h.result.current.request?.done).toBe(true); });
it("pauses for approval and resumes without counting the wait", () => { const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } }); const value = h.result.current.request?.value; h.rerender({ state: { ...s, job: { ...s.job, kind: "change", startedAt: 10_000, status: "approval" } } }); act(() => vi.advanceTimersByTime(30_000)); expect(h.result.current.request?.value).toBe(value); h.rerender({ state: s }); expect(h.result.current.request?.value).toBe(value); });
it("freezes errors and clears stopped jobs", () => { const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } }); h.rerender({ state: { ...s, job: { kind: "change", status: "error", startedAt: 10_000 } } }); const value = h.result.current.request?.value; act(() => vi.advanceTimersByTime(5000)); expect(h.result.current.request?.value).toBe(value); expect(h.result.current.request?.error).toBe(true); h.rerender({ state: { ...s, job: { kind: "change", status: "stopped", startedAt: 10_000 } } }); expect(h.result.current.request).toBeNull(); });
it("never replays completed history as a new wait", () => { const s = base(); s.busy = false; s.job = { kind: "change", status: "done", startedAt: 10_000 }; expect(renderHook(() => useWaitProgress(s)).result.current.request).toBeNull(); });
it("reloads during preview build even when the relay has cleared its job", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  const building: RelayState = { ...s, busy: false, job: null, previewChecking: true, previewVersion: 2, history: [...s.history, { role: "assistant", text: "Changed", ts: 25_000 }] };
  h.rerender({ state: building }); const value = h.result.current.request?.value; h.unmount();
  const reloaded = renderHook(() => useWaitProgress(building)); expect(reloaded.result.current.request?.value).toBe(value); expect(value).toBeGreaterThan(40 / 90);
});
it("uses content-copy timing and jumps to Publishing then Live", () => { const s = base(); s.job = { kind: "publish", status: "content", startedAt: 10_000 }; s.draft = { requests: [{ id: "edit", request: "Edit", source: "content" }] }; const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } }); expect(h.result.current.submit?.value).toBeCloseTo(35 / 45 * (1 - Math.exp(-20 / 35 * 1.6))); h.rerender({ state: { ...s, job: { kind: "publish", status: "publishing", startedAt: 10_000, stepStartedAt: 30_000 } } }); expect(h.result.current.submit?.value).toBeCloseTo(35 / 45); h.rerender({ state: { ...s, publish: { open: 0, status: "live" } } }); expect(h.result.current.submit?.done).toBe(true); });