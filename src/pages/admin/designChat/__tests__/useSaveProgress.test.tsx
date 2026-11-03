import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
const sync = vi.hoisted(() => ({ pending: false, failed: false, deferred: false, start: 10_000 }));
vi.mock("../contentSync", () => ({ CONTENT_SYNC_CHANGED: "sync", contentSyncPending: () => sync.pending, contentSyncFailed: () => sync.failed, contentSyncDeferred: () => sync.deferred, contentSyncStartedAt: () => sync.start }));
import { useSaveProgress } from "../useSaveProgress";
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(15_000); sync.pending = false; sync.failed = false; sync.deferred = false; });
afterEach(() => vi.useRealTimers());
it("keeps manual progress after saving until the draft accepts it", () => { const h = renderHook(({ saving }) => useSaveProgress(saving), { initialProps: { saving: true } }); sync.pending = true; h.rerender({ saving: false }); expect(h.result.current?.done).not.toBe(true); act(() => vi.advanceTimersByTime(5000)); const value = h.result.current?.value; sync.failed = true; act(() => window.dispatchEvent(new Event("sync"))); expect(h.result.current?.error).toBe(true); expect(h.result.current?.value).toBe(value); sync.failed = false; sync.pending = false; act(() => window.dispatchEvent(new Event("sync"))); expect(h.result.current?.value).toBe(1); act(() => vi.advanceTimersByTime(1750)); expect(h.result.current).toBeNull(); });
it("does not show Done when the actual save fails", () => { const h = renderHook(({ saving }) => useSaveProgress(saving, true), { initialProps: { saving: true } }); h.rerender({ saving: false }); expect(h.result.current?.error).toBe(true); expect(h.result.current?.done).not.toBe(true); });
it("restores pending draft copy from its stored start", () => { sync.pending = true; expect(renderHook(() => useSaveProgress(false)).result.current?.value).toBeCloseTo(1 - Math.exp(-5 / 10 * 1.6)); });
it("starts a fresh track for sync after the previous save has dismissed", () => {
  const h = renderHook(({ saving }) => useSaveProgress(saving), { initialProps: { saving: true } });
  h.rerender({ saving: false }); act(() => vi.advanceTimersByTime(1750)); expect(h.result.current).toBeNull();
  sync.pending = true; sync.start = Date.now(); act(() => window.dispatchEvent(new Event("sync")));
  expect(h.result.current?.done).not.toBe(true); expect(h.result.current?.label).toContain("Adding your edits");
});