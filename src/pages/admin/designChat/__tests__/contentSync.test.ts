import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RelayState } from "../helper";
const post = vi.hoisted(() => vi.fn());
vi.mock("../helper", () => ({ postToHelper: post, RELAY: "test-relay" }));
const state = (busy = false, status = "idle") => ({ busy, publish: { open: 4, status } }) as RelayState;
beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); localStorage.clear(); post.mockReset(); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
describe("durable content sync", () => {
  it("remembers busy sync and retries only from idle status after 20 seconds", async () => {
    const sync = await import("../contentSync");
    post.mockResolvedValueOnce({ ok: false, data: { busy: true } }).mockResolvedValue({ ok: true });
    sync.notifyContentEdited(); await vi.advanceTimersByTimeAsync(4000);
    expect(sync.contentSyncDeferred()).toBe(true);
    sync.observeContentSyncState(state(false, "reviewing")); await vi.advanceTimersByTimeAsync(20_000);
    expect(post).toHaveBeenCalledTimes(1);
    sync.observeContentSyncState(state()); await vi.advanceTimersByTimeAsync(0);
    expect(post).toHaveBeenCalledTimes(2); expect(sync.contentSyncDeferred()).toBe(false);
    expect(localStorage.length).toBe(0);
  });
  it("restores owed sync on the next load and clears it when accepted", async () => {
    localStorage.setItem("nova:content-sync-owed:test-relay", JSON.stringify({ version: 1, deferred: true }));
    post.mockResolvedValue({ ok: true });
    const sync = await import("../contentSync");
    sync.observeContentSyncState(state(true)); expect(post).not.toHaveBeenCalled();
    sync.observeContentSyncState(state()); await vi.advanceTimersByTimeAsync(0);
    expect(post).toHaveBeenCalledOnce(); expect(sync.contentSyncDeferred()).toBe(false);
  });
  it("bounds retries to 30 minutes but retains the owed sync", async () => {
    post.mockResolvedValue({ ok: false, data: { busy: true } });
    const sync = await import("../contentSync"); sync.notifyContentEdited();
    await vi.advanceTimersByTimeAsync(4000);
    await vi.advanceTimersByTimeAsync(30 * 60_000);
    sync.observeContentSyncState(state()); expect(post).toHaveBeenCalledTimes(1);
    expect(sync.contentSyncDeferred()).toBe(true); expect(localStorage.length).toBe(1);
  });
  it("coalesces saves and preserves a save arriving during a sync", async () => {
    let accept: ((value: unknown) => void) | undefined;
    post.mockImplementationOnce(() => new Promise(resolve => { accept = resolve; })).mockResolvedValue({ ok: true });
    const sync = await import("../contentSync");
    sync.notifyContentEdited(); sync.notifyContentEdited(); await vi.advanceTimersByTimeAsync(4000);
    expect(post).toHaveBeenCalledOnce(); sync.notifyContentEdited(); accept?.({ ok: true });
    await vi.advanceTimersByTimeAsync(4000);
    expect(post).toHaveBeenCalledTimes(2); expect(localStorage.length).toBe(0);
  });
});