import { act, cleanup, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DesignChatProvider, useDesignChat, NAV_FALLBACK_MS } from "../DesignChatContext";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({ preview: vi.fn(), navigate: vi.fn(() => false) }));
vi.mock("../usePreview", () => ({ usePreview: mocks.preview }));
vi.mock("../useHelperState", () => ({ useHelperState: () => ({ state: { busy: true, job: { status: "working", startedAt: 1000 }, history: [] }, offline: false, refreshSoon: vi.fn() }) }));
vi.mock("../useWaitProgress", () => ({ useWaitProgress: () => null }));
vi.mock("../usePreviewNotifications", () => ({ usePreviewNotifications: vi.fn() }));
vi.mock("../usePreviewPage", () => ({ usePreviewPage: () => ({ page: null, loading: false, registrable: null }) }));
vi.mock("../useDrawing", () => ({ useDrawing: () => ({}) }));
vi.mock("../useChatReferences", () => ({ useChatReferences: () => ({}) }));
vi.mock("../useChatDraft", () => ({ useChatDraft: () => ({}) }));
vi.mock("../contentSync", () => ({ observeContentSyncState: vi.fn() }));
vi.mock("../../manifestPageSync", () => ({ syncManifestPages: vi.fn() }));
vi.mock("../ManifestReceiverFrame", () => ({ default: () => null }));
vi.mock("../previewNavigate", () => ({ notePreviewReady: () => false, postPreviewNavigate: mocks.navigate }));

const key = "nova:design-chat:working-page";
const draft = { id: "draft-id", name: "Draft", path: "/draft" };
const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter><DesignChatProvider>{children}</DesignChatProvider></MemoryRouter>;
beforeEach(() => {
  sessionStorage.clear();
  mocks.preview.mockReset();
  mocks.preview.mockReturnValue({ completedAt: 0, lastReloadAt: { current: 0 }, rememberPath: vi.fn() });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); sessionStorage.clear(); });

describe("preview Back confirmation", () => {
  it.each([
    ["/home/", "", "/", ""],
    ["/about/", "?b=2&a=1", "/about", "?a=1&b=2"],
  ])("resolves equivalent %s in place with no delayed reload", (path, search, arrival, arrivalSearch) => {
    vi.useFakeTimers(); mocks.navigate.mockReturnValue(true);
    const frame = document.createElement("iframe");
    frame.src = "https://site.example/"; frame.dataset.sitePreview = "true";
    document.body.appendChild(frame);
    const win = frame.contentWindow;
    const report = (path: string, search = "") => act(() => {
      window.dispatchEvent(new MessageEvent("message", { source: win, origin: "https://site.example", data: { source: "nova-site", type: "location", path, search } }));
    });
    try {
      const hook = renderHook(useDesignChat, { wrapper });
      report(path, search); report("/team");
      act(() => hook.result.current.previewNav?.back());
      expect(mocks.navigate).toHaveBeenLastCalledWith({ action: "back" });
      report(arrival, arrivalSearch);
      act(() => vi.advanceTimersByTime(NAV_FALLBACK_MS + 100));
      expect(mocks.preview.mock.calls.at(-1)?.slice(1)).toEqual([null, 0]);
      expect(hook.result.current.previewNav?.canForward).toBe(true);
      expect(frame.src).toBe("https://site.example/");
      hook.unmount();
    } finally { frame.remove(); mocks.navigate.mockReturnValue(false); vi.useRealTimers(); }
  });
  it("retains one three-second fallback when the frame never confirms", () => {
    vi.useFakeTimers(); mocks.navigate.mockReturnValue(true);
    const frame = document.createElement("iframe"); frame.src = "https://site.example/"; frame.dataset.sitePreview = "true"; document.body.appendChild(frame);
    try {
      const hook = renderHook(useDesignChat, { wrapper });
      for (const path of ["/", "/team"]) act(() => window.dispatchEvent(new MessageEvent("message", { source: frame.contentWindow, origin: "https://site.example", data: { source: "nova-site", type: "location", path } })));
      act(() => hook.result.current.previewNav?.back());
      act(() => vi.advanceTimersByTime(NAV_FALLBACK_MS - 1));
      expect(mocks.preview.mock.calls.at(-1)?.slice(1)).toEqual([null, 0]);
      act(() => vi.advanceTimersByTime(1));
      expect(mocks.preview.mock.calls.at(-1)?.slice(1)).toEqual(["/", 1]);
      act(() => vi.advanceTimersByTime(NAV_FALLBACK_MS));
      expect(mocks.preview.mock.calls.at(-1)?.slice(1)).toEqual(["/", 1]);
      hook.unmount();
    } finally { frame.remove(); mocks.navigate.mockReturnValue(false); vi.useRealTimers(); }
  });
});

describe("picked page reload", () => {
  it("restores the Draft chip and preview path during a running request, then lets a new pick win", () => {
    const first = renderHook(useDesignChat, { wrapper });
    act(() => first.result.current.selectPage(draft));
    act(() => first.result.current.startEditing());
    expect(JSON.parse(sessionStorage.getItem(key) ?? "null")).toEqual(draft);
    first.unmount();
    const reloaded = renderHook(useDesignChat, { wrapper });
    expect(reloaded.result.current.workingPage).toEqual(draft);
    expect(reloaded.result.current.editing).toBe(false);
    expect(mocks.preview.mock.calls.at(-1)?.[1]).toBe("/draft");
    const about = { id: "about-id", name: "About", path: "/about" };
    act(() => reloaded.result.current.selectPage(about));
    expect(reloaded.result.current.workingPage).toEqual(about);
    expect(mocks.preview.mock.calls.at(-1)?.[1]).toBe("/about");
    reloaded.unmount();
    const again = renderHook(useDesignChat, { wrapper });
    expect(again.result.current.workingPage).toEqual(about);
    expect(mocks.preview.mock.calls.at(-1)?.[1]).toBe("/about");
  });
  it("retains the page when leaving editing but clears the chip deliberately across reloads", () => {
    const hook = renderHook(useDesignChat, { wrapper });
    act(() => hook.result.current.selectPage(draft));
    act(() => hook.result.current.startEditing());
    act(() => hook.result.current.stopEditing());
    expect(JSON.parse(sessionStorage.getItem(key) ?? "null")).toEqual(draft);
    act(() => hook.result.current.clearWorkingPage());
    expect(sessionStorage.getItem(key)).toBeNull();
    hook.unmount();
    const again = renderHook(useDesignChat, { wrapper });
    expect(again.result.current.workingPage).toBeNull();
  });
  it.each(["broken JSON", JSON.stringify({ name: "Bad", path: "//elsewhere" }), JSON.stringify({ name: "Manager", path: "/manage/preview" })])("ignores invalid stored page %s", value => {
    sessionStorage.setItem(key, value);
    const hook = renderHook(useDesignChat, { wrapper });
    expect(hook.result.current.workingPage).toBeNull();
    expect(mocks.preview.mock.calls.at(-1)?.[1]).toBeNull();
  });
  it("still selects and clears pages when tab storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("Blocked"); });
    const hook = renderHook(useDesignChat, { wrapper });
    act(() => hook.result.current.selectPage(draft));
    expect(hook.result.current.workingPage).toEqual(draft);
    expect(mocks.preview.mock.calls.at(-1)?.[1]).toBe("/draft");
    act(() => hook.result.current.clearWorkingPage());
    expect(hook.result.current.workingPage).toBeNull();
  });
});