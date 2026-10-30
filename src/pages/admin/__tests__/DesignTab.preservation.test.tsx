import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({ remote: true, slot: null as HTMLElement | null, path: "/draft", save: null as any, discard: null as any, add: null as any, history: null as any, hasChanges: null as any, failSave: false, writes: vi.fn(), cleanup: vi.fn(), openObject: vi.fn(), original: { content: null as unknown, inline_edits: {} as Record<string, string> } }));
vi.mock("../objectUsages", async (importOriginal) => ({ ...await importOriginal<typeof import("../objectUsages")>(), findObjectUsages: () => Promise.resolve([{ name: "Homepage" }, { name: "Contact" }]) }));
vi.mock("../siteManifest", async (importOriginal) => ({ ...await importOriginal<typeof import("../siteManifest")>(), loadSiteManifest: () => Promise.reject(new Error("fixture")), manifestHasPage: () => mocks.remote, draftEmbedUrl: () => "https://public.example.com/?embed=fixture" }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({ slot: mocks.slot, saveAll: vi.fn(), registerSave: (cb: any) => mocks.save = cb, registerDiscard: (cb: any) => mocks.discard = cb, registerHasChanges: (cb: any) => mocks.hasChanges = cb, registerHistory: (cb: any) => mocks.history = cb, registerAdd: (cb: any) => mocks.add = cb }) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => ({ openObject: mocks.openObject }) }));
vi.mock("../objectCopyCleanup", () => ({ cleanupObjectCopies: (ids: string[]) => mocks.cleanup(ids) }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "pages" ? [{ id: "contact", path: mocks.path, name: "Contact", updated_at: "original-date", ...mocks.original }, { id: "about", path: "/about", name: "About", updated_at: "about-date", content: [{ id: "about-image", type: "image", url: "/about.jpg", align: "left", width: 100 }], inline_edits: {} }] : [];
  const object = { id: "copy", name: "Categories (Contact)", status: "Ready", component_key: "Categories", content: { sections: [] }, inline_edits: { "0": "Original" }, labels: [] };
  const q: any = { select: () => q, is: () => q, eq: () => q, maybeSingle: async () => ({ data: table === "object_registry" ? { ...object, id: "site-header" } : null }), single: async () => ({ data: object }), insert: (patch: any) => { mocks.writes(table, patch); return q; }, order: () => Promise.resolve({ data }), update: (patch: any) => { mocks.writes(table, patch); return { eq: () => { const r = () => ({ error: mocks.failSave ? { message: "Could not save" } : null, data: mocks.failSave ? null : [{ id: "row" }] }); return Object.assign(Promise.resolve(r()), { select: async () => r() }); } }; }, then: (cb: any) => Promise.resolve({ data }).then(cb) }; return q;
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
beforeEach(() => { mocks.remote = true; mocks.path = "/draft"; mocks.history = null; mocks.failSave = false; mocks.writes.mockClear(); mocks.cleanup.mockReset().mockResolvedValue([]); mocks.openObject.mockClear(); mocks.original.content = null; mocks.original.inline_edits = {}; vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} }); HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); mocks.slot?.remove(); mocks.slot = null; });
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
    send("edit-change", { scope: "page", next: { "0": "Unsaved" } });
    expect(mocks.history.undoLabel).toBe("text change");
    send("edit-navigate", { path: "/about" });
    expect(onNavigate).toHaveBeenCalledWith("/about");
    view.rerender(<MemoryRouter><DesignTab key="about" embedded pageId="about" onNavigate={onNavigate} /></MemoryRouter>);
    const next = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
    expect(mocks.history.undoLabel).toBe(""); expect(mocks.history.redoLabel).toBe("");
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
  it("opens null-id site chrome through the registry lookup", async () => {
    const s = await openRemote(true, true);
    s.send("edit-object-click", { objectId: null, componentKey: "Header", name: "Header", slot: "site-header", siteWide: true });
    fireEvent.click(screen.getByRole("button", { name: "Edit Object" }));
    await waitFor(() => expect(mocks.openObject).toHaveBeenCalledWith("site-header", undefined, { slot: "site-header" }));
  });
  it.each(["discard", "undo-save", "leave"])("transports a coded-slot copy without status UI and cleans it on %s", async action => {
    const s = await openRemote(true, true);
    s.send("edit-object-click", { objectId: "categories", componentKey: "Categories", name: "Categories", slot: "code:home-categories" });
    fireEvent.click(await screen.findByRole("button", { name: "Make a Copy for This Page" }));
    await waitFor(() => expect(s.post).toHaveBeenLastCalledWith(expect.objectContaining({ type: "edit-update", objectSwaps: { "code:home-categories": { id: "copy", status: "Ready", name: "Categories (Contact)", component_key: "Categories", content: { sections: [] }, inline_edits: { "0": "Original" } } } }), "https://public.example.com"));
    expect(mocks.writes).toHaveBeenCalledWith("object_registry", expect.objectContaining({ status: "Ready" }));
    expect(screen.queryByText(/^(Draft|Ready|Work Status)$/)).toBeNull();
    if (action === "discard") await act(async () => mocks.discard());
    if (action === "undo-save") { s.send("edit-undo"); await act(async () => mocks.save()); }
    if (action === "leave") s.unmount();
    await waitFor(() => expect(mocks.cleanup).toHaveBeenCalledWith(["copy"]));
    expect(mocks.writes.mock.calls.filter(([table]) => table === "pages")).toHaveLength(0);
  });
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
  it("undo restores page and shared-object edits, clears dirty state, and redo updates the frame without writes", async () => {
    const s = await openRemote(true, true);
    s.send("edit-change", { scope: "page", next: { "0": "New wording" } });
    s.send("edit-change", { scope: "Header", next: { "style:0": '{"color":"red"}' } });
    expect(mocks.history.undoLabel).toBe("style change");
    s.send("edit-undo"); expect(s.post).toHaveBeenLastCalledWith(expect.objectContaining({ type: "edit-update", objectEdits: {} }), "https://public.example.com");
    s.send("edit-undo"); expect(mocks.hasChanges()).toBe(false);
    await act(async () => { expect(await mocks.save()).toBe(true); }); expect(mocks.writes).not.toHaveBeenCalled();
    expect(mocks.history.redoLabel).toBe("");
    s.send("edit-change", { scope: "page", next: { "placeholder:0": "Name" } });
    s.send("edit-undo"); s.send("edit-redo"); expect(mocks.hasChanges()).toBe(true);
    expect(s.post).toHaveBeenLastCalledWith(expect.objectContaining({ type: "edit-update", edits: { "placeholder:0": "Name" } }), "https://public.example.com");
    expect(mocks.writes).not.toHaveBeenCalled();
  });
  it.each(["objects", "images", "videos"])("adding %s is one undo step and redo restores it", async kind => {
    const s = await openRemote(true, true);
    act(() => mocks.add(kind)); fireEvent.click(screen.getByText(kind === "objects" ? "Pick Stats" : kind === "images" ? "Pick Image" : "Pick Video"));
    expect(mocks.history.undoLabel).toMatch(/^added/);
    s.send("edit-undo"); expect(mocks.hasChanges()).toBe(false); expect(mocks.history.undoLabel).toBe("");
    s.send("edit-redo"); expect(mocks.hasChanges()).toBe(true); expect(s.post.mock.calls.at(-1)?.[0].heldBlocks).toHaveLength(2);
    expect(mocks.writes).not.toHaveBeenCalled();
  });
  it("frame block moves undo the marker order, failed saves retain history and successful saves reset it", async () => {
    mocks.original.content = [{ id: "video", type: "video", url: "/clip.mp4", align: "left", width: 100 }];
    const s = await openRemote(true, true); s.send("edit-block-move", { id: "video", toIndex: 0 });
    s.send("edit-undo"); expect(mocks.hasChanges()).toBe(false);
    expect(s.post.mock.calls.at(-1)?.[0].heldBlocks[0]).toEqual({ id: "page-content", type: "page" });
    s.send("edit-redo"); mocks.failSave = true;
    await act(async () => { expect(await mocks.save()).toBe(false); }); expect(mocks.history.undoLabel).toBe("moved video");
    mocks.failSave = false; await act(async () => { expect(await mocks.save()).toBe(true); }); expect(mocks.history.undoLabel).toBe("");
    s.send("edit-change", { scope: "page", next: { "0": "New" } });
    await act(async () => { await mocks.discard(); }); expect(mocks.history.undoLabel).toBe("");
  });
  it("video width, replacement, deletion and Reset All use the same full history", async () => {
    mocks.slot = document.createElement("div"); document.body.appendChild(mocks.slot);
    mocks.original.content = [{ id: "video", type: "video", url: "/original.mp4", align: "left", width: 100 }];
    const s = await openRemote(true, true);
    const lastBlocks = () => s.post.mock.calls.at(-1)?.[0].heldBlocks;
    s.send("edit-block-select", { id: "video" });
    fireEvent.click(screen.getByRole("button", { name: "Width 50%" }));
    expect(lastBlocks()[1].width).toBe(50); s.send("edit-undo"); expect(lastBlocks()[1].width).toBe(100);
    s.send("edit-redo"); expect(lastBlocks()[1].width).toBe(50);
    fireEvent.click(screen.getByRole("button", { name: "Replace Video" })); fireEvent.click(screen.getByRole("button", { name: "Pick Video" }));
    expect(lastBlocks()[1].url).toBe("/held.mp4"); s.send("edit-undo"); expect(lastBlocks()[1].url).toBe("/original.mp4");
    fireEvent.click(screen.getAllByRole("button", { name: "Delete Block" })[0]); expect(lastBlocks()).toHaveLength(1);
    expect(mocks.history.redoLabel).toBe(""); s.send("edit-undo"); expect(lastBlocks()[1].id).toBe("video");
    s.send("edit-change", { scope: "page", next: { "style:0": '{"font-size":"32px"}' } });
    fireEvent.click(screen.getByRole("button", { name: "Reset All Edits on This Page" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset All Edits" }));
    expect(mocks.history.undoLabel).toBe(""); expect(mocks.history.redoLabel).toBe("");
    expect(lastBlocks()[1].width).toBe(100); expect(mocks.writes).not.toHaveBeenCalled();
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
    expect([...list.querySelectorAll("li")].map(el => el.textContent)).toEqual(["Site Header", "Page Content", "Video", "Image", "Site Footer"]);
    for (const slot of ["site-header", "site-footer"]) expect(list.querySelector(`[data-section-row="${slot}"] [aria-label="Move Up"], [data-section-row="${slot}"] [aria-label="Move Down"], [data-section-row="${slot}"] [aria-label="Delete Block"]`)).toBeNull();
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
    expect([...list.querySelectorAll("li")].map(el => el.textContent)).toEqual(["Site Header", "Page Content", "Image", "Site Footer"]);
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