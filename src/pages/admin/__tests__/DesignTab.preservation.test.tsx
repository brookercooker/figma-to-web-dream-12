import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({ remote: false, save: null as any, discard: null as any, writes: vi.fn(), original: { content: null as unknown, inline_edits: {} } }));
vi.mock("../siteManifest", async (importOriginal) => ({ ...await importOriginal<typeof import("../siteManifest")>(), loadSiteManifest: () => Promise.reject(new Error("fixture")), manifestHasPage: () => mocks.remote, draftEmbedUrl: () => "https://public.example.com/?embed=fixture" }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({ slot: null, saveAll: vi.fn(), registerSave: (cb: any) => mocks.save = cb, registerDiscard: (cb: any) => mocks.discard = cb, registerHasChanges: vi.fn() }) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("../codedPages", () => ({ codedPages: { "/contact": () => <div><section><h1>Original Contact</h1><form><input aria-label="Original Form" /></form></section><section><p>Original Details</p></section></div> },
  pageChunks: (root: HTMLElement) => [...root.querySelectorAll("section")], chunkName: (el: HTMLElement) => el.textContent }));
vi.mock("../importCodedObject", () => ({ sectionsFromDom: () => [] }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "pages" ? [{ id: "contact", path: mocks.remote ? "/draft" : "/contact", name: "Contact", updated_at: "original-date", ...mocks.original }] : [];
  const q: any = { select: () => q, is: () => q, order: () => Promise.resolve({ data }), update: (patch: any) => { mocks.writes(table, patch); return { eq: () => Promise.resolve({ error: null }) }; }, then: (cb: any) => Promise.resolve({ data }).then(cb) }; return q;
} } }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("../ObjectPickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ id: "stats", name: "Example Stats Row" })}>Pick Stats</button> : null }));
vi.mock("@/components/ObjectBlockView", () => ({ default: () => <p>Added Stats</p> }));
vi.mock("../InlineStylePanel", () => ({ default: () => null }));
vi.mock("../ImagePickerDialog", () => ({ default: () => null }));
vi.mock("../VideoPickerDialog", () => ({ default: () => null }));
vi.mock("../CreatePageDialog", () => ({ default: () => null }));
vi.mock("../TagsPanel", () => ({ default: () => null }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
beforeEach(() => { mocks.remote = false; mocks.writes.mockClear(); mocks.original.content = null; vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} }); HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);
async function add() {
  const r = render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  await screen.findByText("Original Contact");
  fireEvent.click(screen.getByRole("button", { name: "Object" }));
  fireEvent.click(screen.getByText("Pick Stats"));
  await waitFor(() => expect(r.container.querySelectorAll("[data-page-block]")).toHaveLength(1));
  return r;
}
describe("coded page section preservation", () => {
  it("shows the original above previously saved sections without changing the row", async () => {
    mocks.original.content = [{ id: "old", type: "object", objectId: "stats", name: "Old Addition", align: "left" }];
    const before = JSON.stringify(mocks.original);
    const r = render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
    const original = await screen.findByRole("heading", { name: "Original Contact" });
    const added = await screen.findByText("Added Stats");
    expect(original.compareDocumentPosition(added) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await act(async () => { await mocks.discard(); });
    r.unmount();
    expect(JSON.stringify(mocks.original)).toBe(before);
    expect(mocks.writes).not.toHaveBeenCalled();
  });
  it("retains unsupported originals before the addition and saves them atomically", async () => {
    await add();
    expect(screen.getAllByText("Original Contact").length).toBeGreaterThan(0);
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => { expect(await mocks.save()).toBe(true); });
    const content = mocks.writes.mock.calls.find(([, patch]) => patch.content)?.[1].content;
    expect(content.map((b: any) => b.type)).toEqual(["object"]);
    expect(content[0].objectId).toBe("stats");
  });
  it("keeps the same original DOM node and surface mounted when a section is appended", async () => {
    const r = render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
    const original = await screen.findByRole("heading", { name: "Original Contact" });
    const surface = original.closest("[data-inline-root]");
    fireEvent.click(screen.getByRole("button", { name: "Object" }));
    fireEvent.click(screen.getByText("Pick Stats"));
    await screen.findByText("Added Stats");
    expect(screen.getByRole("heading", { name: "Original Contact" })).toBe(original);
    expect(original.closest("[data-inline-root]")).toBe(surface);
    expect(original.compareDocumentPosition(screen.getByText("Added Stats")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(r.container.querySelector("iframe")).toBeNull();
    await act(async () => { await mocks.discard(); });
  });
  it("discards without an unmount write and removes the whole editing surface", async () => {
    const r = await add();
    await act(async () => { await mocks.discard(); });
    expect(r.container.children).toHaveLength(0);
    r.unmount();
    expect(mocks.writes).not.toHaveBeenCalled();
  });
  it("restores the opening row even after an explicit intermediate save", async () => {
    await add();
    await act(async () => { await mocks.save(); await mocks.discard(); });
    expect(mocks.writes.mock.calls.at(-1)).toEqual(["pages", { content: null, inline_edits: {}, updated_at: "original-date" }]);
  });
});

describe("manifest-only public page save/discard integration", () => {
  async function openRemote(embedded = true) {
    mocks.remote = true;
    const view = render(<MemoryRouter initialEntries={["/manage/design?page=contact"]}><DesignTab embedded={embedded} pageId="contact" /></MemoryRouter>);
    const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
    if (!frame.contentWindow) throw new Error("Missing edit frame");
    const post = vi.spyOn(frame.contentWindow, "postMessage");
    const send = (type: string, payload = {}) => act(() => { window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source: frame.contentWindow, data: { source: "nova-site", type, ...payload } })); });
    send("edit-ready");
    return { ...view, frame, post, send };
  }
  it("holds public text changes in changeScope until Finish Editing and discards exactly", async () => {
    const s = await openRemote();
    s.send("edit-change", { scope: "page", next: { "0": "Changed Example Header", "fp:0": '{"v":1,"tag":"h1","t":"abc"}' } });
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => { expect(await mocks.save()).toBe(true); });
    expect(mocks.writes).toHaveBeenCalledWith("pages", expect.objectContaining({ inline_edits: { "0": "Changed Example Header", "fp:0": '{"v":1,"tag":"h1","t":"abc"}' } }));
    await act(async () => { await mocks.discard(); });
    expect(mocks.writes.mock.calls.at(-1)).toEqual(["pages", { content: null, inline_edits: {}, updated_at: "original-date" }]);
    expect(s.post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
    expect(s.container.children).toHaveLength(0);
  });
  it("appends picker sections beneath the unchanged original frame and discards without writes", async () => {
    const s = await openRemote();
    fireEvent.click(screen.getByRole("button", { name: "Object" }));
    fireEvent.click(screen.getByText("Pick Stats"));
    const added = await screen.findByText("Added Stats");
    expect(s.container.querySelector("iframe")).toBe(s.frame);
    expect(s.frame.compareDocumentPosition(added) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await act(async () => { await mocks.discard(); });
    expect(mocks.writes).not.toHaveBeenCalled();
    expect(s.post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
  });
  it("opens the interactive original in standalone editing too", async () => {
    const s = await openRemote(false);
    expect(s.frame.src).toContain("/draft?embed=fixture&nova-edit=1");
    expect(screen.queryByRole("heading", { name: "Contact" })).toBeNull();
    s.unmount();
    expect(s.post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
  });
});