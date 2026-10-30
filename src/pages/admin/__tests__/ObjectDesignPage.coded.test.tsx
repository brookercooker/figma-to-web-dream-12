import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ObjectDesignPage from "../ObjectDesignPage";
import Categories from "@/components/objects/Categories";
import { makeSection } from "@/components/ObjectSections";
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
  it("coded objects point to the object editor without importing or rendering blocks, even with saved content", async () => {
    mocks.row.content = [{ id: "old", type: "free", parts: [] }];
    open(false);
    expect(await screen.findByRole("button", { name: "Edit Object" })).toBeInTheDocument();
    expect(mocks.importer).not.toHaveBeenCalled(); expect(mocks.writes).not.toHaveBeenCalled();
  });
  it("conversion requires confirmation and Cancel is inert", async () => {
    open(false);
    fireEvent.click(await screen.findByRole("button", { name: "Convert to Blocks (Appearance May Change)" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Visitors will keep seeing the original coded version");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.importer).not.toHaveBeenCalled(); expect(mocks.writes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Convert to Blocks (Appearance May Change)" }));
    fireEvent.click(screen.getByRole("button", { name: /^Convert to Blocks$/ }));
    await waitFor(() => expect(mocks.importer).toHaveBeenCalled(), { timeout: 4000 });
  });
  it("objects designed without a component key still open their saved block editor", async () => {
    mocks.row.component_key = null;
    mocks.row.content = [{ ...makeSection("free"), id: "saved", text: "Designed words" }];
    const r = open(); await waitFor(() => expect(r.container.querySelector("[data-block-id='saved']")).toBeTruthy());
    expect(r.container.querySelector(".inline-edit-surface")).toBeNull();
    expect(mocks.importer).not.toHaveBeenCalled();
  });
});