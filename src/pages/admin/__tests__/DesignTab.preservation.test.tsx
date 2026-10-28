import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({ remote: true, path: "/draft", save: null as any, discard: null as any, add: null as any, writes: vi.fn(), original: { content: null as unknown, inline_edits: {} as Record<string, string> } }));
vi.mock("../siteManifest", async (importOriginal) => ({ ...await importOriginal<typeof import("../siteManifest")>(), loadSiteManifest: () => Promise.reject(new Error("fixture")), manifestHasPage: () => mocks.remote, draftEmbedUrl: () => "https://public.example.com/?embed=fixture" }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({ slot: null, saveAll: vi.fn(), registerSave: (cb: any) => mocks.save = cb, registerDiscard: (cb: any) => mocks.discard = cb, registerHasChanges: vi.fn(), registerAdd: (cb: any) => mocks.add = cb }) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "pages" ? [{ id: "contact", path: mocks.path, name: "Contact", updated_at: "original-date", ...mocks.original }, { id: "about", path: "/about", name: "About", updated_at: "about-date", content: [{ id: "about-image", type: "image", url: "/about.jpg", align: "left", width: 100 }], inline_edits: {} }] : [];
  const q: any = { select: () => q, is: () => q, order: () => Promise.resolve({ data }), update: (patch: any) => { mocks.writes(table, patch); return { eq: () => Promise.resolve({ error: null }) }; }, then: (cb: any) => Promise.resolve({ data }).then(cb) }; return q;
} } }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("../ObjectPickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ id: "stats", name: "Example Stats Row" })}>Pick Stats</button> : null }));
vi.mock("@/components/ObjectBlockView", () => ({ default: () => <p>Added Stats</p> }));
vi.mock("../InlineStylePanel", () => ({ default: () => null }));
vi.mock("../ImagePickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ url: "/held.jpg", alt: "Held Image" })}>Pick Image</button> : null }));
vi.mock("../VideoPickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ url: "/held.mp4" })}>Pick Video</button> : null }));
vi.mock("../CreatePageDialog", () => ({ default: () => null }));
vi.mock("../TagsPanel", () => ({ default: () => null }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
beforeEach(() => { mocks.remote = true; mocks.path = "/draft"; mocks.writes.mockClear(); mocks.original.content = null; mocks.original.inline_edits = {}; vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} }); HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);
describe("public page save/discard integration", () => {
  it("routes trusted navigation through the caller and resets Sections on a new page opening", async () => {
    mocks.original.content = [{ id: "old-video", type: "video", url: "/old.mp4", align: "left", width: 100 }];
    const onNavigate = vi.fn();
    const view = render(<MemoryRouter><DesignTab key="contact" embedded pageId="contact" onNavigate={onNavigate} /></MemoryRouter>);
    const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
    const source = frame.contentWindow;
    if (!source) throw new Error("Missing frame");
    const post = vi.spyOn(source, "postMessage").mockImplementation(() => {});
    const send = (type: string, payload = {}) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type, ...payload } })));
    send("edit-ready", { capabilities: { heldBlocks: true } });
    send("edit-block-select", { id: "old-video" });
    expect(post).toHaveBeenLastCalledWith(expect.objectContaining({ type: "edit-update", activeBlockId: "old-video" }), "https://public.example.com");
    send("edit-navigate", { path: "/about" });
    expect(onNavigate).toHaveBeenCalledWith("/about");
    view.rerender(<MemoryRouter><DesignTab key="about" embedded pageId="about" onNavigate={onNavigate} /></MemoryRouter>);
    const next = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
    expect(new URL(next.src).pathname).toBe("/about");
    expect(next).not.toBe(frame);
    expect(view.container.querySelector('[data-section-row="old-video"]')).toBeNull();
    expect(view.container.querySelector('[data-section-row="about-image"][aria-current]')).toBeNull();
    expect(view.container.querySelector('[data-page-block="about-image"]')).not.toBeNull();
    expect(view.container.querySelector('[data-page-block="about-image"]')?.getAttribute("data-active")).toBeNull();
    expect(mocks.writes).not.toHaveBeenCalled();
  });
  async function openRemote(embedded = true, capable = false) {
    mocks.remote = true;
    const view = render(<MemoryRouter initialEntries={["/manage/design?page=contact"]}><DesignTab embedded={embedded} pageId="contact" /></MemoryRouter>);
    const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
    if (!frame.contentWindow) throw new Error("Missing edit frame");
    const frameWindow = frame.contentWindow;
    Object.defineProperty(frame, "contentWindow", { configurable: true, get: () => frameWindow });
    const post = vi.spyOn(frameWindow, "postMessage").mockImplementation(() => {});
    const send = (type: string, payload = {}) => act(() => { window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source: frame.contentWindow, data: { source: "nova-site", type, ...payload } })); });
    send("edit-ready", capable ? { capabilities: { heldBlocks: true, blockMove: true } } : {});
    return { ...view, frame, post, send };
  }
  it.each(["/", "/contact", "/about", "/team", "/locations", "/full-vendor-list", "/inspiration-gallery", "/test-page", "/race-test-page", "/landing/test", "/draft"])("opens %s through the public editor without local markup", async (path) => {
    mocks.path = path;
    const s = await openRemote();
    expect(new URL(s.frame.src).pathname).toBe(path);
    expect(s.container.querySelectorAll("iframe")).toHaveLength(1);
    expect(s.container.querySelector("[data-empty-editable]")).toBeNull();
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => { await mocks.discard(); });
    expect(s.container.children).toHaveLength(0);
  });
  it("passes existing positional edits unchanged on init and saves only the held map", async () => {
    const original = { "0.0.3": "Saved words", "style:0.1": '{"font-size":"24px"}' };
    mocks.original.inline_edits = original;
    const s = await openRemote();
    expect(s.post).toHaveBeenCalledWith(expect.objectContaining({ type: "edit-init", edits: original }), "https://public.example.com");
    const next = { ...original, "0.0.3": "Held words" };
    s.send("edit-change", { scope: "page", next });
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => { await mocks.save(); });
    expect(mocks.writes).toHaveBeenCalledWith("pages", expect.objectContaining({ inline_edits: next }));
    await act(async () => { await mocks.discard(); });
    expect(mocks.writes.mock.calls.at(-1)?.[1].inline_edits).toEqual(original);
  });
  it("does not substitute an empty local page when the manifest is unavailable", async () => {
    mocks.remote = false;
    const s = await openRemote();
    expect(s.container.querySelector("[data-empty-editable]")).toBeNull();
    expect(s.container.querySelectorAll("iframe")).toHaveLength(1);
    await act(async () => { await mocks.discard(); });
  });
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
  it("appends picker sections beneath the original frame, reloads once and discards without writes", async () => {
    const s = await openRemote();
    act(() => mocks.add("objects"));
    fireEvent.click(screen.getByText("Pick Stats"));
    const added = await screen.findByText("Added Stats");
    const frame = s.container.querySelector("iframe");
    expect(frame).not.toBe(s.frame);
    expect(frame?.compareDocumentPosition(added) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(s.container.querySelectorAll("iframe")).toHaveLength(1);
    await act(async () => { await mocks.discard(); });
    expect(mocks.writes).not.toHaveBeenCalled();
    expect(s.post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
    expect(s.container.querySelector("[data-page-block]")).toBeNull();
    expect(s.container.children).toHaveLength(0);
  });
  it.each([ ["Image", "Pick Image", "image"], ["Video", "Pick Video", "video"] ])("holds an added %s locally until Finish", async (label, pick, type) => {
    const s = await openRemote();
    act(() => mocks.add(label === "Image" ? "images" : "videos"));
    fireEvent.click(screen.getByRole("button", { name: pick }));
    const section = s.container.querySelector("[data-page-block]");
    expect(section).not.toBeNull();
    const frame = s.container.querySelector("iframe");
    expect(frame?.compareDocumentPosition(section as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(mocks.writes).not.toHaveBeenCalled();
    // Clicking a held section selects it; its media ignores the pointer so it never plays or opens.
    fireEvent.click(section as HTMLElement);
    expect((section as HTMLElement).dataset.active).toBe("true");
    expect((section as HTMLElement).className).toContain("[&_video]:pointer-events-none");
    await act(async () => { expect(await mocks.save()).toBe(true); });
    expect(mocks.writes.mock.calls.find(([, patch]) => patch.content)?.[1].content[0].type).toBe(type);
    await act(async () => { await mocks.discard(); });
    expect(s.container.children).toHaveLength(0);
  });
  it("keeps held order in sync with Sections, including edits and removal", async () => {
    mocks.original.content = [
      { id: "first", type: "image", url: "/first.jpg", alt: "First", align: "left", width: 100 },
      { id: "second", type: "video", url: "/second.mp4", align: "left", width: 100 },
    ];
    const s = await openRemote(false);
    const stubReloadedFrame = () => {
      const current = s.container.querySelector("iframe")?.contentWindow;
      if (!current) throw new Error("Missing reloaded frame window");
      vi.spyOn(current, "postMessage").mockImplementation(() => {});
    };
    const order = () => [...s.container.querySelectorAll<HTMLElement>("[data-page-block]")].map(el => el.dataset.pageBlock);
    expect(order()).toEqual(["first", "second"]);
    const list = s.container.querySelector("ol");
    if (!list) throw new Error("Missing Sections list");
    const down = list.querySelector('[aria-label="Move Down"]');
    if (!down) throw new Error("Missing reorder control");
    fireEvent.click(down);
    await waitFor(() => expect(order()).toEqual(["second", "first"]));
    stubReloadedFrame();
    expect([...list.querySelectorAll("li")].map(el => el.textContent)).toEqual(["Page Content", "Video", "Image"]);
    const imageRow = [...list.querySelectorAll("li")].find(el => el.textContent === "Image");
    const imageButton = imageRow?.querySelector("button");
    if (!imageButton) throw new Error("Missing image section control");
    fireEvent.click(imageButton);
    fireEvent.click(screen.getByRole("button", { name: "Width 50%" }));
    stubReloadedFrame();
    expect(s.container.querySelector('[data-page-block="first"] figure')?.className).toContain("w-1/2");
    const deletes = list.querySelectorAll('[aria-label="Delete Block"]');
    fireEvent.click(deletes[0]);
    await waitFor(() => expect(order()).toEqual(["first"]));
    stubReloadedFrame();
    expect([...list.querySelectorAll("li")].map(el => el.textContent)).toEqual(["Page Content", "Image"]);
    s.unmount();
  });
  it("moves held components around page content without reload and restores saved order on discard", async () => {
    mocks.original.content = [{ id: "video", type: "video", url: "/clip.mp4", align: "left", width: 100 }];
    const s = await openRemote(true, true);
    expect(s.container.querySelector("[data-held-sections]")).toBeNull();
    s.send("edit-block-move", { id: "video", toIndex: 0 });
    expect(s.container.querySelector("iframe")).toBe(s.frame);
    expect(s.post).toHaveBeenLastCalledWith(expect.objectContaining({ type: "edit-update", activeBlockId: "video", heldBlocks: [(mocks.original.content as any[])[0], { id: "page-content", type: "page" }] }), "https://public.example.com");
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => { await mocks.save(); });
    expect(mocks.writes).toHaveBeenCalledWith("pages", { content: [(mocks.original.content as any[])[0], { id: "page-content", type: "page" }] });
    await act(async () => { await mocks.discard(); });
    expect(mocks.writes.mock.calls.at(-1)?.[1].content).toEqual(mocks.original.content);
  });
  it("opens the interactive original in standalone editing too", async () => {
    const s = await openRemote(false);
    expect(s.frame.src).toContain("/draft?embed=fixture&nova-edit=1");
    expect(screen.queryByRole("heading", { name: "Contact" })).toBeNull();
    s.unmount();
    expect(s.post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-exit" }, "https://public.example.com");
  });
});