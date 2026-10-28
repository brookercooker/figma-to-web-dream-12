import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ModeToggle from "../ModeToggle";
import { ModeSwitchProvider } from "../ModeSwitchContext";
import { registerPreviewPage } from "../usePreviewPage";

const m = vi.hoisted(() => ({ chat: null as any, preview: {} as any, dirty: false, busy: false, open: 0, status: "", initial: "chat", page: { id: "home", name: "Homepage", path: "/" } as any, save: vi.fn(), discard: vi.fn(), select: vi.fn(), start: vi.fn(), stop: vi.fn() }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => m.chat }));
vi.mock("../EditorSlot", () => ({ useEditorSlot: () => ({ hasChanges: () => m.dirty, saveAll: m.save, discardAll: m.discard }) }));
vi.mock("../pageSelection", () => ({ workingPageFrom: (page: any) => page, loadModePages: async () => [{ id: "chosen", name: "About", path: "/about" }] }));
vi.mock("../usePreviewPage", () => ({ registerPreviewPage: vi.fn() }));
function Harness({ collapsed = false }: { collapsed?: boolean }) {
  const [mode, setMode] = useState(m.initial);
  const [page, setPage] = useState(m.page);
  m.chat = { ...m.preview, mode, editing: mode === "manual", workingPage: page, state: { busy: m.busy, publish: { open: m.open, status: m.status } },
    selectPage: (next: any) => { m.select(next); setPage(next); }, startEditing: () => { m.start(); setMode("manual"); }, stopEditing: () => { m.stop(); setMode("chat"); } };
  return <ModeSwitchProvider><ModeToggle collapsed={collapsed} onChat={() => {}} /></ModeSwitchProvider>;
}
beforeEach(() => { vi.clearAllMocks(); m.preview = {}; m.initial = "chat"; m.page = { id: "home", name: "Homepage", path: "/" }; m.dirty = false; m.busy = false; m.open = 0; m.status = ""; m.save.mockResolvedValue(true); });
afterEach(cleanup);
const open = (collapsed = false) => render(<MemoryRouter><Harness collapsed={collapsed} /></MemoryRouter>);
const chat = () => screen.getByRole("radio", { name: "Chat Mode", hidden: true });
const manual = () => screen.getByRole("radio", { name: "Manual Edit Mode", hidden: true });
describe("segmented mode switch", () => {
  it("opens the viewed row instead of a stale working page", async () => {
    const viewed = { id: "about", name: "About", path: "/about" };
    m.preview = { previewLocation: { path: "/about", search: "" }, previewPage: viewed };
    open(); fireEvent.click(manual());
    await waitFor(() => expect(m.select).toHaveBeenCalledWith(viewed));
    expect(m.start).toHaveBeenCalledTimes(1);
    expect(registerPreviewPage).not.toHaveBeenCalled();
  });
  it("registers the viewed page when it has no row", async () => {
    const viewed = { name: "Team", path: "/team" };
    const registered = { ...viewed, id: "team" };
    vi.mocked(registerPreviewPage).mockResolvedValueOnce(registered as any);
    m.preview = { previewLocation: { path: "/team", search: "" }, previewPage: null, previewPageLoading: false, previewRegistrable: viewed };
    open(); fireEvent.click(manual());
    await waitFor(() => expect(m.select).toHaveBeenCalledWith(registered));
    expect(registerPreviewPage).toHaveBeenCalledWith(viewed);
    expect(m.start).toHaveBeenCalledTimes(1);
  });
  it.each(["/", "/home"])("opens the same home row for viewed address %s", async (path) => {
    const home = { id: "home", name: "Homepage", path: "/" };
    m.page = { id: "about", name: "About", path: "/about" };
    m.preview = { previewLocation: { path, search: "" }, previewPage: home };
    open(); fireEvent.click(manual());
    await waitFor(() => expect(m.select).toHaveBeenCalledWith(home));
    expect(registerPreviewPage).not.toHaveBeenCalled();
  });
  it.each(["notFound", "uneditable"])("falls back to the working page for a %s viewed address", async (kind) => {
    m.preview = { previewLocation: { path: "/manage", search: "", notFound: kind === "notFound" }, previewPage: null, previewRegistrable: null, previewPageLoading: false };
    open(); fireEvent.click(manual());
    await waitFor(() => expect(m.select).toHaveBeenCalledWith(m.page));
  });
  it("waits for the viewed page to settle and ignores a double press", async () => {
    m.preview = { previewLocation: { path: "/team", search: "" }, previewPage: null, previewPageLoading: true };
    const rendered = open(); fireEvent.click(manual()); fireEvent.click(manual());
    expect(m.start).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const viewed = { id: "team", name: "Team", path: "/team" };
    m.preview = { ...m.preview, previewPage: viewed, previewPageLoading: false };
    rendered.rerender(<MemoryRouter><Harness /></MemoryRouter>);
    await waitFor(() => expect(m.select).toHaveBeenCalledWith(viewed));
    expect(m.select).toHaveBeenCalledTimes(1); expect(m.start).toHaveBeenCalledTimes(1);
  });
  it("opens the chooser after three seconds of unresolved loading, not the stale working page", async () => {
    m.preview = { previewLocation: { path: "/team", search: "" }, previewPage: null, previewPageLoading: true };
    open(); fireEvent.click(manual());
    await screen.findByRole("dialog", { name: "Choose a Page" }, { timeout: 4000 });
    expect(m.select).not.toHaveBeenCalled(); expect(m.start).not.toHaveBeenCalled();
    expect(chat()).toHaveAttribute("aria-checked", "true");
  });
  it("opens a viewed page exactly once on rapid double presses", async () => {
    const viewed = { id: "about", name: "About", path: "/about" };
    m.preview = { previewLocation: { path: "/about", search: "" }, previewPage: viewed };
    open(); fireEvent.click(manual()); fireEvent.click(manual());
    await waitFor(() => expect(m.start).toHaveBeenCalledTimes(1));
    expect(m.select).toHaveBeenCalledTimes(1);
  });
  it("has one selected mode, ignores selected clicks and switches working page only", async () => {
    open(); expect(chat()).toHaveAttribute("aria-checked", "true"); expect(manual()).toHaveAttribute("aria-checked", "false");
    fireEvent.click(chat()); expect(m.stop).not.toHaveBeenCalled();
    fireEvent.click(manual()); await waitFor(() => expect(manual()).toHaveAttribute("aria-checked", "true"));
    expect(manual()).toHaveClass("data-[state=on]:bg-primary"); expect(m.select).toHaveBeenCalledWith(m.page);
    fireEvent.click(manual()); expect(m.start).toHaveBeenCalledTimes(1);
    fireEvent.click(chat()); await waitFor(() => expect(chat()).toHaveAttribute("aria-checked", "true"));
    expect(chat()).toHaveClass("data-[state=on]:bg-primary"); expect(manual()).toHaveAttribute("aria-checked", "false");
  });
  it("arrow keys select the other segment without allowing deselection", async () => {
    open(); chat().focus(); fireEvent.keyDown(chat(), { key: "ArrowRight" });
    await waitFor(() => expect(manual()).toHaveAttribute("aria-checked", "true"));
    fireEvent.keyDown(manual(), { key: "ArrowLeft" }); await waitFor(() => expect(chat()).toHaveAttribute("aria-checked", "true"));
  });
  it.each([false, true])("uses identical selected styles for both segments, collapsed=%s", async (collapsed) => {
    open(collapsed);
    const selectedClasses = (element: HTMLElement) => [...element.classList].filter((name) => name.startsWith("data-[state=on]:"));
    const chatClasses = selectedClasses(chat());
    fireEvent.click(manual()); await waitFor(() => expect(manual()).toHaveAttribute("aria-checked", "true"));
    expect(selectedClasses(manual())).toEqual(chatClasses);
    expect(manual()).toHaveClass("data-[state=on]:bg-primary", "data-[state=on]:text-primary-foreground");
    expect(manual().className).not.toContain("bg-manual");
  });
  it("shows two labelled icon choices when collapsed", () => {
    open(true); expect(chat()).toHaveAttribute("title", "Chat Mode"); expect(manual()).toHaveAttribute("title", "Manual Edit Mode");
    expect(chat().querySelector("svg")).toBeTruthy(); expect(manual().querySelector("svg")).toBeTruthy();
    expect(chat()).not.toHaveTextContent("Chat Mode");
  });
  it("chooses a page only on explicit selection and cancellation stays in chat", async () => {
    m.page = null; open(); fireEvent.click(manual());
    await screen.findByRole("dialog", { name: "Choose a Page" }); expect(chat()).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" })); expect(m.start).not.toHaveBeenCalled();
    fireEvent.click(manual()); fireEvent.click(await screen.findByRole("button", { name: /About/ }));
    await waitFor(() => expect(manual()).toHaveAttribute("aria-checked", "true")); expect(m.select).toHaveBeenCalledWith({ id: "chosen", name: "About", path: "/about" });
  });
  it.each(["Save And Switch", "Discard And Switch", "Keep Editing"])("preserves the unsaved guard: %s", async (choice) => {
    m.initial = "manual"; m.dirty = true; open(); fireEvent.click(chat());
    expect(screen.getByRole("alertdialog")).toBeVisible(); expect(manual()).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: choice }));
    await waitFor(() => expect(choice === "Keep Editing" ? manual() : chat()).toHaveAttribute("aria-checked", "true"));
    expect(m.save).toHaveBeenCalledTimes(choice === "Save And Switch" ? 1 : 0); expect(m.discard).toHaveBeenCalledTimes(choice === "Discard And Switch" ? 1 : 0);
  });
  it("failed save keeps manual selected and shows the reason", async () => {
    m.initial = "manual"; m.dirty = true; m.save.mockResolvedValue(false); open(); fireEvent.click(chat()); fireEvent.click(screen.getByText("Save And Switch"));
    await screen.findByRole("alert"); expect(manual()).toHaveAttribute("aria-checked", "true"); expect(m.stop).not.toHaveBeenCalled();
  });
  it.each(["busy", "review"])("confirms Claude %s before changing the highlight", async (kind) => {
    m.busy = kind === "busy"; m.open = kind === "review" ? 1 : 0; m.status = kind === "review" ? "reviewing" : ""; open(); fireEvent.click(manual());
    expect(screen.getByRole("alertdialog")).toBeVisible(); expect(chat()).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByText(kind === "busy" ? "Continue Editing" : "Keep Editing")); await waitFor(() => expect(manual()).toHaveAttribute("aria-checked", "true"));
  });
});