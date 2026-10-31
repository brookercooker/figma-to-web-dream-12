import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({ remote: true, slot: null as HTMLElement | null, path: "/draft", save: null as any, discard: null as any, add: null as any, history: null as any, hasChanges: null as any, failSave: false, writes: vi.fn(), original: { content: null as unknown, inline_edits: {} as Record<string, string> } }));
vi.mock("../siteManifest", async (importOriginal) => ({ ...await importOriginal<typeof import("../siteManifest")>(), loadSiteManifest: () => Promise.reject(new Error("fixture")), manifestHasPage: () => mocks.remote, draftEmbedUrl: () => "https://public.example.com/?embed=fixture" }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({ slot: mocks.slot, saveAll: vi.fn(), registerSave: (cb: any) => mocks.save = cb, registerDiscard: (cb: any) => mocks.discard = cb, registerHasChanges: (cb: any) => mocks.hasChanges = cb, registerHistory: (cb: any) => mocks.history = cb, registerAdd: (cb: any) => mocks.add = cb }) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "pages" ? [{ id: "contact", path: mocks.path, name: "Contact", updated_at: "original-date", ...mocks.original }, { id: "about", path: "/about", name: "About", updated_at: "about-date", content: [{ id: "about-image", type: "image", url: "/about.jpg", align: "left", width: 100 }], inline_edits: {} }] : [];
  const q: any = { select: () => q, is: () => q, order: () => Promise.resolve({ data }), update: (patch: any) => { mocks.writes(table, patch); return { eq: () => Promise.resolve({ error: mocks.failSave ? { message: "Could not save" } : null }) }; }, then: (cb: any) => Promise.resolve({ data }).then(cb) }; return q;
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
  mocks.slot = document.createElement("div"); document.body.appendChild(mocks.slot);
  mocks.original.content = null; mocks.original.inline_edits = {};
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); mocks.slot?.remove(); mocks.slot = null; vi.unstubAllGlobals(); });
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
  expect(within(mocks.slot).getByText("Heading · Light transforms everything. section")).toBeInTheDocument();
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
