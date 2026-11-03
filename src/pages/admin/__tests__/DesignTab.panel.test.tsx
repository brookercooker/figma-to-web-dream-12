import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({ objectContent: null as unknown, chat: null as any, remote: true, slot: null as HTMLElement | null, path: "/draft", save: null as any, discard: null as any, add: null as any, history: null as any, hasChanges: null as any, failSave: false, writes: vi.fn(), original: { content: null as unknown, inline_edits: {} as Record<string, string> } }));
vi.mock("../siteManifest", async (importOriginal) => ({ ...await importOriginal<typeof import("../siteManifest")>(), loadSiteManifest: () => Promise.reject(new Error("fixture")), manifestHasPage: () => mocks.remote, draftEmbedUrl: () => "https://public.example.com/?embed=fixture" }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({ slot: mocks.slot, saveAll: vi.fn(), registerSave: (cb: any) => mocks.save = cb, registerDiscard: (cb: any) => mocks.discard = cb, registerHasChanges: (cb: any) => mocks.hasChanges = cb, registerHistory: (cb: any) => mocks.history = cb, registerAdd: (cb: any) => mocks.add = cb }) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => mocks.chat }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "pages" ? [{ id: "contact", path: mocks.path, name: "Contact", updated_at: "original-date", ...mocks.original }, { id: "about", path: "/about", name: "About", updated_at: "about-date", content: [{ id: "about-image", type: "image", url: "/about.jpg", align: "left", width: 100 }], inline_edits: {} }] : mocks.objectContent ? [{ id: "object", name: "Saved Object", component_key: null, status: "Ready", content: mocks.objectContent, inline_edits: {} }] : [];
  const q: any = { select: () => q, is: () => q, order: () => Promise.resolve({ data }), update: (patch: any) => { mocks.writes(table, patch); return { eq: () => { const result = { data: [{ id: "saved" }], error: mocks.failSave ? { message: "Could not save" } : null }; return Object.assign(Promise.resolve(result), { select: async () => result }); } }; }, then: (cb: any) => Promise.resolve({ data }).then(cb) }; return q;
} } }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("../ObjectPickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ id: "stats", name: "Example Stats Row" })}>Pick Stats</button> : null }));
vi.mock("@/components/ObjectBlockView", () => ({ default: () => <p>Added Stats</p> }));
vi.mock("../ImagePickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ url: "/held.jpg", alt: "Held Image" })}>Pick Image</button> : null }));
vi.mock("../VideoPickerDialog", () => ({ default: ({ open, onPick }: any) => open ? <button onClick={() => onPick({ url: "/held.mp4" })}>Pick Video</button> : null }));
vi.mock("../CreatePageDialog", () => ({ default: () => null }));
vi.mock("../TagsPanel", () => ({ default: () => null }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
beforeEach(() => {
  mocks.chat = null;
  mocks.objectContent = null;
  mocks.slot = document.createElement("div"); document.body.appendChild(mocks.slot);
  mocks.original.content = null; mocks.original.inline_edits = {};
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); mocks.slot?.remove(); mocks.slot = null; vi.unstubAllGlobals(); });
it.each(["https://www.youtube.com/watch?v=abcdefghijk", "/upload.mp4"])("deletes saved %s from the list when the frame poster cannot be clicked, with undo/redo/discard and no library writes", async url => {
  mocks.original.content = [{ id: "saved-video", type: "video", url, align: "left", width: 100 }];
  mocks.writes.mockClear();
  const view = render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow; if (!source || !mocks.slot) throw new Error("Missing frame");
  const post = vi.spyOn(source, "postMessage").mockImplementation(() => {});
  act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type: "edit-ready", capabilities: { heldBlocks: true } } })));
  const row = mocks.slot.querySelector('[data-section-row="saved-video"]'); if (!row) throw new Error("Missing saved row");
  fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Video" }));
  expect(within(mocks.slot).getByLabelText("Saved Video Options")).toBeInTheDocument();
  fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Delete Video" }));
  expect(mocks.hasChanges()).toBe(false);
  fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete Video" }));
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].heldBlocks).toHaveLength(0);
  expect(mocks.hasChanges()).toBe(true); expect(mocks.writes).not.toHaveBeenCalled();
  act(() => mocks.history.undo()); expect(mocks.hasChanges()).toBe(false);
  act(() => mocks.history.redo()); expect(mocks.hasChanges()).toBe(true);
  await act(async () => mocks.discard()); expect(mocks.writes).not.toHaveBeenCalled();
  expect(view.container.querySelector("video")).toBeNull();
});
it("confirms saved video deletion from its full-width options panel", async () => {
  mocks.original.content = [{ id: "saved-video", type: "video", url: "/upload.mp4", align: "left", width: 100 }];
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow; if (!source || !mocks.slot) throw new Error("Missing frame");
  vi.spyOn(source, "postMessage").mockImplementation(() => {});
  for (const data of [{ type: "edit-ready", capabilities: { heldBlocks: true } }, { type: "edit-block-select", id: "saved-video" }]) act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", ...data } })));
  const panel = within(mocks.slot).getByLabelText("Saved Video Options");
  const button = within(panel).getByRole("button", { name: "Delete Video" });
  expect(button).toHaveClass("w-full");
  expect(button.nextElementSibling).toHaveTextContent("Undo All Changes to Video");
  fireEvent.click(button); fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(mocks.hasChanges()).toBe(false);
  fireEvent.click(button); fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete Video" })); expect(mocks.hasChanges()).toBe(true);
});
it("removes only the selected nested object video and saves object content, never the library", async () => {
  mocks.objectContent = [{ id: "section", type: "free", text: "Keep this text", videos: [{ id: "clip", url: "https://youtu.be/abcdefghijk" }, { id: "keep", url: "/keep.mp4" }] }];
  mocks.writes.mockClear();
  render(<MemoryRouter><DesignTab embedded pageId="contact" objectId="object" /></MemoryRouter>);
  await screen.findByTitle("Public Page Editor");
  if (!mocks.slot) throw new Error("Missing panel");
  const row = mocks.slot.querySelector('[data-section-row="section:video:0"]'); if (!row) throw new Error("Missing nested video");
  fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Video" }));
  fireEvent.click(within(within(mocks.slot).getByLabelText("Saved Video Options")).getByRole("button", { name: "Delete Video" }));
  fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete Video" }));
  expect(mocks.hasChanges()).toBe(true); expect(mocks.writes).not.toHaveBeenCalled();
  act(() => mocks.history.undo()); expect(mocks.hasChanges()).toBe(false);
  act(() => mocks.history.redo());
  await act(async () => { expect(await mocks.save()).toBe(true); });
  expect(mocks.writes).toHaveBeenCalledWith("object_registry", expect.objectContaining({ content: [{ id: "section", type: "free", text: "Keep this text", videos: [{ id: "keep", url: "/keep.mp4" }] }] }));
  expect(mocks.writes.mock.calls.every(([table]) => table === "object_registry")).toBe(true);
});
it.each([["mobile", 390], ["tablet", 768], ["desktop", 1280]])("Manual Edit uses the chosen %s viewport without replacing the frame", async (device, width) => {
  mocks.chat = { device, drawing: {}, startEditing: vi.fn() };
  let virtualWidth = 0;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private measure: () => void) {}
    observe(el: HTMLElement) {
      if (el.hasAttribute("data-scaled-viewport")) {
        Object.defineProperty(el, "clientWidth", { configurable: true, value: device === "desktop" ? 900 : 300 });
        Object.defineProperty(el, "clientHeight", { configurable: true, value: 700 });
        this.measure();
      }
    }
    disconnect() {}
  });
  const view = render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source) throw new Error("Missing frame");
  vi.spyOn(source, "postMessage").mockImplementation(() => {});
  act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type: "edit-ready", capabilities: { heldBlocks: true } } })));
  virtualWidth = Number(view.container.querySelector("[data-scaled-viewport]")?.getAttribute("data-virtual-width"));
  expect(virtualWidth).toBe(width);
  mocks.chat = { ...mocks.chat, device: "tablet" };
  view.rerender(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  expect(screen.getByTitle("Public Page Editor")).toBe(frame);
});
it("footer text selection asks to edit the site-wide Footer without writing", async () => {
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source) throw new Error("Missing frame");
  vi.spyOn(source, "postMessage").mockImplementation(() => {});
  const send = (type: string, payload = {}) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type, ...payload } })));
  send("edit-ready");
  send("edit-select", { selection: { key: "0", scope: "Footer", kind: "text", tag: "p", text: "Contact us", style: {}, rect: {} } });
  expect(screen.getByRole("heading", { name: "Edit the Site Footer?" })).toBeInTheDocument();
});
it("whole-text icon placement and links survive framed updates and Undo/Redo without writes", async () => {
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source || !mocks.slot) throw new Error("Missing frame");
  const post = vi.spyOn(source, "postMessage").mockImplementation(() => {});
  const send = (type: string, payload = {}) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type, ...payload } })));
  send("edit-ready", { capabilities: { heldBlocks: true } });
  send("edit-select", { selection: { key: "0", scope: "page", kind: "text", tag: "h2", text: "Nova", style: {}, rect: {} } });
  mocks.writes.mockClear();
  fireEvent.click(within(mocks.slot).getByRole("button", { name: "Icon None" }));
  fireEvent.click(within(mocks.slot).getByRole("button", { name: "Mail" }));
  fireEvent.click(within(mocks.slot).getByRole("button", { name: "Before Text" }));
  fireEvent.click(within(mocks.slot).getByRole("button", { name: "Link None" }));
  const address = within(mocks.slot).getByRole("textbox", { name: "Link Address" });
  fireEvent.change(address, { target: { value: "/about" } }); fireEvent.keyDown(address, { key: "Enter" });
  const next = { "icon:0": "Mail", "icon-position:0": "before", "link:0": JSON.stringify({ href: "/about" }) };
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].edits).toEqual(next);
  send("edit-change", { scope: "page", next: { ...next, "style:0": JSON.stringify({ color: "#853732" }) } });
  act(() => mocks.history.undo());
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].edits).toEqual(next);
  act(() => mocks.history.redo());
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].edits["icon-position:0"]).toBe("before");
  expect(mocks.hasChanges()).toBe(true); expect(mocks.writes).not.toHaveBeenCalled();
});
it("replays held edits after a toolbar reload without writing them", async () => {
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source) throw new Error("Missing frame");
  const send = (type: string, payload = {}) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type, ...payload } })));
  vi.spyOn(source, "postMessage").mockImplementation(() => {});
  send("edit-ready", { capabilities: { heldBlocks: true } });
  send("edit-change", { scope: "page", next: { "0": "My held wording" } });
  mocks.writes.mockClear();
  act(() => window.dispatchEvent(new Event("nova-manager-reload-editor")));
  const next = screen.getByTitle("Public Page Editor") as HTMLIFrameElement;
  expect(next).not.toBe(frame);
  const win = next.contentWindow; if (!win) throw new Error("Missing reloaded frame");
  const post = vi.spyOn(win, "postMessage").mockImplementation(() => {});
  act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source: win, data: { source: "nova-site", type: "edit-ready", capabilities: { heldBlocks: true } } })));
  expect(post.mock.calls.find(([message]) => message.type === "edit-init")?.[0].edits).toEqual({ "0": "My held wording" });
  expect(mocks.hasChanges()).toBe(true); expect(mocks.writes).not.toHaveBeenCalled();
});
it("frame image Delete enters local history and Undo/Redo/Discard restore it without saving", async () => {
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source || !mocks.slot) throw new Error("Missing frame");
  const post = vi.spyOn(source, "postMessage").mockImplementation(() => {});
  const send = (type: string, payload = {}) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type, ...payload } })));
  send("edit-ready", { capabilities: { heldBlocks: true } });
  send("edit-select", { selection: { key: "0.2", scope: "page", kind: "image", tag: "img", style: {}, rect: {} } });
  send("edit-key", { key: "Delete" });
  expect(mocks.hasChanges()).toBe(true);
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].edits).toEqual({ "hidden:0.2": "1" });
  act(() => mocks.history.undo()); expect(mocks.hasChanges()).toBe(false);
  act(() => mocks.history.redo()); expect(mocks.hasChanges()).toBe(true);
  await act(async () => { await mocks.discard(); });
  expect(mocks.hasChanges()).toBe(false);
});
it("replaces the hint with one options panel through repeated frame selections", async () => {
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source || !mocks.slot) throw new Error("Missing editor");
  const slot = mocks.slot;
  vi.spyOn(source, "postMessage").mockImplementation(() => {});
  act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type: "edit-ready", capabilities: { heldBlocks: true } } })));
  const send = (selection: unknown) => act(() => window.dispatchEvent(new MessageEvent("message", {
    origin: "https://public.example.com", source,
    data: { source: "nova-site", type: "edit-select", selection },
  })));
  const select = (key: string) => send({ key, scope: "page", kind: "text", tag: "h1", text: "Homepage Heading", rect: { width: 600, height: 48 }, style: { fontFamily: "Cormorant Garamond", fontWeight: "400", fontSize: "40px", textDecorationLine: "none" } });
  const hintCount = () => Array.from(slot.querySelectorAll("div")).filter(el => el.childElementCount === 0 && el.textContent?.startsWith("Click any wording")).length;
  expect(hintCount()).toBe(1);
  select("0");
  expect(hintCount()).toBe(0);
  expect(slot.querySelectorAll('[aria-label="Font"]')).toHaveLength(1);
  expect(within(slot).getByRole("combobox", { name: "Weight" })).toHaveTextContent("Regular");
  const selectedChildren = slot.querySelector(".space-y-4.p-3")?.childElementCount;
  send(null);
  expect(hintCount()).toBe(1);
  expect(slot.querySelectorAll('[aria-label="Font"]')).toHaveLength(0);
  select("0"); select("1"); select("0");
  expect(hintCount()).toBe(0);
  expect(slot.querySelectorAll('[aria-label="Font"]')).toHaveLength(1);
  expect(Array.from(slot.querySelectorAll('button[aria-expanded]')).filter(el => el.textContent?.trim() === "Text")).toHaveLength(1);
  expect(slot.querySelector(".space-y-4.p-3")?.childElementCount).toBe(selectedChildren);
});
it("highlighted-word results enter unsaved history and Undo/Redo without database writes", async () => {
  render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  const frame = await screen.findByTitle("Public Page Editor") as HTMLIFrameElement;
  const source = frame.contentWindow;
  if (!source || !mocks.slot) throw new Error("Missing editor");
  const post = vi.spyOn(source, "postMessage").mockImplementation(() => {});
  const send = (type: string, payload = {}) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data: { source: "nova-site", type, ...payload } })));
  send("edit-ready", { capabilities: { heldBlocks: true, rangeFormatting: true } });
  send("edit-select", { selection: { key: "0.0.2.0", scope: "page", kind: "text", tag: "h1", text: "Light transforms everything.", context: { section: "Light transforms everything.", role: "heading" }, html: 'Light<br><span class="italic">…' } });
  send("edit-range", { key: "0.0.2.0", scope: "page", collapsed: false, text: "transforms", marks: { bold: false, italic: true, underline: false, strike: false, color: "rgb(255, 255, 255)", size: "88px", weight: "300", font: '"Cormorant Garamond", …' } });
  expect(within(mocks.slot).getByRole("textbox", { name: "Selected Text" })).toHaveValue("Light transforms everything.");
  expect(within(mocks.slot).getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  expect(within(mocks.slot).getByRole("spinbutton", { name: "Size (px)" })).toHaveValue(88);
  fireEvent.click(within(mocks.slot).getByRole("button", { name: "Bold" }));
  expect(post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-format", key: "0.0.2.0", scope: "page", command: "bold" }, "https://public.example.com");
  const next = { "0.0.2.0": "Light <strong>transforms</strong> everything." };
  send("edit-change", { scope: "page", next });
  expect(mocks.hasChanges()).toBe(true);
  act(() => mocks.history.undo());
  expect(mocks.hasChanges()).toBe(false);
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].edits).toEqual({});
  act(() => mocks.history.redo());
  expect(mocks.hasChanges()).toBe(true);
  expect(post.mock.calls.filter(([m]) => m.type === "edit-update").at(-1)?.[0].edits).toEqual(next);
});
