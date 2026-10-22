import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ editing: false, add: vi.fn() }));
vi.mock("../designChat/DesignChatContext", () => ({
  DesignChatProvider: ({ children }: any) => children,
  useDesignChat: () => ({ workingPage: null, editing: m.editing, stopEditing: vi.fn(), clearWorkingPage: vi.fn(), objectOpen: null, closeObject: vi.fn(),
    refs: { references: [], addReference: m.add, removeReference: vi.fn(), clearReferences: vi.fn(), focusTick: 0 } }),
}));
vi.mock("../designChat/EditorSlot", () => ({ EditorSlotProvider: ({ children }: any) => children,
  useEditorSlot: () => ({ setSlot: vi.fn(), saveAll: vi.fn(async () => true), discardAll: vi.fn(), hasChanges: () => false }) }));
vi.mock("../designChat/ChatPanel", () => ({ default: () => <div>chat</div> }));
vi.mock("../designChat/PreviewTools", () => ({ default: () => null, SubmitButton: () => null }));
vi.mock("../designChat/LibraryPicker", () => ({ default: ({ label, onPick, onOpenFull }: any) => (
  <span><button aria-haspopup="dialog" aria-label={label} onClick={() => onPick({ kind: "image", id: "x", name: "X", url: "u", labels: [] })}>{label}</button>
    <button onClick={onOpenFull}>Open {label} page</button></span>) }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }));
for (const tab of ["PagesTab", "ObjectsTab", "ImagesTab", "VideoTab", "DesignChatTab", "DesignTab", "ObjectDesignPage"]) vi.doMock(`../${tab}`, () => ({ default: () => null }));

import AdminIndex from "../AdminIndex";

function Where() { return <p data-testid="where">{useLocation().pathname}</p>; }
const open = () => render(<MemoryRouter initialEntries={["/manage/pages"]}><Routes><Route path="/manage/*" element={<><AdminIndex /><Where /></>} /></Routes></MemoryRouter>);

beforeEach(() => {
  m.editing = false; m.add.mockClear();
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} };
  localStorage.setItem("siteManager:chatCollapsed", "true");
});
afterEach(cleanup);

describe("top bar library buttons", () => {
  it("Images picks for the chat instead of navigating, and expands the chat", async () => {
    open();
    expect(screen.getByRole("button", { name: "Expand Chat" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Images" }));
    expect(m.add).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/pages");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Expand Chat" })).toBeNull());
  });
  it("Open Images page navigates", () => {
    open();
    fireEvent.click(screen.getByText("Open Images page"));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/images");
  });
  it("while editing by hand, the three buttons navigate as before", () => {
    m.editing = true;
    open();
    expect(screen.queryByText("Open Videos page")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/videos");
    expect(m.add).not.toHaveBeenCalled();
  });
  it("Preview and Pages still navigate", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/preview");
    fireEvent.click(screen.getByRole("button", { name: "Pages" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/pages");
  });
});
