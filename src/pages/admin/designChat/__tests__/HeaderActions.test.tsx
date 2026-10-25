import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeaderActions from "../HeaderActions";
const m = vi.hoisted(() => ({ state: null as any, editing: false, post: vi.fn(), refresh: vi.fn(), copy: vi.fn() }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({ state: m.state, editing: m.editing, refreshSoon: m.refresh, previewLocation: { path: "/draft" }, workingPage: null }) }));
vi.mock("../helper", () => ({ postToHelper: m.post }));
beforeEach(() => {
  vi.clearAllMocks(); m.editing = false;
  m.state = { busy: false, history: [{ role: "user", text: "Add an image" }], publish: { ok: true, open: 2 } };
  m.post.mockResolvedValue({ ok: true }); m.copy.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: m.copy } });
});
afterEach(cleanup);
describe("Left-header actions", () => {
  it("uses the existing pending count and exactly the existing submission action", async () => {
    const view = render(<HeaderActions />);
    fireEvent.click(screen.getByRole("button", { name: "Review Status: 2 Waiting" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    await waitFor(() => expect(m.post).toHaveBeenCalledExactlyOnceWith("/publish"));
    expect(m.refresh).toHaveBeenCalledOnce();
    m.state.publish.open = 3; view.rerender(<HeaderActions />);
    expect(screen.getByRole("button", { name: "Review Status: 3 Waiting" })).toBeInTheDocument();
  });
  it("has no undo when no changes are pending", () => {
    m.state.publish.open = 0; render(<HeaderActions />);
    expect(screen.getByRole("button", { name: "Undo Last Change" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Review Status" })).toBeInTheDocument();
  });
  it("opens an honest confirmation without calling an invented undo endpoint", () => {
    render(<HeaderActions />);
    fireEvent.click(screen.getByRole("button", { name: "Undo Last Change" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo Change" })).toBeDisabled();
    expect(m.post).not.toHaveBeenCalled();
  });
  it("never substitutes whole-session discard for single-change undo or submits held manual edits", () => {
    m.editing = true; render(<HeaderActions />);
    expect(screen.getByRole("button", { name: "Undo Last Change" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Review Status: 2 Waiting" }));
    expect(screen.queryByRole("button", { name: "Submit for Review" })).toBeNull();
  });
  it("copies the current page and last recorded action for a problem report", async () => {
    render(<HeaderActions />);
    fireEvent.click(screen.getByRole("button", { name: "Help" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy Problem Summary" }));
    await waitFor(() => expect(m.copy).toHaveBeenCalledOnce());
    expect(m.copy.mock.calls[0][0]).toContain("Page: /draft");
    expect(m.copy.mock.calls[0][0]).toContain("Last action: Add an image");
  });
});