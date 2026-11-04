import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubmitButton, SubmitConfirmDialog, SUBMIT_CHECKLIST } from "../PreviewTools";

const m = vi.hoisted(() => ({ state: null as any, post: vi.fn(), refresh: vi.fn() }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({ state: m.state, refreshSoon: m.refresh }) }));
vi.mock("../helper", () => ({ postToHelper: m.post }));
beforeEach(() => {
  vi.clearAllMocks();
  m.state = { busy: false, publish: { ok: true, open: 1 }, review: { enabled: true } };
  m.post.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

const tickAll = (dialog: HTMLElement) => { for (const box of within(dialog).getAllByRole("checkbox")) fireEvent.click(box); };

describe("Submit for Review", () => {
  it.each([false, true])("asks for confirmation before submitting when compact=%s", async (compact) => {
    render(<SubmitButton compact={compact} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(m.post).not.toHaveBeenCalled();
    tickAll(dialog);
    fireEvent.click(within(dialog).getByRole("button", { name: "Submit for Review" }));
    await vi.waitFor(() => expect(m.refresh).toHaveBeenCalledTimes(1));
    expect(m.post).toHaveBeenCalledExactlyOnceWith("/publish");
  });
  it("explains what submitting does and that approved changes go on the public site", async () => {
    render(<SubmitButton />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("sends all 1 change waiting in your draft to a reviewer");
    expect(dialog).toHaveTextContent("Any changes that are approved will be put on the public site.");
  });
  it("keeps the confirm button off until every checklist item is ticked", async () => {
    render(<SubmitButton />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    const boxes = within(dialog).getAllByRole("checkbox");
    expect(boxes).toHaveLength(SUBMIT_CHECKLIST.length);
    const confirm = within(dialog).getByRole("button", { name: "Submit for Review" });
    expect(confirm).toBeDisabled();
    boxes.slice(0, -1).forEach((box) => fireEvent.click(box));
    expect(confirm).toBeDisabled();
    fireEvent.click(boxes[boxes.length - 1]);
    expect(confirm).toBeEnabled();
  });
  it("Cancel closes the dialog without submitting", async () => {
    render(<SubmitButton />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(m.post).not.toHaveBeenCalled();
  });
  it("lets a host keep the dialog when onRequestSubmit is passed", () => {
    const request = vi.fn();
    render(<SubmitButton onRequestSubmit={request} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    expect(request).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it.each(["idle", "busy", "blocked", "unavailable"])("keeps submission disabled when %s", (reason) => {
    if (reason === "idle") m.state.publish.open = 0;
    if (reason === "busy") m.state.busy = true;
    if (reason === "blocked") m.state.publish.ok = false;
    if (reason === "unavailable") m.state = null;
    render(<SubmitButton />);
    expect(screen.getByRole("button", { name: "Submit for Review" })).toBeDisabled();
  });
  it("retains Publish when review is off, and says it goes live right away", async () => {
    m.state.review.enabled = false;
    render(<SubmitConfirmDialog open onOpenChange={() => {}} />);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("on the public site right away");
    expect(within(dialog).getByRole("button", { name: "Publish" })).toBeDisabled();
    cleanup();
    render(<SubmitButton />);
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });
});
