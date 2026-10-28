import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({
  hasChanges: null as null | (() => boolean),
  add: null as null | ((kind: "objects" | "images" | "videos") => void),
  writes: vi.fn(),
  slot: {
    slot: null,
    registerSave: vi.fn(),
    saveAll: vi.fn(),
    registerDiscard: vi.fn(),
    registerHasChanges: (callback: null | (() => boolean)) => { mocks.hasChanges = callback; },
    registerAdd: (callback: null | ((kind: "objects" | "images" | "videos") => void)) => { mocks.add = callback; },
  },
}));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => mocks.slot }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: {
  from: (table: string) => {
    const data = table === "pages" ? [{ id: "page", name: "Test page", path: "/test-page", content: [
      { id: "first", type: "text", text: "First", size: "md", align: "left" },
      { id: "second", type: "text", text: "Second", size: "md", align: "left" },
    ] }] : [];
    const query = {
      select: () => query, is: () => query, order: () => Promise.resolve({ data }),
      update: mocks.writes,
      then: (resolve: (result: { data: unknown[] }) => unknown) => Promise.resolve({ data }).then(resolve),
    };
    return query;
  },
} }));
vi.mock("../siteManifest", async (original) => ({ ...await original<typeof import("../siteManifest")>(), loadSiteManifest: () => Promise.resolve({ pages: [] }), draftEmbedUrl: () => "https://draft.example/" }));
vi.mock("../FramedPageEditor", () => ({ default: () => <div data-testid="public-frame" /> }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("../CreatePageDialog", () => ({ default: () => null }));
vi.mock("../ObjectPickerDialog", () => ({ default: () => null }));
vi.mock("../TagsPanel", () => ({ default: () => null }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
vi.mock("../InlineStylePanel", () => ({ default: () => null }));
vi.mock("../ImagePickerDialog", () => ({ default: ({ open, onOpenChange, onPick }: any) => open ? (
  <div role="dialog" aria-label="Pick image">
    <button onClick={() => onOpenChange(false)}>Cancel image</button>
    <button onClick={() => onPick({ url: "/chosen.jpg", alt: "Chosen image" })}>Pick image</button>
  </div>
) : null }));
vi.mock("../VideoPickerDialog", () => ({ default: ({ open, onOpenChange, onPick }: any) => open ? (
  <div role="dialog" aria-label="Pick video">
    <button onClick={() => onOpenChange(false)}>Cancel video</button>
    <button onClick={() => onPick({ url: "/chosen.mp4", poster: "/poster.jpg" })}>Pick video</button>
  </div>
) : null }));

beforeEach(() => {
  cleanup();
  mocks.hasChanges = null;
  mocks.writes.mockClear();
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

async function openEditor(embedded = true) {
  window.history.replaceState(null, "", "/manage/design?page=page&mode=edit");
  const result = render(<MemoryRouter initialEntries={["/manage/design?page=page&mode=edit"]}>
    <DesignTab embedded={embedded} pageId="page" />
  </MemoryRouter>);
  await waitFor(() => expect(result.container.querySelectorAll("[data-page-block]")).toHaveLength(2));
  return result;
}

describe("page editor quick add", () => {
  it("has no Add to This Page row when embedded; the top bar adds through registerAdd", async () => {
    await openEditor();
    expect(screen.queryByRole("toolbar", { name: "Add to This Page" })).toBeNull();
    expect(screen.queryByText("Add to this page:")).toBeNull();
    expect(mocks.add).toBeTypeOf("function");
  });
  it("does not register a top-bar add handler in the standalone editor", async () => {
    mocks.add = null;
    await openEditor(false);
    expect(mocks.add).toBeNull();
  });
  it.each(["Image", "Video"])("keeps blocks and dirty tracking unchanged when cancelling %s", async (kind) => {
    const { container } = await openEditor();
    const ids = () => [...container.querySelectorAll<HTMLElement>("[data-page-block]")].map((el) => el.dataset.pageBlock);
    const before = ids();
    act(() => mocks.add?.(kind === "Image" ? "images" : "videos"));
    expect(ids()).toEqual(before);
    expect(mocks.hasChanges?.()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: `Cancel ${kind.toLowerCase()}` }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(ids()).toEqual(before);
    expect(mocks.hasChanges?.()).toBe(false);
    expect(mocks.writes).not.toHaveBeenCalled();
  });
  it.each(["Image", "Video"])("adds a completed %s after the selection and scrolls to it", async (kind) => {
    const { container } = await openEditor();
    const first = container.querySelector<HTMLElement>('[data-page-block="first"]');
    if (!first) throw new Error("Missing initial block");
    fireEvent.click(first);
    act(() => mocks.add?.(kind === "Image" ? "images" : "videos"));
    fireEvent.click(screen.getByRole("button", { name: `Pick ${kind.toLowerCase()}` }));
    const blocks = container.querySelectorAll<HTMLElement>("[data-page-block]");
    expect(blocks).toHaveLength(3);
    expect(blocks[0].dataset.pageBlock).toBe("first");
    expect(blocks[1].dataset.pageBlock).toBe("second");
    expect(blocks[2].querySelector(kind === "Image" ? 'img[src="/chosen.jpg"][alt="Chosen image"]' : 'video[src="/chosen.mp4"][poster="/poster.jpg"]')).not.toBeNull();
    expect(mocks.hasChanges?.()).toBe(true);
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
    // Discard before unmount: this test never writes its example media to a page.
    const discard = mocks.slot.registerDiscard.mock.calls.at(-1)?.[0];
    if (discard) await act(async () => { await discard(); });
  });
});