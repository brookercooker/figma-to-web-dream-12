import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useWaitProgress } from "../useWaitProgress";
import type { RelayState } from "../helper";
import { RELAY } from "../helper";
import { ribbonSegments } from "../stageRibbon";
import { timedProgress } from "../waitEstimates";
const base = (): RelayState => ({ busy: true, job: { kind: "change", status: "working", startedAt: 10_000 }, previewVersion: 1, history: [{ role: "user", ts: 10_000, text: "Make the heading bigger" }] });
beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(30_000); });
afterEach(() => vi.useRealTimers());
it("shows an error for 12 seconds, fades, dismisses and retains the reload schedule", () => {
  const s = base(); const one = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  const failure = { ...s, busy: false, job: { kind: "change", status: "failed", startedAt: 10000 } };
  one.rerender({ state: failure }); expect(one.result.current.request?.error).toBe(true);
  act(() => vi.advanceTimersByTime(8000)); one.unmount();
  const two = renderHook(() => useWaitProgress(failure));
  act(() => vi.advanceTimersByTime(3750)); expect(two.result.current.request?.fading).not.toBe(true);
  act(() => vi.advanceTimersByTime(250)); expect(two.result.current.request?.fading).toBe(true);
  act(() => vi.advanceTimersByTime(250)); expect(two.result.current.request).toBeNull();
  two.unmount(); expect(renderHook(() => useWaitProgress(failure)).result.current.request).toBeNull();
});
it("pauses a failure deadline across multiple hovered/focused surfaces and dismisses explicitly", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  h.rerender({ state: { ...s, job: { kind: "change", status: "error", startedAt: 10000 } } });
  const a = {}, b = {};
  act(() => { h.result.current.request?.errorControls?.pause(a, true); h.result.current.request?.errorControls?.pause(b, true); });
  act(() => vi.advanceTimersByTime(20000)); expect(h.result.current.request?.error).toBe(true);
  act(() => h.result.current.request?.errorControls?.pause(a, false));
  act(() => vi.advanceTimersByTime(20000)); expect(h.result.current.request?.fading).not.toBe(true);
  act(() => h.result.current.request?.errorControls?.pause(b, false));
  act(() => vi.advanceTimersByTime(11750)); expect(h.result.current.request?.error).toBe(true);
  act(() => h.result.current.request?.errorControls?.dismiss()); expect(h.result.current.request).toBeNull();
});
it("auto-dismisses review failures without offering an unsafe retry", () => {
  const s = { ...base(), job: { kind: "review", status: "failed", startedAt: 10000 }, busy: false };
  const h = renderHook(() => useWaitProgress(s)); expect(h.result.current.submit?.error).toBe(true);
  expect(h.result.current.submit?.errorControls?.retry).toBeUndefined();
  act(() => vi.advanceTimersByTime(12250)); expect(h.result.current.submit).toBeNull();
});
it("segments the existing estimate-driven level without changing easing or remaining time", () => {
  const s = base();
  const h = renderHook(({ state }: { state: RelayState }) => useWaitProgress(state), { initialProps: { state: s } });
  const expected = timedProgress("normal", 0, 20, "Making your change");
  expect(h.result.current.request?.value).toBe(expected.value);
  expect(h.result.current.request?.ribbon?.partial).toBe(expected.value);
  expect(h.result.current.request?.label).toBe("Making your change · about a minute left");
  h.rerender({ state: { ...s, previewChecking: true, history: [...s.history, { role: "assistant", text: "Changed", ts: 30_000 }] } });
  expect(h.result.current.request?.ribbon?.partial).toBe(h.result.current.request?.value);
  expect(h.result.current.request?.label).toBe("Making your change · about 50 sec left");
});
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
  const building: RelayState = { ...committed, previewChecking: false, previewBuiltAt: 31000 };
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
  const reply: RelayState = { ...s, busy: false, previewVersion: 2, previewChecking: true, draft: { requests: [{ id: "change", source: "chat", sha: "abc", at: 30000, request: "Change" }] }, history: [...s.history, { role: "assistant", text: "Changed", ts: 30_000 }] };
  h.rerender({ state: reply }); expect(h.result.current.request?.value).toBeGreaterThanOrEqual(40 / 90); expect(h.result.current.request?.done).not.toBe(true);
  h.rerender({ state: { ...reply, previewChecking: false, previewBuiltAt: 31_000 }, frame: 0 }); expect(h.result.current.request?.done).not.toBe(true);
  h.rerender({ state: { ...reply, previewChecking: false, previewBuiltAt: 31_000 }, frame: 32_000 }); expect(h.result.current.request?.value).toBe(1);
  act(() => vi.advanceTimersByTime(1500)); expect(h.result.current.request?.fading).toBe(true);
  act(() => vi.advanceTimersByTime(250)); expect(h.result.current.request).toBeNull();
});
it("shows Received done and making the change active while running, ignoring time and older commits", () => {
  const s = { ...base(), draft: { requests: [{ id: "old", sha: "old", at: 9999, request: "Old" }] } };
  const h = renderHook(() => useWaitProgress(s));
  expect(h.result.current.request?.ribbon?.current).toBe(1);
  expect(h.result.current.request?.ribbon?.received).toBe(true);
  expect(h.result.current.request?.label).toMatch(/^Making your change/);
  act(() => vi.advanceTimersByTime(100000));
  expect(h.result.current.request?.ribbon?.current).toBe(1);
  expect(h.result.current.request?.ribbon?.changed).toBe(false);
});
it("skips preview stages for a no-commit change reply", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  h.rerender({ state: { ...s, busy: false, job: { ...s.job, kind: "change", startedAt: 10000, status: "done" }, history: [...s.history, { role: "assistant", text: "Nothing changed", ts: 30000 }] } });
  expect(h.result.current.request?.label).toBe("Done");
  expect(h.result.current.request?.ribbon?.current).toBe(1);
  expect(h.result.current.request?.ribbon?.built).toBe(false);
});
it("a queued next job gets its own run and cannot inherit the previous commit or loaded frame", () => {
  const s = base(); const h = renderHook(({ state, frame }) => useWaitProgress(state, frame), { initialProps: { state: s, frame: 0 } });
  const first: RelayState = { ...s, previewChecking: true, draft: { requests: [{ id: "first", sha: "abc", at: 30000, request: "First" }] } };
  h.rerender({ state: first, frame: 0 }); expect(h.result.current.request?.ribbon?.current).toBe(2);
  const next = { ...first, job: { kind: "change", status: "working", startedAt: 40000 }, history: [...s.history, { role: "user" as const, ts: 40000, text: "Next change" }] };
  h.rerender({ state: next, frame: 35000 });
  // A remains visible until finished; B is retained separately rather than replacing it.
  expect(h.result.current.request?.ribbon?.current).toBe(2); expect(h.result.current.request?.ribbon?.ready).toBe(false);
});
it("matches the job ID instead of a newer unrelated commit and supports changes[]", () => {
  const s: RelayState = { ...base(), job: { ...base().job, id: "A", status: "working", startedAt: 10000 }, changes: [{ id: "unrelated", sha: "other", at: 20000, request: "Other" }] };
  const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  expect(h.result.current.request?.ribbon?.changed).toBe(false);
  h.rerender({ state: { ...s, changes: [...(s.changes ?? []), { id: "A", sha: "a", request: "A" }] } });
  expect(h.result.current.request?.ribbon?.changed).toBe(true);
});
it("uses timestamp fallback only for an older relay without job.id", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  h.rerender({ state: { ...s, changes: [{ id: "legacy-entry", sha: "legacy", at: 15000, request: "Old relay change" }] } });
  expect(h.result.current.request?.ribbon?.changed).toBe(true);
});
it("retains two ID-keyed runs across reload when B commits before A builds, then advances each independently", () => {
  const a: RelayState = { ...base(), job: { id: "A", kind: "change", status: "working", startedAt: 10000 } };
  const h = renderHook(({ state, frame }) => useWaitProgress(state, frame), { initialProps: { state: a, frame: 0 } });
  const aCommit = { id: "A", sha: "a", at: 18000, request: "A" };
  h.rerender({ state: { ...a, draft: { requests: [aCommit] } }, frame: 0 });
  const b: RelayState = { ...a, job: { id: "B", kind: "change", status: "working", startedAt: 20000 }, previewChecking: true,
    history: [...a.history, { role: "assistant", ts: 19000, text: "A changed" }, { role: "user", ts: 20000, text: "B change" }], draft: { requests: [aCommit, { id: "B", sha: "b", at: 28000, request: "B" }] } };
  h.rerender({ state: b, frame: 0 }); expect(h.result.current.request?.ribbon?.elapsed).toBe(20);
  h.unmount();
  const reloaded = renderHook(({ state, frame }) => useWaitProgress(state, frame), { initialProps: { state: b, frame: 0 } });
  expect(reloaded.result.current.request?.ribbon?.elapsed).toBe(20);
  // A's exact build precedes B's commit, even though its notification arrives later.
  const aBuilt: RelayState = { ...b, previewChecking: false, previewVersion: 2, previewBuiltAt: 25000 };
  reloaded.rerender({ state: aBuilt, frame: 31000 }); expect(reloaded.result.current.request?.done).toBe(true);
  act(() => vi.advanceTimersByTime(1800));
  expect(reloaded.result.current.request?.ribbon?.elapsed).toBeCloseTo(11.75);
  expect(reloaded.result.current.request?.ribbon?.ready).toBe(false);
  reloaded.rerender({ state: { ...aBuilt, previewVersion: 3, previewBuiltAt: 33000 }, frame: 34000 });
  expect(reloaded.result.current.request?.done).toBe(true);
});
it("prefers a change's authoritative builtAt over inference, and still requires a loaded frame", () => {
  const s: RelayState = { ...base(), job: { id: "A", kind: "change", status: "working", startedAt: 10000 } };
  const h = renderHook(({ state, frame }) => useWaitProgress(state, frame), { initialProps: { state: s, frame: 0 } });
  const change = { id: "A", sha: "a", at: 20000, builtAt: 19000, request: "A" };
  const inferred = { ...s, previewVersion: 3, previewBuiltAt: 30000, draft: { requests: [change] } };
  h.rerender({ state: inferred, frame: 31000 }); expect(h.result.current.request?.ribbon?.ready).toBe(false);
  const built = { ...inferred, draft: { requests: [{ ...change, builtAt: 32000 }] } };
  h.rerender({ state: built, frame: 31000 }); expect(h.result.current.request?.done).not.toBe(true);
  h.rerender({ state: built, frame: 33000 }); expect(h.result.current.request?.done).toBe(true);
});
it("restores commit/build stage across reload and waits for the newly loaded frame", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  const changed: RelayState = { ...s, busy: false, job: { kind: "change", status: "done", startedAt: 10000 }, draft: { requests: [{ id: "new", sha: "abc", at: 25000, request: "New" }] }, history: [...s.history, { role: "assistant", ts: 26000, text: "Changed" }] };
  h.rerender({ state: changed }); expect(h.result.current.request?.ribbon?.current).toBe(2); h.unmount();
  const built = { ...changed, previewVersion: 2, previewBuiltAt: 31000 };
  const reloaded = renderHook(({ frame }) => useWaitProgress(built, frame), { initialProps: { frame: 0 } });
  expect(reloaded.result.current.request?.ribbon?.current).toBe(2);
  expect(reloaded.result.current.request?.done).not.toBe(true);
  reloaded.rerender({ frame: 32000 }); expect(reloaded.result.current.request?.ribbon?.current).toBe(3);
  expect(reloaded.result.current.request?.done).toBe(true);
});
it("freezes highlighted stages on approval and error even if new metadata arrives", () => {
  const s = base(); const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } });
  const metadata = { requests: [{ id: "new", sha: "abc", at: 25000, request: "New" }] };
  h.rerender({ state: { ...s, draft: metadata, job: { kind: "change", status: "approval", startedAt: 10000 } } });
  expect(h.result.current.request?.ribbon?.current).toBe(1);
  expect(h.result.current.request?.label).toBe("Waiting for your approval");
  h.rerender({ state: { ...s, draft: metadata, job: { kind: "change", status: "error", startedAt: 10000 } } });
  expect(h.result.current.request?.ribbon?.current).toBe(1);
  expect(h.result.current.request?.error).toBe(true);
});
it("finishes a no-change question immediately on reply", () => { const s = base(); s.job = { kind: "question", status: "working", startedAt: 10_000 }; const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: s } }); h.rerender({ state: { ...s, busy: false, history: [...s.history, { role: "assistant", text: "Answer", ts: 30_000 }] } }); expect(h.result.current.request?.done).toBe(true); });
it.each(["queued", "waiting", "approval"])("keeps Received active for a not-started %s request", status => {
  const s: RelayState = { ...base(), job: { id: "A", kind: "change", status, startedAt: 10000 } };
  const h = renderHook(() => useWaitProgress(s));
  expect(h.result.current.request?.ribbon?.current).toBe(0);
  expect(h.result.current.request?.ribbon?.received).toBe(false);
  expect(h.result.current.request?.label).toMatch(status === "approval" ? /^Waiting for your approval/ : /^Received/);
});
it("advances queued to running to own commit without regressions or estimated-stage labels", () => {
  const queued: RelayState = { ...base(), job: { id: "A", kind: "change", status: "queued", startedAt: 10000 } };
  const h = renderHook(({ state }) => useWaitProgress(state), { initialProps: { state: queued } });
  expect(h.result.current.request?.ribbon?.current).toBe(0);
  const running = { ...queued, job: { ...queued.job, id: "A", kind: "change", startedAt: 10000, status: "running" } };
  h.rerender({ state: running });
  expect(h.result.current.request?.ribbon?.current).toBe(1);
  expect(h.result.current.request?.ribbon?.received).toBe(true);
  h.rerender({ state: { ...running, previewChecking: true, changes: [{ id: "B", sha: "other", at: 20000, request: "B" }] } });
  expect(h.result.current.request?.label).toMatch(/^Making your change/);
  const committed = { ...running, changes: [{ id: "A", sha: "own", at: 20000, request: "A" }] };
  h.rerender({ state: committed });
  expect(h.result.current.request?.ribbon?.current).toBe(2);
  expect(h.result.current.request?.ribbon?.changed).toBe(true);
  expect(h.result.current.request?.label).toMatch(/^Building the preview/);
  h.rerender({ state: queued });
  expect(h.result.current.request?.ribbon?.current).toBe(2);
  expect(h.result.current.request?.label).toMatch(/^Building the preview/);
});
it("retains Received for a second queued run while the first builds and after it finishes", () => {
  const a: RelayState = { ...base(), job: { id: "A", kind: "change", status: "working", startedAt: 10000 } };
  const h = renderHook(({ state, frame }) => useWaitProgress(state, frame), { initialProps: { state: a, frame: 0 } });
  const b: RelayState = { ...a, job: { id: "B", kind: "change", status: "queued", startedAt: 25000 }, previewChecking: true,
    changes: [{ id: "A", sha: "a", at: 20000, request: "A" }], history: [...a.history, { role: "assistant", ts: 21000, text: "A changed" }, { role: "user", ts: 25000, text: "B" }] };
  h.rerender({ state: b, frame: 0 });
  expect(h.result.current.request?.ribbon?.current).toBe(2);
  const tracks = JSON.parse(sessionStorage.getItem(`nova:wait-progress:${RELAY}`) ?? "[]");
  expect(tracks.find((t: { jobId: string }) => t.jobId === "B").view.ribbon).toMatchObject({ current: 0, received: false, changed: false });
  const built = { ...b, previewChecking: false, previewBuiltAt: 31000, previewVersion: 2 };
  h.rerender({ state: built, frame: 32000 });
  act(() => vi.advanceTimersByTime(1800));
  expect(h.result.current.request?.ribbon?.current).toBe(0);
  expect(h.result.current.request?.label).toMatch(/^Received/);
});
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