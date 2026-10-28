import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EDITOR_DECISION_TIMEOUT_MS, usePageEditorSurface } from "../usePageEditorSurface";

const mocks = vi.hoisted(() => ({ load: vi.fn(), release: vi.fn() }));
vi.mock("../siteManifest", () => ({
  loadSiteManifest: () => mocks.load(),
  codePagePaths: (manifest: { pages: { path: string }[] }) => new Set(manifest.pages.map(page => page.path)),
  retainEditingManifestPaths: () => mocks.release,
}));
afterEach(() => { cleanup(); vi.useRealTimers(); mocks.load.mockReset(); mocks.release.mockReset(); });

describe("page editor decision lifetime", () => {
  it("ends one stalled attempt at the bound and ignores a late non-manifest result", async () => {
    vi.useFakeTimers();
    let deliver: ((value: { pages: never[] }) => void) | undefined;
    mocks.load.mockImplementation(() => new Promise(resolve => { deliver = resolve; }));
    const editor = renderHook(() => usePageEditorSurface({ id: "experiment", path: "/draft/experiment" }));
    expect(editor.result.current).toBe("loading");
    act(() => { vi.advanceTimersByTime(EDITOR_DECISION_TIMEOUT_MS - 1); });
    expect(editor.result.current).toBe("loading");
    act(() => { vi.advanceTimersByTime(1); });
    expect(editor.result.current).toBe("framed");
    await act(async () => { deliver?.({ pages: [] }); });
    expect(editor.result.current).toBe("framed");
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });
  it("does not apply a previous page's delayed decision to the newly opened page", async () => {
    let old: ((value: { pages: { path: string }[] }) => void) | undefined;
    mocks.load.mockImplementationOnce(() => new Promise(resolve => { old = resolve; })).mockResolvedValue({ pages: [] });
    const editor = renderHook(({ id, path }) => usePageEditorSurface({ id, path }), { initialProps: { id: "old", path: "/team" } });
    editor.rerender({ id: "new", path: "/flicker-test" });
    await act(async () => {});
    expect(editor.result.current).toBe("local");
    await act(async () => { old?.({ pages: [{ path: "/team" }] }); });
    expect(editor.result.current).toBe("local");
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });
});