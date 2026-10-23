import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ObjectDesignPage from "../ObjectDesignPage";
import Categories from "@/components/objects/Categories";
import { fingerprintOf } from "@/lib/inlineEditCore";

const mocks = vi.hoisted(() => ({
  row: {} as any, writes: vi.fn(), importer: vi.fn(() => []), sync: vi.fn(),
  save: null as null | (() => Promise<boolean>), discard: null as null | (() => void),
  hasChanges: null as null | (() => boolean), slot: null as HTMLElement | null,
}));
vi.mock("@/components/objects/registry", async () => {
  const { default: C } = await import("@/components/objects/Categories");
  return { objectRegistry: { Categories: { component: C } } };
});
vi.mock("@/lib/objectScopes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/objectScopes")>("@/lib/objectScopes");
  const { default: C } = await import("@/components/objects/Categories");
  const map = new Map<unknown, string>([[C, "Categories"]]);
  return { ...actual, loadObjectComponents: () => Promise.resolve(map), objectComponentsNow: () => map };
});
vi.mock("../importCodedObject", () => ({ sectionsFromDom: mocks.importer }));
vi.mock("../designChat/EditorSlot", () => ({ useEditorSlot: () => ({
  slot: mocks.slot, registerSave: (fn: any) => { mocks.save = fn; },
  registerDiscard: (fn: any) => { mocks.discard = fn; }, registerHasChanges: (fn: any) => { mocks.hasChanges = fn; },
}) }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => null }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: mocks.sync }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  const data = table === "object_registry" ? [mocks.row] : [];
  const query: any = { select: () => query, is: () => query, order: () => Promise.resolve({ data }),
    then: (resolve: any) => Promise.resolve({ data }).then(resolve),
    update: (value: any) => ({ eq: (column: string, id: string) => { mocks.writes(value, column, id); return Promise.resolve({ error: null }); } }),
  }; return query;
} } }));
vi.mock("../CreateObjectDialog", () => ({ default: () => null }));
vi.mock("../ImagePickerDialog", () => ({ default: () => null }));
vi.mock("../VideoPickerDialog", () => ({ default: () => null }));
vi.mock("../ObjectMiniPreview", () => ({ default: () => null }));

beforeEach(() => {
  mocks.row = { id: "categories", name: "Categories", slug_id: "categories", status: "Ready", component_key: "Categories", content: [], inline_edits: {} };
  mocks.writes.mockClear(); mocks.importer.mockClear(); mocks.sync.mockClear();
  mocks.slot = document.createElement("aside"); document.body.append(mocks.slot);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); mocks.slot?.remove(); });
const open = (embedded = true, focusSection?: string) => render(<MemoryRouter initialEntries={["/manage/objects/design?object=categories"]}>
  <ObjectDesignPage embedded={embedded} objectId="categories" focusSection={focusSection} />
</MemoryRouter>);

describe("coded object editing", () => {
  it("opens Categories as built without importing or rendering blocks, even with saved content", async () => {
    mocks.row.content = [{ id: "old", type: "free", parts: [] }];
    const r = open();
    expect(await screen.findByRole("region", { name: "Shop by category" })).toBeInTheDocument();
    expect(r.container.querySelector(".inline-edit-surface")).toBeTruthy();
    expect(r.container.querySelector("[data-block-id]")).toBeNull();
    expect(screen.getByText("Changes Here Apply Everywhere This Object Is Used.")).toBeInTheDocument();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1000)); });
    expect(mocks.importer).not.toHaveBeenCalled(); expect(mocks.writes).not.toHaveBeenCalled();
  });
  it("replays fingerprinted text and link edits from the object-root paths", async () => {
    const original = render(<MemoryRouter><Categories /></MemoryRouter>);
    const span = screen.getByText("Ceiling");
    mocks.row.inline_edits = { "0.0.1": "Ceiling Lighting", "fp:0.0.1": JSON.stringify(fingerprintOf(span)), "link:0.0": JSON.stringify({ href: "/team", target: "_blank" }) };
    original.unmount(); open();
    expect(await screen.findByText("Ceiling Lighting")).toBeInTheDocument();
    expect(screen.getByText("Ceiling Lighting").closest("a")).toHaveAttribute("href", "/team");
    expect(screen.getByText("Ceiling Lighting").closest("a")).toHaveAttribute("target", "_blank");
    expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("stages an object-scoped edit with its original fingerprint and saves before returning", async () => {
    open(); const label = await screen.findByText("Ceiling");
    await waitFor(() => expect(label).toHaveAttribute("data-inline-editable"));
    label.innerHTML = "Ceiling Lighting"; fireEvent.input(label);
    expect(mocks.hasChanges?.()).toBe(true); expect(mocks.writes).not.toHaveBeenCalled();
    const close = vi.fn();
    await act(async () => { if (await mocks.save?.()) close(); });
    expect(mocks.writes).toHaveBeenCalledWith(expect.objectContaining({ inline_edits: expect.objectContaining({ "0.0.1": "Ceiling Lighting", "fp:0.0.1": expect.any(String) }) }), "component_key", "Categories");
    expect(mocks.writes.mock.invocationCallOrder[0]).toBeLessThan(close.mock.invocationCallOrder[0]);
    expect(mocks.sync).toHaveBeenCalled(); expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("discard restores saved edits without writing", async () => {
    open(); const label = await screen.findByText("Ceiling");
    label.innerHTML = "Temporary"; fireEvent.input(label);
    act(() => mocks.discard?.());
    await waitFor(() => expect(screen.getByText("Ceiling")).toBeInTheDocument());
    expect(mocks.writes).not.toHaveBeenCalled(); expect(mocks.hasChanges?.()).toBe(false);
  });
  it("focus selects and scrolls to a real card without conversion", async () => {
    open(true, "0.0.1"); const label = await screen.findByText("Ceiling");
    await waitFor(() => expect(label).toHaveAttribute("data-inline-selected", "1"));
    expect(label.scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
    expect(mocks.importer).not.toHaveBeenCalled();
  });
  it("standalone Edit toggling never imports; conversion requires confirmation and Cancel is inert", async () => {
    const r = open(false); await screen.findByText("Ceiling");
    fireEvent.click(screen.getByRole("button", { name: "Preview", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Edit", exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Convert to Blocks (Appearance May Change)" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Visitors will keep seeing the original coded version");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(r.container.querySelector(".inline-edit-surface")).toBeTruthy();
    expect(mocks.importer).not.toHaveBeenCalled(); expect(mocks.writes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Convert to Blocks (Appearance May Change)" }));
    fireEvent.click(screen.getByRole("button", { name: "Convert to Blocks", exact: true }));
    await waitFor(() => expect(mocks.importer).toHaveBeenCalled(), { timeout: 4000 });
    expect(r.container.querySelector(".inline-edit-surface")).toBeNull();
  });
  it("objects designed without a component key still open their saved block editor", async () => {
    mocks.row.component_key = null;
    mocks.row.content = [{ id: "saved", type: "free", parts: [{ id: "text", kind: "paragraph", text: "Designed words" }] }];
    const r = open(); await waitFor(() => expect(r.container.querySelector("[data-block-id='saved']")).toBeTruthy());
    expect(r.container.querySelector(".inline-edit-surface")).toBeNull();
    expect(mocks.importer).not.toHaveBeenCalled();
  });
});