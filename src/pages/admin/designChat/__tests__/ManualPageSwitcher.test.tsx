import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ManualPageSwitcher, { useManualPageNavigation } from "../ManualPageSwitcher";
import { filterManualPages, manualPageAtPath, orderedManualPages, type ManualPage } from "../manualPageNavigation";

const m = vi.hoisted(() => ({ chat: null as any, dirty: false, objectOpen: false, save: vi.fn(), discard: vi.fn(), select: vi.fn(), start: vi.fn(), toast: vi.fn() }));
const pages: ManualPage[] = [
  { id: "about", name: "About", path: "/about", page_type: "static", build_status: "ready" },
  { id: "contact", name: "Contact", path: "/contact", page_type: "static", build_status: "ready" },
  { id: "draft", name: "Autumn", path: "/landing/autumn", page_type: "landing", build_status: "draft" },
];
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => m.chat }));
vi.mock("../EditorSlot", () => ({ useEditorSlot: () => ({ hasChanges: () => m.dirty, saveAll: m.save, discardAll: m.discard }) }));
vi.mock("../pageSelection", () => ({ loadManualPages: async () => pages, workingPageFrom: (p: any) => ({ id: p.id, name: p.name, path: p.path }) }));
vi.mock("sonner", () => ({ toast: (...args: unknown[]) => m.toast(...args) }));
function Harness() {
  const [page, setPage] = useState(pages[1]);
  const [finishing, setFinishing] = useState(false);
  m.chat = { workingPage: page, editing: true, objectOpen: m.objectOpen ? { id: "o" } : null,
    selectPage: (p: any) => { m.select(p); setPage(p); }, startEditing: m.start };
  const navigation = useManualPageNavigation(finishing, setFinishing);
  return <><ManualPageSwitcher navigation={navigation} /><button onClick={() => navigation.requestPath("/landing/autumn")}>Frame Navigation</button><button onClick={() => navigation.requestPath("/unknown")}>Unknown Navigation</button></>;
}
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks(); m.dirty = false; m.objectOpen = false; m.save.mockResolvedValue(true); m.discard.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function open() { render(<Harness />); await waitFor(() => expect(screen.getByRole("button", { name: "Next Page" })).not.toBeDisabled()); }
describe("manual page order and path rules", () => {
  it("orders Pages before Landing Pages, alphabetically inside each group", () => {
    expect(orderedManualPages([pages[2], pages[1], pages[0]]).map(p => p.id)).toEqual(["about", "contact", "draft"]);
  });
  it("filters by name and path", () => {
    expect(filterManualPages(pages, "CONTACT").map(p => p.id)).toEqual(["contact"]);
    expect(filterManualPages(pages, "/landing/").map(p => p.id)).toEqual(["draft"]);
  });
  it.each(["https://example.com", "//example.com", "/manage", "/manage/pages", "/%6danage/pages", "/%2fexample.com", "/a/../manage", "/a\\b", "/unknown", "/about?x=1", "/about#x"])('rejects unsafe or unknown path "%s"', path => {
    expect(manualPageAtPath(pages, path)).toBeNull();
  });
  it("accepts draft landing pages and the home alias", () => {
    expect(manualPageAtPath(pages, "/landing/autumn")?.id).toBe("draft");
    expect(manualPageAtPath([{ ...pages[0], path: "/" }], "/home")?.id).toBe("about");
  });
});
describe("manual page navigation", () => {
  it("steps across groups and keeps Manual Edit Mode, focusing the new heading", async () => {
    await open(); fireEvent.click(screen.getByRole("button", { name: "Next Page" }));
    expect(m.select).toHaveBeenCalledWith({ id: "draft", name: "Autumn", path: "/landing/autumn" });
    expect(m.start).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Editing Autumn" })).toHaveFocus());
    expect(screen.getByRole("button", { name: "Next Page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous Page" }));
    expect(m.select).toHaveBeenLastCalledWith({ id: "contact", name: "Contact", path: "/contact" });
  });
  it("opens grouped searchable rows including Draft pages and filters by path", async () => {
    await open(); fireEvent.click(screen.getByRole("button", { name: "Editing Contact" }));
    expect(await screen.findByText("Landing Pages")).toBeVisible();
    expect(screen.getByText("Pages", { exact: true })).toBeVisible();
    expect(screen.getByText("Draft", { exact: true })).toBeVisible();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "/landing" } });
    expect(screen.queryByRole("option", { name: /Contact/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Autumn/ }));
    expect(m.select).toHaveBeenCalledWith({ id: "draft", name: "Autumn", path: "/landing/autumn" });
  });
  it("uses arrows and Enter to choose and Escape to close", async () => {
    await open(); fireEvent.click(screen.getByRole("button", { name: "Editing Contact" }));
    const input = await screen.findByRole("combobox");
    fireEvent.keyDown(input, { key: "End" }); fireEvent.keyDown(input, { key: "ArrowUp" }); fireEvent.keyDown(input, { key: "ArrowUp" }); fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(m.select).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Editing/ }));
    fireEvent.keyDown(await screen.findByRole("combobox"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());
  });
  it.each(["Save Changes", "Discard Changes", "Keep Editing"])("protects unsaved edits with %s", async action => {
    m.dirty = true; await open(); fireEvent.click(screen.getByRole("button", { name: "Next Page" }));
    expect(screen.getByRole("dialog", { name: "Save Your Changes?" })).toBeVisible();
    expect(m.select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: action }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    if (action === "Keep Editing") { expect(m.select).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.discard).not.toHaveBeenCalled(); }
    else { expect(m.select).toHaveBeenCalledWith({ id: "draft", name: "Autumn", path: "/landing/autumn" }); expect(action === "Save Changes" ? m.save : m.discard).toHaveBeenCalledOnce(); }
  });
  it("stays on the same page after a failed save", async () => {
    m.dirty = true; m.save.mockResolvedValue(false); await open();
    fireEvent.click(screen.getByRole("button", { name: "Next Page" })); fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(m.save).toHaveBeenCalledOnce());
    expect(m.select).not.toHaveBeenCalled(); expect(screen.getByRole("heading", { name: "Editing Contact", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("uses the same unsaved dialog for frame navigation and reports unknown pages", async () => {
    m.dirty = true; await open(); fireEvent.click(screen.getByRole("button", { name: "Unknown Navigation" }));
    expect(m.toast).toHaveBeenCalledWith("That page isn't in the Site Manager."); expect(m.select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Frame Navigation" }));
    expect(screen.getByRole("dialog", { name: "Save Your Changes?" })).toBeVisible();
  });
  it("disables page changes while an object is open", async () => {
    m.objectOpen = true; render(<Harness />);
    expect(screen.getByRole("button", { name: "Editing Contact" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next Page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Frame Navigation" })); expect(m.select).not.toHaveBeenCalled();
  });
  it("disables navigation until saving finishes", async () => {
    let finish: (ok: boolean) => void = () => {};
    m.dirty = true; m.save.mockImplementation(() => new Promise<boolean>(resolve => { finish = resolve; }));
    await open(); fireEvent.click(screen.getByRole("button", { name: "Next Page" })); fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(screen.getByRole("button", { name: "Editing Contact", hidden: true })).toBeDisabled(); expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
    finish(true); await waitFor(() => expect(m.select).toHaveBeenCalledOnce());
  });
});