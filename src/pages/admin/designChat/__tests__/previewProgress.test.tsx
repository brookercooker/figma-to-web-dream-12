import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { elapsedLabel, previewExpectation, previewStage } from "../previewProgress";
import { usePreviewNotifications } from "../usePreviewNotifications";
import { usePreview } from "../usePreview";
import type { RelayState } from "../helper";
const toast = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast }));
vi.mock("../helper", () => ({ EMBED_FN: "/embed", SUPABASE_KEY: "" }));
vi.mock("../../siteManifest", () => ({ setManifestBase: vi.fn(), resetSiteManifestCache: vi.fn() }));
vi.mock("../../manifestPageSync", () => ({ syncManifestPages: vi.fn() }));
const state = (patch: Partial<RelayState> = {}): RelayState => ({ busy: false, job: null, previewVersion: 1, history: [], ...patch });
const job = (status: string, kind = "change") => ({ kind, status, startedAt: 1000 });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
describe("real preview stages", () => {
  it.each(["sending", "queued"])("maps %s to Request Sent", status => expect(previewStage(state({ busy: true, job: job(status) }), false, false)).toBe(1));
  it("maps working, checking and detected build to their real stages", () => {
    expect(previewStage(state({ busy: true, job: job("working") }), false, false)).toBe(2);
    expect(previewStage(state({ previewChecking: true }), false, false)).toBe(3);
    expect(previewStage(state(), true, true)).toBe(4);
  });
  it.each(["failed", "error", "cancelled"])("removes progress for %s jobs", status => expect(previewStage(state({ busy: true, job: job(status), previewChecking: true }), true, true)).toBeNull());
  it.each(["plan", "plan-only", "review"])("does not show preview progress for %s requests", kind => expect(previewStage(state({ busy: true, job: job("working", kind) }), true, true)).toBeNull());
  it("leaves reviewing and approval flows alone", () => {
    expect(previewStage(state({ publish: { open: 0, status: "reviewing" } }), true, true)).toBeNull();
    expect(previewStage(state({ job: job("approval") }), true, true)).toBeNull();
  });
  it("switches the honest estimate at exactly 90 seconds", () => {
    expect(previewExpectation(89_999)).toBe("Most updates take about a minute");
    expect(previewExpectation(90_000)).toBe("This is taking longer than expected, but it's still working and nothing is lost.");
    expect(elapsedLabel(90_000)).toBe("1:30");
  });
});
describe("completion notices", () => {
  beforeEach(() => { toast.mockClear(); document.title = "Nova Site Manager"; vi.spyOn(document, "hasFocus").mockReturnValue(true); vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"); });
  it("prefixes the title in another window, clears on return, and dedupes", () => {
    vi.mocked(document.hasFocus).mockReturnValue(false);
    const hook = renderHook(({ done }) => usePreviewNotifications(done, "/manage/preview", false), { initialProps: { done: 0 } });
    hook.rerender({ done: 10 });
    expect(document.title).toBe("Preview Updated · Nova Site Manager");
    hook.rerender({ done: 10 });
    expect(toast).not.toHaveBeenCalled();
    vi.mocked(document.hasFocus).mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(document.title).toBe("Nova Site Manager");
  });
  it("toasts once on management tabs, not Preview or Manual Edit Mode", () => {
    const hook = renderHook(({ done, path, manual }) => usePreviewNotifications(done, path, manual), { initialProps: { done: 0, path: "/manage/images", manual: false } });
    hook.rerender({ done: 10, path: "/manage/images", manual: false });
    expect(toast).toHaveBeenCalledExactlyOnceWith("Your Preview Is Updated");
    hook.rerender({ done: 10, path: "/manage/videos", manual: false });
    hook.rerender({ done: 20, path: "/manage/preview", manual: false });
    hook.rerender({ done: 30, path: "/manage/images", manual: true });
    expect(toast).toHaveBeenCalledTimes(1);
  });
});
describe("preview update lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(60_000);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ embed_url: "http://localhost:8080/home", expires_at: new Date(9999999).toISOString() }) })));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("survives reload mid-job and never moves backwards or silently expires", async () => {
    const hook = renderHook(({ relay }) => usePreview(relay), { initialProps: { relay: state({ busy: true, job: job("working") }) } });
    await act(async () => {});
    expect(hook.result.current.progressStage).toBe(2);
    expect(hook.result.current.elapsedMs).toBe(59_000);
    hook.rerender({ relay: state({ previewChecking: true, job: job("done") }) });
    expect(hook.result.current.progressStage).toBe(3);
    hook.rerender({ relay: state({ busy: true, job: job("working") }) });
    expect(hook.result.current.progressStage).toBe(3);
    await act(async () => { await vi.advanceTimersByTimeAsync(100_000); });
    expect(hook.result.current.progressStage).toBe(3);
    hook.rerender({ relay: state({ job: job("failed") }) });
    expect(hook.result.current.progressStage).toBeNull();
  });
  it("only acknowledges completion after a detected build frame loads, never after swap timeout", async () => {
    const hook = renderHook(({ relay }) => usePreview(relay), { initialProps: { relay: state({ busy: true, job: job("working"), previewBuiltAt: 100 }) } });
    await act(async () => {});
    act(() => hook.result.current.finish(1));
    hook.rerender({ relay: state({ job: job("done"), previewBuiltAt: 200 }) });
    await act(async () => {});
    expect(hook.result.current.progressStage).toBe(4);
    act(() => hook.result.current.finish(2, false));
    expect(hook.result.current.completedAt).toBe(0);
    act(() => hook.result.current.finish(2));
    expect(hook.result.current.completedAt).toBe(60_000);
    expect(hook.result.current.progressStage).toBeNull();
  });
});
