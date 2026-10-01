import { describe, it, expect, vi, beforeEach } from "vitest";
import { lazyRetry } from "../lazyRetry";

// React.lazy keeps the factory on _payload._result before first load.
const factoryOf = (c: unknown) => (c as { _payload: { _result: () => Promise<unknown> } })._payload._result;
const Comp = () => null;

describe("lazyRetry", () => {
  beforeEach(() => sessionStorage.clear());
  it("resolves on first success", async () => {
    const f = vi.fn().mockResolvedValue({ default: Comp });
    expect(await factoryOf(lazyRetry(f))()).toEqual({ default: Comp });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("retries once after a failure", async () => {
    const f = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue({ default: Comp });
    expect(await factoryOf(lazyRetry(f))()).toEqual({ default: Comp });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("throws instead of reloading again within 10 seconds", async () => {
    sessionStorage.setItem("chunk:reloaded-at", String(Date.now()));
    const err = new Error("stale chunk");
    const f = vi.fn().mockRejectedValue(err);
    await expect(factoryOf(lazyRetry(f))()).rejects.toBe(err);
  });
  it("records a reload when both attempts fail", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload } });
    const f = vi.fn().mockRejectedValue(new Error("x"));
    void factoryOf(lazyRetry(f))();
    await new Promise((r) => setTimeout(r, 0));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(Number(sessionStorage.getItem("chunk:reloaded-at"))).toBeGreaterThan(0);
  });
});
