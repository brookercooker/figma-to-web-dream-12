import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DesignTab from "../DesignTab";

const mocks = vi.hoisted(() => ({ save: null as any, discard: null as any, writes: vi.fn(), original: { content: null, inline_edits: {} } }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({ slot: null, saveAll: vi.fn(), registerSave: (cb: any) => mocks.save = cb, registerDiscard: (cb: any) => mocks.discard = cb, registerHasChanges: vi.fn() }) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));
vi.mock("../codedPages", () => ({ codedPages: { "/contact": () => <div><section><h1>Original Contact</h1><form><input aria-label="Original Form" /></form></section><section><p>Original Details</p></section></div> },
  pageChunks: (root: HTMLElement) => [...root.querySelectorAll("section")], chunkName: (el: HTMLElement) => el.textContent }));
vi.mock("../importCodedObject", () => ({ sectionsFromDom: () => [] }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "pages" ? [{ id: "contact", path: "/contact", name: "Contact", updated_at: "original-date", ...mocks.original }] : [];
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
beforeEach(() => { mocks.writes.mockClear(); vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} }); HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);
async function add() {
  const r = render(<MemoryRouter><DesignTab embedded pageId="contact" /></MemoryRouter>);
  await screen.findByText("Original Contact");
  fireEvent.click(screen.getByRole("button", { name: "Object" }));
  fireEvent.click(screen.getByText("Pick Stats"));
  await waitFor(() => expect(r.container.querySelectorAll("[data-page-block]")).toHaveLength(3), { timeout: 4000 });
  return r;
}
describe("coded page section preservation", () => {
  it("retains unsupported originals before the addition and saves them atomically", async () => {
    await add();
    expect(screen.getAllByText("Original Contact").length).toBeGreaterThan(0);
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => { expect(await mocks.save()).toBe(true); });
    const content = mocks.writes.mock.calls.find(([, patch]) => patch.content)?.[1].content;
    expect(content.map((b: any) => b.type)).toEqual(["code", "code", "object"]);
    expect(content.slice(0, 2).map((b: any) => b.locked)).toEqual([true, true]);
    expect(content[2].objectId).toBe("stats");
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