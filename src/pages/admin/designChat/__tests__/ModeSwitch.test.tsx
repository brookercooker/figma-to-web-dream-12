import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModeSwitchProvider, useModeSwitch } from "../ModeSwitchContext";

const m = vi.hoisted(() => ({ editing: true, busy: false, open: 0, dirty: true, save: vi.fn(), discard: vi.fn(), stop: vi.fn(), enter: vi.fn(), result: vi.fn() }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({ editing: m.editing, stopEditing: m.stop, state: { busy: m.busy, publish: { open: m.open } } }) }));
vi.mock("../EditorSlot", () => ({ useEditorSlot: () => ({ hasChanges: () => m.dirty, saveAll: m.save, discardAll: m.discard }) }));
function Controls() {
  const guard = useModeSwitch();
  return <><button onClick={async () => m.result(await guard?.requestChat())}>Chat Mode</button><button onClick={() => void guard?.requestManual(m.enter)}>Manual Edit Mode</button></>;
}
const open = () => render(<ModeSwitchProvider><Controls /></ModeSwitchProvider>);
beforeEach(() => { vi.clearAllMocks(); m.editing = true; m.busy = false; m.open = 0; m.dirty = true; m.save.mockResolvedValue(true); });
afterEach(cleanup);
describe("mode switch safeguards", () => {
  it("switches immediately without unsaved edits", async () => {
    m.dirty = false; open(); fireEvent.click(screen.getByText("Chat Mode"));
    await waitFor(() => expect(m.result).toHaveBeenCalledWith(true));
    expect(m.stop).toHaveBeenCalledTimes(1); expect(m.save).not.toHaveBeenCalled(); expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("saves before switching", async () => {
    open(); fireEvent.click(screen.getByText("Chat Mode"));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("You Have Unsaved Edits.");
    expect(m.stop).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Save And Switch"));
    await waitFor(() => expect(m.result).toHaveBeenCalledWith(true));
    expect(m.save).toHaveBeenCalledTimes(1); expect(m.stop).toHaveBeenCalledTimes(1); expect(m.discard).not.toHaveBeenCalled();
  });
  it("discards before switching without saving", async () => {
    open(); fireEvent.click(screen.getByText("Chat Mode")); fireEvent.click(screen.getByText("Discard And Switch"));
    await waitFor(() => expect(m.result).toHaveBeenCalledWith(true));
    expect(m.discard).toHaveBeenCalledTimes(1); expect(m.stop).toHaveBeenCalledTimes(1); expect(m.save).not.toHaveBeenCalled();
  });
  it("keeps editing without saving or discarding", async () => {
    open(); fireEvent.click(screen.getByText("Chat Mode")); fireEvent.click(screen.getByText("Keep Editing"));
    await waitFor(() => expect(m.result).toHaveBeenCalledWith(false));
    expect(m.stop).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled(); expect(m.discard).not.toHaveBeenCalled();
  });
  it.each([false, "throw"])("stays manual when saving fails (%s)", async (failure) => {
    if (failure === "throw") m.save.mockRejectedValue(new Error("private detail")); else m.save.mockResolvedValue(false);
    open(); fireEvent.click(screen.getByText("Chat Mode")); fireEvent.click(screen.getByText("Save And Switch"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("You are still in Manual Edit Mode"));
    expect(screen.getByRole("alertdialog")).toBeVisible(); expect(m.stop).not.toHaveBeenCalled(); expect(m.result).not.toHaveBeenCalled();
  });
  it.each(["busy", "review"])("requires confirmation before editing with Claude %s", async (kind) => {
    m.editing = false; m.busy = kind === "busy"; m.open = kind === "review" ? 1 : 0;
    open(); fireEvent.click(screen.getByText("Manual Edit Mode")); expect(m.enter).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Cancel")); expect(m.enter).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Manual Edit Mode")); fireEvent.click(screen.getByText("Continue Editing"));
    await waitFor(() => expect(m.enter).toHaveBeenCalledTimes(1));
  });
});