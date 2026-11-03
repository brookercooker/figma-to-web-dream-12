import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useRequestRetry } from "../useRequestRetry";
import type { RelayState } from "../helper";
const post = vi.hoisted(() => vi.fn());
vi.mock("../helper", () => ({ RELAY: "test", postToHelper: post }));
const initial: RelayState = { busy: false, job: null, history: [], previewVersion: 1 };
const payload = { message: "Change the lamp\n\nReferences from the library:\n- Object Lamp", page: { id: "brands", name: "Brands", path: "/brands" }, uploadIds: ["upload-1"], marks: { marks: [{ x: 5, y: 10 }] }, image: "data:image/jpeg;base64,picture" };
const failed: RelayState = { ...initial, job: { id: "failed", kind: "change", status: "failed", startedAt: 1100 }, history: [{ role: "user", text: payload.message, ts: 1100 }, { role: "error", text: "Failure", ts: 1500 }] };
beforeEach(() => { sessionStorage.clear(); post.mockReset().mockResolvedValue({ ok: true }); vi.useFakeTimers(); vi.setSystemTime(1000); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
it("retries the exact text, chip, references, uploads and drawing once and starts a fresh wait", async () => {
  const h = renderHook(({ state }) => useRequestRetry(state, false, vi.fn()), { initialProps: { state: initial } });
  await act(async () => { await h.result.current.sendPrepared(payload); });
  h.rerender({ state: failed }); vi.setSystemTime(2000);
  const clear = vi.fn();
  await act(async () => { await Promise.all([h.result.current.retry(1100, clear), h.result.current.retry(1100, clear)]); });
  expect(post).toHaveBeenCalledTimes(2); expect(post.mock.calls[1]).toEqual(["/send", payload]); expect(clear).toHaveBeenCalledOnce();
  expect(h.result.current.optimisticState?.job).toMatchObject({ status: "queued", startedAt: 2000 });
  await act(async () => { await h.result.current.retry(1100, clear); });
  expect(post).toHaveBeenCalledTimes(2);
});
it("keeps history recovery and the exact snapshot after reload and disables retry while busy", async () => {
  const one = renderHook(() => useRequestRetry(initial, false, vi.fn()));
  await act(async () => { await one.result.current.sendPrepared(payload); }); one.unmount();
  const two = renderHook(({ state }) => useRequestRetry(state, false, vi.fn()), { initialProps: { state: { ...failed, busy: true } } });
  expect(two.result.current.canRetry(1500)).toBe(true); expect(two.result.current.disabled).toBe(true);
  await act(async () => { await two.result.current.retry(1500, vi.fn()); }); expect(post).toHaveBeenCalledTimes(1);
  two.rerender({ state: { ...failed, busy: false } }); vi.setSystemTime(2000);
  await act(async () => { await two.result.current.retry(1500, vi.fn()); }); expect(post.mock.calls[1][1]).toEqual(payload);
});
it("never reconstructs an unavailable original payload or adds duplicate history entries", () => {
  const h = renderHook(() => useRequestRetry(failed, false, vi.fn()));
  expect(h.result.current.canRetry(1500)).toBe(false); expect(h.result.current.retryNote(1500)).toContain("Reattach any files or drawings");
  expect(h.result.current.localErrors).toHaveLength(0); expect(failed.history).toHaveLength(2);
});
it("does not resend a Chat request for a Submit for Review failure", async () => {
  const h = renderHook(({ state }) => useRequestRetry(state, false, vi.fn()), { initialProps: { state: initial } });
  await act(async () => { await h.result.current.sendPrepared(payload); });
  h.rerender({ state: { ...failed, job: { kind: "review", status: "failed", startedAt: 1300 } } });
  expect(h.result.current.canRetry(1500)).toBe(false);
  await act(async () => { await h.result.current.retry(1500, vi.fn()); });
  expect(post).toHaveBeenCalledTimes(1);
});
it("retains status-only failures as one recoverable local history entry across reloads", async () => {
  const h = renderHook(({ state }) => useRequestRetry(state, false, vi.fn()), { initialProps: { state: initial } });
  await act(async () => { await h.result.current.sendPrepared(payload); });
  const s = { ...failed, history: failed.history.slice(0, 1) };
  h.rerender({ state: s }); expect(h.result.current.localErrors).toHaveLength(1); h.unmount();
  const reloaded = renderHook(() => useRequestRetry({ ...s, job: null }, false, vi.fn()));
  expect(reloaded.result.current.localErrors).toHaveLength(1); expect(reloaded.result.current.canRetry(1100)).toBe(true);
});