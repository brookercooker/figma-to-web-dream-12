import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EDITOR_DECISION_TIMEOUT_MS, usePageEditorSurface } from "../usePageEditorSurface";

const mocks = vi.hoisted(() => ({ base: null as string | null }));
vi.mock("../siteManifest", () => ({ draftEmbedUrl: () => mocks.base }));
afterEach(() => { cleanup(); vi.useRealTimers(); mocks.base = null; });

describe("page editor opening", () => {
  it("opens the frame at once when the draft address is known", () => {
    mocks.base = "https://draft.example/";
    const editor = renderHook(() => usePageEditorSurface({ id: "experiment", path: "/draft/experiment" }));
    expect(editor.result.current).toBe("framed");
  });
  it("waits for the address, then opens the frame and stays latched", () => {
    vi.useFakeTimers();
    const editor = renderHook(() => usePageEditorSurface({ id: "experiment", path: "/draft/experiment" }));
    expect(editor.result.current).toBe("loading");
    mocks.base = "https://draft.example/";
    act(() => { vi.advanceTimersByTime(250); });
    expect(editor.result.current).toBe("framed");
    mocks.base = null;
    act(() => { vi.advanceTimersByTime(EDITOR_DECISION_TIMEOUT_MS); });
    expect(editor.result.current).toBe("framed");
  });
  it("opens the frame (with its Retry) at the bound when no address arrives", () => {
    vi.useFakeTimers();
    const editor = renderHook(() => usePageEditorSurface({ id: "new", path: "/brand-new" }));
    act(() => { vi.advanceTimersByTime(EDITOR_DECISION_TIMEOUT_MS - 300); });
    expect(editor.result.current).toBe("loading");
    act(() => { vi.advanceTimersByTime(400); });
    expect(editor.result.current).toBe("framed");
  });
  it("a newly opened page starts its own opening", () => {
    vi.useFakeTimers();
    mocks.base = "https://draft.example/";
    const editor = renderHook(({ id }) => usePageEditorSurface({ id, path: "/" + id }), { initialProps: { id: "old" } });
    mocks.base = null;
    editor.rerender({ id: "new" });
    expect(editor.result.current).toBe("loading");
  });
});
