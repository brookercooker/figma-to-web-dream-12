import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";
import { MANIFEST_CHANGED, resetSiteManifestCache, setManifestBase } from "../siteManifest";
import { EDITOR_DECISION_TIMEOUT_MS } from "../usePageEditorSurface";

const mocks = vi.hoisted(() => ({
  status: "missing" as "found" | "missing" | "unreachable",
  reloadKeys: [] as number[],
  content: null as unknown,
  path: "/brand-new",
  writes: vi.fn(),
  save: null as null | (() => Promise<boolean>),
  discard: null as null | (() => void),
  hasChanges: null as null | (() => boolean),
  manifest: vi.fn<() => Promise<{ pages: { path: string }[] }>>(),
  frameRenders: vi.fn(),
}));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({
  slot: null, saveAll: vi.fn(),
  registerSave: (cb: any) => { mocks.save = cb; },
  registerDiscard: (cb: any) => { mocks.discard = cb; },
  registerHasChanges: (cb: any) => { mocks.hasChanges = cb; },
}) }));
vi.mock("../designChat/LivePreviewPage", async () => {
  const { useEffect } = await import("react");
  return { default: ({ onStatus, reloadKey = 0 }: any) => {
    useEffect(() => { mocks.reloadKeys.push(reloadKey); onStatus?.(mocks.status); }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
    return mocks.status === "found" ? <h1>Live coded page</h1> : null;
  } };
});
vi.mock("@/components/InlineEditSurface", () => ({ default: ({ children }: any) => <div data-testid="in-place">{children}</div>, readStyle: vi.fn(), styleKey: vi.fn() }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: {
  from: (table: string) => {
    const data = table === "pages" ? [{ id: "page", name: "Brand New", path: mocks.path, content: mocks.content, inline_edits: {} }] : [];
    const query: any = {
      select: () => query, is: () => query, eq: () => query, in: () => query, order: () => Promise.resolve({ data }),
      update: (v: unknown) => { mocks.writes(v); return { eq: () => Promise.resolve({ error: null }) }; },
      then: (resolve: (result: { data: unknown[] }) => unknown) => Promise.resolve({ data }).then(resolve),
    };
    return query;
  },
} }));
vi.mock("../siteManifest", async (original) => ({ ...await original<typeof import("../siteManifest")>(), loadSiteManifest: () => mocks.manifest() }));
vi.mock("../FramedPageEditor", () => ({ default: ({ base }: { base: string | null }) => { mocks.frameRenders(); return <div data-testid="public-frame">{base ? null : <button>Retry</button>}</div>; } }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("../CreatePageDialog", () => ({ default: () => null }));
vi.mock("../ObjectPickerDialog", () => ({ default: () => null }));
vi.mock("../TagsPanel", () => ({ default: () => null }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
vi.mock("../InlineStylePanel", () => ({ default: () => null }));
vi.mock("../ImagePickerDialog", () => ({ default: () => null }));
vi.mock("../VideoPickerDialog", () => ({ default: () => null }));

beforeEach(() => {
  cleanup();
  mocks.status = "missing"; mocks.content = null; mocks.path = "/brand-new"; mocks.reloadKeys = [];
  mocks.writes.mockClear();
  mocks.manifest.mockReset().mockResolvedValue({ pages: [] });
  mocks.frameRenders.mockClear();
  setManifestBase("https://draft.example/");
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

const open = () => render(<MemoryRouter initialEntries={["/manage/design?page=page"]}><DesignTab embedded pageId="page" /></MemoryRouter>);
const contentWrites = () => mocks.writes.mock.calls.filter(([v]) => v && "content" in v);
const noLocalSurface = () => {
  expect(screen.queryByLabelText("Page Text")).toBeNull();
  expect(screen.queryByTestId("in-place")).toBeNull();
  expect(screen.queryByText(/changes the header on every page/)).toBeNull();
};

describe("one surface for every page", () => {
  it.each(["/draft/experiment", "/flicker-test", "/team"])("%s opens in the public frame; late manifest, MANIFEST_CHANGED and cache reset change nothing", async (path) => {
    mocks.path = path;
    let deliver: ((manifest: { pages: { path: string }[] }) => void) | undefined;
    mocks.manifest.mockImplementation(() => new Promise(resolve => { deliver = resolve; }));
    const view = open();
    const frame = await screen.findByTestId("public-frame");
    noLocalSurface();
    const renders = mocks.frameRenders.mock.calls.length;
    await act(async () => {
      deliver?.({ pages: [] });
      window.dispatchEvent(new Event(MANIFEST_CHANGED));
      resetSiteManifestCache();
      window.dispatchEvent(new Event(MANIFEST_CHANGED));
    });
    view.rerender(<MemoryRouter><DesignTab embedded pageId="page" /></MemoryRouter>);
    expect(screen.getByTestId("public-frame")).toBe(frame);
    noLocalSurface();
    expect(mocks.frameRenders.mock.calls.length).toBeGreaterThanOrEqual(renders);
  });
  it("an unreachable frame shows Retry and no starter", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    try {
      setManifestBase("");
      open();
      await screen.findByText("Loading the page editor…");
      await act(async () => { await vi.advanceTimersByTimeAsync(EDITOR_DECISION_TIMEOUT_MS + 300); });
      expect(screen.getByTestId("public-frame")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
      noLocalSurface();
      expect(screen.queryByRole("heading", { name: "Brand New" })).toBeNull();
    } finally { vi.useRealTimers(); }
  });
  it("a brand-new page opens with 0 sections and no saved changes", async () => {
    const { container } = open();
    await screen.findByTestId("public-frame");
    expect(container.querySelectorAll("[data-page-block]")).toHaveLength(0);
    noLocalSurface();
    expect(screen.queryByText(/Content coming soon/)).toBeNull();
    expect(mocks.hasChanges?.()).toBe(false);
  });
  it("Discard Changes writes nothing", async () => {
    const r = open();
    await screen.findByTestId("public-frame");
    await act(async () => { await mocks.discard?.(); });
    expect(mocks.hasChanges?.()).toBe(false);
    r.unmount();
    expect(contentWrites()).toHaveLength(0);
  });
  it("Finish Editing with no changes writes nothing", async () => {
    open();
    await screen.findByTestId("public-frame");
    await act(async () => { expect(await mocks.save?.()).toBe(true); });
    expect(contentWrites()).toHaveLength(0);
  });
  it("a page with database blocks shows them as full-width held sections beneath the frame", async () => {
    mocks.content = [{ id: "a", type: "text", text: "Saved words", size: "md", align: "left" }];
    const { container } = open();
    await waitFor(() => expect(container.querySelectorAll("[data-page-block]")).toHaveLength(1));
    expect(screen.getByText("Saved words")).toBeInTheDocument();
    const held = container.querySelector("[data-held-sections]")!;
    expect(held.className).not.toMatch(/max-w|mx-auto|px-/);
    expect(held.parentElement!.className).not.toMatch(/max-w|mx-auto|px-/);
    expect(mocks.writes).not.toHaveBeenCalled();
  });
});
