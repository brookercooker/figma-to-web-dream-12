import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({
  status: "missing" as "found" | "missing" | "unreachable",
  reloadKeys: [] as number[],
  content: null as unknown,
  path: "/brand-new",
  writes: vi.fn(),
  save: null as null | (() => Promise<boolean>),
  discard: null as null | (() => void),
  hasChanges: null as null | (() => boolean),
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
vi.mock("../codedPages", () => ({ codedPages: {}, pageChunks: vi.fn(), chunkName: vi.fn() }));
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
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

const open = () => render(<MemoryRouter initialEntries={["/manage/design?page=page"]}><DesignTab embedded pageId="page" /></MemoryRouter>);
const contentWrites = () => mocks.writes.mock.calls.filter(([v]) => v && "content" in v);

describe("Edit Manually on a page without code", () => {
  it("opens the block editor with the page name and an empty text block ready to type", async () => {
    const { container } = open();
    await waitFor(() => expect(container.querySelectorAll("[data-page-block]")).toHaveLength(2));
    expect(screen.getByText("Brand New")).toBeInTheDocument();
    const box = screen.getByRole("textbox");
    expect(box).toHaveValue("");
    expect(box).toHaveFocus();
    expect(screen.queryByText(/Content coming soon/)).toBeNull();
    expect(mocks.hasChanges?.()).toBe(true);
  });
  it("Discard Changes writes nothing", async () => {
    const r = open();
    await waitFor(() => expect(r.container.querySelectorAll("[data-page-block]")).toHaveLength(2));
    act(() => mocks.discard?.());
    expect(mocks.hasChanges?.()).toBe(false);
    r.unmount();
    expect(contentWrites()).toHaveLength(0);
  });
  it("Finish Editing saves the starter blocks", async () => {
    const r = open();
    await waitFor(() => expect(r.container.querySelectorAll("[data-page-block]")).toHaveLength(2));
    await act(async () => { expect(await mocks.save?.()).toBe(true); });
    const [[saved]] = contentWrites() as any;
    expect(saved.content.map((b: any) => [b.type, b.text])).toEqual([["heading", "Brand New"], ["text", ""]]);
  });
});

describe("when the page's code can't be loaded", () => {
  it("shows Retry, writes nothing, and Retry loads again", async () => {
    mocks.status = "unreachable";
    open();
    expect(await screen.findByText("Couldn't load this page's design")).toBeInTheDocument();
    expect(mocks.writes).not.toHaveBeenCalled();
    expect(mocks.hasChanges?.()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(mocks.reloadKeys).toContain(1));
    expect(mocks.writes).not.toHaveBeenCalled();
  });
});

describe("unchanged pages", () => {
  it("a page with code still opens in place", async () => {
    mocks.status = "found";
    open();
    expect(await screen.findByRole("heading", { name: "Live coded page" })).toBeInTheDocument();
    expect(screen.getAllByTestId("in-place")).toHaveLength(2);
    expect(screen.getByRole("note")).toHaveTextContent("This edit changes the header on every page");
    expect(mocks.hasChanges?.()).toBe(false);
  });
  it("a page with database blocks opens its blocks", async () => {
    mocks.content = [{ id: "a", type: "text", text: "Saved words", size: "md", align: "left" }];
    const { container } = open();
    await waitFor(() => expect(container.querySelectorAll("[data-page-block]")).toHaveLength(1));
    expect(screen.getByText("Saved words")).toBeInTheDocument();
    expect(mocks.writes).not.toHaveBeenCalled();
  });
});
