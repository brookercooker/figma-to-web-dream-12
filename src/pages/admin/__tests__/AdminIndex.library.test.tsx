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
    <button onClick={onOpenFull}>Manage {label}</button></span>) }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }));
for (const tab of ["PagesTab", "ObjectsTab", "ImagesTab", "VideoTab", "DesignChatTab", "DesignTab", "ObjectDesignPage"]) vi.doMock(`../${tab}`, () => ({ default: () => null }));

import AdminIndex from "../AdminIndex";

function Where() { return <p data-testid="where">{useLocation().pathname}</p>; }
const open = (at = "/manage/preview") => render(<MemoryRouter initialEntries={[at]}><Routes><Route path="/manage/*" element={<><AdminIndex /><Where /></>} /></Routes></MemoryRouter>);

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
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/preview");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Expand Chat" })).toBeNull());
  });
  it("on a management page, Objects/Images/Videos navigate instead of opening the picker", () => {
    for (const from of ["/manage/pages", "/manage/objects", "/manage/images", "/manage/videos"]) {
      open(from);
      expect(screen.queryByText("Manage Images")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Images" }));
      expect(screen.getByTestId("where")).toHaveTextContent("/manage/images");
      cleanup();
    }
    expect(m.add).not.toHaveBeenCalled();
  });
  it("Manage Images navigates", () => {
    open();
    fireEvent.click(screen.getByText("Manage Images"));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/images");
  });
  it("while editing by hand, the three buttons navigate as before", () => {
    m.editing = true;
    open();
    expect(screen.queryByText("Manage Videos")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/videos");
    expect(m.add).not.toHaveBeenCalled();
  });
  it("Preview and Tools Pages still navigate", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/preview");
    fireEvent.keyDown(screen.getByRole("button", { name: "Tools" }), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Pages" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/pages");
    expect(screen.getByRole("button", { name: "Tools" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Tools" })).toHaveAttribute("aria-pressed", "true");
  });
  it.each([false, true])("Tools Capture preserves its destination while editing=%s", async (editing) => {
    m.editing = editing;
    open();
    expect(screen.queryByRole("button", { name: "Pages" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Capture" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("button", { name: "Tools" }), { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Capture" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/manage/capture");
  });
  it.each([false, true])("keeps Tools keyboard access in the left header when collapsed=%s", async (collapsed) => {
    localStorage.setItem("siteManager:chatCollapsed", String(collapsed));
    open();
    const tools = screen.getByRole("button", { name: "Tools" });
    expect(tools).toBeVisible();
    expect(tools).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector("[data-chat-header]")).toContainElement(tools);
    expect(document.querySelector("[data-top-bar]")).not.toContainElement(tools);
    fireEvent.keyDown(tools, { key: "ArrowDown" });
    expect(await screen.findByRole("menuitem", { name: "Pages" })).toBeVisible();
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Pages" }), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Pages" })).toBeNull());
    await waitFor(() => expect(tools).toHaveFocus());
  });
});
