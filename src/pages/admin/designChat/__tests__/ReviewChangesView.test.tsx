import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewChangesView from "../ReviewChangesView";
const m = vi.hoisted(() => ({ state: null as any, setReviewOpen: vi.fn(), show: vi.fn(), post: vi.fn(), admin: false }));
vi.mock("@/prototype/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: "staff" } } }) },
  rpc: async () => ({ data: m.admin }),
} }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({ state: m.state, refreshSoon: vi.fn(), setReviewOpen: m.setReviewOpen, showPreviewPath: m.show }) }));
vi.mock("../helper", () => ({ postToHelper: m.post }));
const now = Date.now();
const reqs = [
  { id: "a", request: "Make the headline larger", source: "chat", at: now - 3600_000, files: ["x"] },
  { id: "b", request: "Edits made in the Site Manager: changed the hero text", source: "content", at: now - 60_000, page: { name: "Experiment", path: "/draft/experiment" } },
  { id: "c", request: "Developer tweak", source: "developer", at: now - 7200_000 },
  { id: "d", request: "Dependency update", source: "chat", at: now - 10_800_000, files: [], siteFiles: [], platformFiles: ["p"] },
];
beforeEach(() => { vi.clearAllMocks(); m.admin = false; m.state = { busy: false, history: [], publish: { ok: true, open: 4 }, draft: { requests: reqs } }; });
afterEach(cleanup);
const cards = () => Array.from(document.querySelectorAll("[data-change-id]")) as HTMLElement[];
describe("Changes waiting for review", () => {
  it("shows the undo gate reason and prevents submission", () => {
    m.state.draft.gate = { status: "undo-pending", reason: "The undo has not landed." };
    m.state.publish.willReview = true;
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Submit for Review" })).toBeDisabled();
    expect(screen.getAllByText("The undo has not landed.").length).toBeGreaterThan(0);
  });
  it("labels undo requests and marks requests waiting for their undo", () => {
    m.state.draft.requests = [{ ...reqs[0], undoPending: true }, { ...reqs[1], isUndo: true }];
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(within(cards().find(c => c.dataset.changeId === "a") as HTMLElement).getByText("Undo Not in Yet")).toBeInTheDocument();
    const undo = cards().find(c => c.dataset.changeId === "b") as HTMLElement;
    expect(within(undo).getByText("Developer Undo")).toBeInTheDocument();
    expect(within(undo).queryByText("Manual Edit")).toBeNull();
  });
  const openRejection = async () => {
    m.admin = true;
    m.state.publish.status = "blocked";
    m.state.draft.review = { state: "failure", findings: [] };
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Reject Changes" }));
    const dialog = screen.getByRole("alertdialog");
    return { input: within(dialog).getByRole("textbox", { name: "Reason" }), action: within(dialog).getByRole("button", { name: "Reject Changes" }) };
  };
  it("requires at least three trimmed reason characters before posting the reason", async () => {
    m.post.mockResolvedValue({ ok: true, data: { id: "undo", undoing: 2, kept: 0 } });
    const { input, action } = await openRejection();
    expect(action).toBeDisabled();
    fireEvent.change(input, { target: { value: " ab " } });
    expect(action).toBeDisabled();
    fireEvent.click(action);
    expect(m.post).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: " abc " } });
    expect(action).toBeEnabled();
    fireEvent.click(action);
    await waitFor(() => expect(m.post).toHaveBeenCalledWith("/reject", { reason: "abc" }));
    expect(await screen.findByText("Undoing 2 requests. The undo will join the draft.")).toHaveAttribute("role", "status");
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
  it("bounds the reason input at 300 characters and accepts that length", async () => {
    m.post.mockResolvedValue({ ok: true, data: { undoing: 1, kept: 0 } });
    const { input, action } = await openRejection();
    expect(input).toHaveAttribute("maxlength", "300");
    fireEvent.change(input, { target: { value: "x".repeat(300) } });
    expect(action).toBeEnabled();
    fireEvent.click(action);
    await waitFor(() => expect(m.post).toHaveBeenCalledWith("/reject", { reason: "x".repeat(300) }));
    expect(await screen.findByText("Undoing 1 request. The undo will join the draft.")).toHaveAttribute("role", "status");
  });
  it.each([0, 3])("reports undo counts and only explains kept Manual edits when positive (%s)", async (kept) => {
    m.post.mockResolvedValue({ ok: true, data: { id: "undo", undoing: 4, kept } });
    const { input, action } = await openRejection();
    fireEvent.change(input, { target: { value: "Not approved" } });
    fireEvent.click(action);
    const status = await screen.findByText(/^Undoing 4 requests\./);
    expect(status.textContent).toBe(`Undoing 4 requests. The undo will join the draft.${kept ? " 3 edits made in the Site Manager can't be undone here. Change them back in Manual Edit Mode." : ""}`);
  });
  it("keeps relay errors in the existing error line", async () => {
    m.post.mockResolvedValue({ ok: false, error: "A change is already in progress." });
    const { input, action } = await openRejection();
    fireEvent.change(input, { target: { value: "Not approved" } });
    fireEvent.click(action);
    expect(await screen.findByRole("alert")).toHaveTextContent("A change is already in progress.");
    expect(screen.queryByText(/^Undoing /)).toBeNull();
  });
  it("shows a rejected badge and reason without the decision author", () => {
    m.state.draft.requests = [{ ...reqs[0], decision: { reason: "Wrong direction", at: now, by: "Private author" } }, reqs[1]];
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    const rejected = document.querySelector('[data-change-id="a"]') as HTMLElement;
    expect(within(rejected).getByText("Chat Request")).toBeInTheDocument();
    expect(within(rejected).getByText("Rejected")).toBeInTheDocument();
    expect(within(rejected).getByText("Reason: Wrong direction")).toBeInTheDocument();
    expect(screen.queryByText("Private author")).toBeNull();
    expect(within(cards()[0]).queryByText("Rejected")).toBeNull();
  });
  it.each([undefined, null, "rejected", [], { reason: 7 }, { reason: "  " }])("ignores absent or malformed decisions (%j)", (decision) => {
    m.state.draft.requests = [{ ...reqs[0], decision }];
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(screen.getByText("Make the headline larger")).toBeInTheDocument();
    expect(screen.queryByText("Rejected")).toBeNull();
    expect(screen.queryByText(/^Reason:/)).toBeNull();
  });
  it("lists relay requests newest first with source badges", () => {
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(cards().map((c) => c.dataset.changeId)).toEqual(["b", "a", "c", "d"]);
    expect(within(cards()[0]).getByText("Manual Edit")).toBeInTheDocument();
    expect(within(cards()[0]).getByText("Edits Made in the Site Manager")).toBeInTheDocument();
    expect(within(cards()[0]).getByText("changed the hero text")).toBeInTheDocument();
    expect(within(cards()[0]).getByText(/Page: Experiment/)).toBeInTheDocument();
    expect(within(cards()[1]).getByText("Chat Request")).toBeInTheDocument();
    expect(within(cards()[1]).queryByText(/Page:/)).toBeNull();
    expect(within(cards()[2]).getByText("Developer Edit")).toBeInTheDocument();
    expect(within(cards()[3]).getByText("Automatic Update")).toBeInTheDocument();
    expect(screen.getByText(/4 changes are waiting for review/)).toBeInTheDocument();
  });
  it("toggles Show More on long requests", () => {
    m.state.draft.requests = [{ id: "l", request: "word ".repeat(80), source: "chat", at: now }];
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(screen.getByRole("button", { name: "Show Less" })).toHaveAttribute("aria-expanded", "true");
  });
  it("shows the count only for an older relay without requests", () => {
    m.state.draft = {}; m.state.publish.open = 2;
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(screen.getByText(/2 changes are waiting/)).toBeInTheDocument();
    expect(screen.getByText(/details aren't available/)).toBeInTheDocument();
    expect(cards()).toHaveLength(0);
  });
  it("says nothing is waiting and disables Submit when empty", () => {
    m.state.draft = { requests: [] }; m.state.publish.open = 0;
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(screen.getByText("Nothing is waiting for review.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit for Review" })).toBeDisabled();
  });
  it("Back to Chat closes the view", () => {
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Chat" }));
    expect(m.setReviewOpen).toHaveBeenCalledWith(false);
  });
  it("lists Site Manager details with Show all, keeping the page line", () => {
    const details = ["Homepage: changed the heading \"A\" to \"B\"", "L2", "L3", "L4", "L5", "L6"];
    m.state.draft.requests = [{ id: "s", request: "Edits made in the Site Manager: x (and 4 more)", source: "content", at: now, details, page: { name: "Homepage", path: "/" } }];
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    const list = screen.getByRole("list", { name: "What Changed" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByText(/and 4 more/)).toBeNull();
    expect(screen.getByText("Edits Made in the Site Manager")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all 6 changes" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getByText(/Page: Homepage/)).toBeInTheDocument();
  });
  it("falls back to the request text when details are empty, and lists chat details too", () => {
    m.state.draft.requests = [
      { id: "o", request: "Edits made in the Site Manager: changed the hero text", source: "content", at: now, details: [] },
      { id: "c", request: "Make it warmer", source: "chat", at: now - 1000, details: ["Homepage: warmer colours"] },
    ];
    render(<ReviewChangesView onShowPreview={vi.fn()} />);
    expect(within(cards()[0]).getByText("changed the hero text")).toBeInTheDocument();
    expect(within(cards()[0]).queryByRole("list", { name: "What Changed" })).toBeNull();
    expect(within(cards()[1]).getByText("Make it warmer")).toBeInTheDocument();
    expect(within(cards()[1]).getByText("Homepage: warmer colours")).toBeInTheDocument();
    expect(within(cards()[1]).queryByRole("button", { name: /Show all/ })).toBeNull();
  });
});
