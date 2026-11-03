import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useWaitProgress } from "../useWaitProgress";
import type { RelayState } from "../helper";
import { RELAY } from "../helper";
import { ribbonSegments } from "../stageRibbon";
const base = (): RelayState => ({ busy: true, job: { kind: "change", status: "working", startedAt: 10_000 }, previewVersion: 1, history: [{ role: "user", ts: 10_000, text: "Make the heading bigger" }] });
beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(30_000); });
afterEach(() => vi.useRealTimers());
it("requires a commit for Change made and a confirmed frame for Ready, never filling early", () => {
  const s = base();
  const h = renderHook(({ state, frame }: { state: RelayState; frame: number }) => useWaitProgress(state, frame), { initialProps: { state: s, frame: 0 } });
  const initial = h.result.current.request?.ribbon;
  expect(initial?.received).toBe(true); expect(initial?.changed).toBe(false);
  const value = initial?.partial ?? 0;
  act(() => vi.advanceTimersByTime(500000));
  expect(h.result.current.request?.ribbon?.partial).toBeGreaterThanOrEqual(value);
  expect(h.result.current.request?.ribbon?.partial).toBeLessThan(1);
  const reply: RelayState = { ...s, busy: false, previewChecking: true, history: [...s.history, { role: "assistant", text: "Reply", ts: 30000 }] };
  h.rerender({ state: reply, frame: 0 }); expect(h.result.current.request?.ribbon?.changed).toBe(false);
  const committed: RelayState = { ...reply, draft: { requests: [{ id: "code", source: "chat", request: "Heading", sha: "abc123", at: 30000 }] } };
  h.rerender({ state: committed, frame: 0 }); expect(h.result.current.request?.ribbon?.changed).toBe(true);
  const building: RelayState = { ...committed, previewBuiltAt: 31000 };
  h.rerender({ state: building, frame: 0 }); expect(h.result.current.request?.done).not.toBe(true);
  expect(h.result.current.request?.ribbon?.ready).toBe(false);
  h.rerender({ state: building, frame: 32000 });
  const done = h.result.current.request?.ribbon;
  expect(done?.ready).toBe(true);
  if (!done) throw new Error("Expected ribbon");
  expect(ribbonSegments(done).every(segment => segment.fill === 1)).toBe(true);
});
it("reloads a running request using server elapsed time", () => { const one = renderHook(() => useWaitProgress(base())); const value = one.result.current.request?.value; one.unmount(); const two = renderHook(() => useWaitProgress(base())); expect(two.result.current.request?.value).toBe(value); expect(value).toBeGreaterThan(0.2); });
it("jumps at reply, waits for real build, then completes for 1.5s", () => {
  const s = base(); const h = renderHook(({ state, frame = 0 }: { state: RelayState; frame?: number }) => useWaitProgress(state, frame), { initialProps: { state: s, frame: 0 } });
  const reply: RelayState = { ...s, busy: false, previewVersion: 2, previewChecking: true, history: [...s.history, { role: "assistant", text: "Changed", ts: 30_000 }] };
  h.rerender({ state: reply }); expect(h.result.current.request?.value).toBeGreaterThanOrEqual(40 / 90); expect(h.result.current.request?.done).not.toBe(true);
  h.rerender({ state: { ...reply, previewChecking: false, previewBuiltAt: 31_000 }, frame: 0 }); expect(h.result.current.request?.done).not.toBe(true);
  h.rerender({ state: { ...reply, previewChecking: false, previewBuiltAt: 31_000 }, frame: 32_000 }); expect(h.result.current.request?.value).toBe(1);
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
it.each([
  { kind: "publish", status: "content" },
  { kind: "content", status: "working" },
  { kind: "content-sync", status: "working" },
  { kind: "contentSync", status: "done" },
])("excludes draft-sync jobs from both progress tracks: $kind/$status", (job) => {
  const s: RelayState = { ...base(), job: { ...job, startedAt: 10_000 }, previewChecking: true };
  const h = renderHook(() => useWaitProgress(s));
  expect(h.result.current).toEqual({ request: null, submit: null });
  act(() => vi.advanceTimersByTime(1000));
  expect(h.result.current).toEqual({ request: null, submit: null });
});
it.each(["contentSubmit", "normal"])("drops a persisted %s track when reloading a content job", (kind) => {
  const key = `nova:wait-progress:${RELAY}`;
  sessionStorage.setItem(key, JSON.stringify({ id: 10_000, version: 1, kind, high: 0.3, paused: 0 }));
  const s: RelayState = { ...base(), job: { kind: "publish", status: "content", startedAt: 10_000 } };
  const h = renderHook(() => useWaitProgress(s));
  expect(h.result.current).toEqual({ request: null, submit: null });
  expect(sessionStorage.getItem(key)).toBeNull();
});
it("clears an existing request track when draft sync starts", () => {
  const s = base();
  const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  expect(h.result.current.request?.value).toBeGreaterThan(0);
  h.rerender({ state: { ...s, job: { kind: "content", status: "content", startedAt: 30_000 } } });
  expect(h.result.current).toEqual({ request: null, submit: null });
});
it("uses contentSubmit timing for a real review and jumps to Publishing then Live", () => {
  const s = base();
  s.job = { kind: "review", status: "reviewing", startedAt: 10_000 };
  s.draft = { requests: [{ id: "edit", request: "Edit", source: "content" }] };
  const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  expect(h.result.current.request).toBeNull();
  expect(h.result.current.submit?.value).toBeCloseTo(35 / 45 * (1 - Math.exp(-20 / 35 * 1.6)));
  h.rerender({ state: { ...s, job: { kind: "publish", status: "publishing", startedAt: 10_000, stepStartedAt: 30_000 } } });
  expect(h.result.current.submit?.value).toBeCloseTo(35 / 45);
  h.rerender({ state: { ...s, publish: { open: 0, status: "live" } } });
  expect(h.result.current.submit?.done).toBe(true);
});
it.each(["review", "publish"])("keeps plain %s jobs on the submit estimate", (kind) => {
  const s: RelayState = { ...base(), job: { kind, status: "reviewing", startedAt: 10_000 } };
  const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  expect(h.result.current.request).toBeNull();
  expect(h.result.current.submit?.value).toBeCloseTo(30 / 40 * (1 - Math.exp(-20 / 30 * 1.6)));
  h.rerender({ state: { ...s, job: { kind, status: "publishing", startedAt: 10_000, stepStartedAt: 30_000 } } });
  expect(h.result.current.submit?.value).toBeCloseTo(30 / 40);
  h.rerender({ state: { ...s, publish: { open: 0, status: "live" } } });
  expect(h.result.current.submit?.done).toBe(true);
});