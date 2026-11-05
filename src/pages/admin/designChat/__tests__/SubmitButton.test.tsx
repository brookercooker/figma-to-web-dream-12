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

describe("Submit for Review", () => {
  it.each(["draft", "publish"])("blocks %s undo-pending even when review is otherwise allowed", (location) => {
    m.state.publish.willReview = true;
    if (location === "draft") m.state.draft = { gate: { status: "undo-pending", reason: "Wait for the rejected change to be undone." } };
    else Object.assign(m.state.publish, { status: "undo-pending", reason: "Wait for the rejected change to be undone." });
    render(<SubmitButton />);
    expect(screen.getByRole("button", { name: "Submit for Review" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Wait for the rejected change to be undone.");
  });
  it("blocks a confirmation already open when the undo gate arrives", () => {
    m.state.draft = { gate: { status: "undo-pending", reason: "Undo not ready." } };
    render(<SubmitConfirmDialog open onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    expect(m.post).not.toHaveBeenCalled();
  });
  it.each([false, true])("asks for confirmation before submitting when compact=%s", async (compact) => {
    render(<SubmitButton compact={compact} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(m.post).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Submit for Review" }));
    await vi.waitFor(() => expect(m.refresh).toHaveBeenCalledTimes(1));
    expect(m.post).toHaveBeenCalledExactlyOnceWith("/publish");
  });
  it("explains the automatic review, the developer fallback and that approved changes go public", async () => {
    render(<SubmitButton />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Your 1 change will be reviewed automatically");
    expect(dialog).toHaveTextContent("anything it can't approve may go to a developer");
    expect(dialog).toHaveTextContent("Approved changes are put on the public site.");
  });
  it("shows the checklist as a plain bulleted list with nothing to tick", async () => {
    render(<SubmitButton />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).queryAllByRole("checkbox")).toHaveLength(0);
    const list = within(dialog).getByRole("list", { name: "Submission Checklist" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(SUBMIT_CHECKLIST.length);
    expect(within(dialog).getByRole("button", { name: "Submit for Review" })).toBeEnabled();
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
    expect(within(dialog).getByRole("button", { name: "Publish" })).toBeEnabled();
    cleanup();
    render(<SubmitButton />);
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });
});
