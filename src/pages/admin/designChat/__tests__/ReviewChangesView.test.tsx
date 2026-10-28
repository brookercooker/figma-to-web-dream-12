import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewChangesView from "../ReviewChangesView";
const m = vi.hoisted(() => ({ state: null as any, setReviewOpen: vi.fn(), show: vi.fn(), post: vi.fn() }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({ state: m.state, refreshSoon: vi.fn(), setReviewOpen: m.setReviewOpen, showPreviewPath: m.show }) }));
vi.mock("../helper", () => ({ postToHelper: m.post }));
const now = Date.now();
const reqs = [
  { id: "a", request: "Make the headline larger", source: "chat", at: now - 3600_000, files: ["x"] },
  { id: "b", request: "Edits made in the Site Manager: changed the hero text", source: "content", at: now - 60_000, page: { name: "Experiment", path: "/draft/experiment" } },
  { id: "c", request: "Developer tweak", source: "developer", at: now - 7200_000 },
  { id: "d", request: "Dependency update", source: "chat", at: now - 10_800_000, files: [], siteFiles: [], platformFiles: ["p"] },
];
beforeEach(() => { vi.clearAllMocks(); m.state = { busy: false, history: [], publish: { ok: true, open: 4 }, draft: { requests: reqs } }; });
afterEach(cleanup);
const cards = () => Array.from(document.querySelectorAll("[data-change-id]")) as HTMLElement[];
describe("Changes waiting for review", () => {
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
  it("views the page on the preview, or just the draft preview without a page", () => {
    const onShow = vi.fn();
    render(<ReviewChangesView onShowPreview={onShow} />);
    fireEvent.click(within(cards()[0]).getByRole("button", { name: "View Page on Preview" }));
    expect(onShow).toHaveBeenCalledOnce(); expect(m.show).toHaveBeenCalledExactlyOnceWith("/draft/experiment");
    fireEvent.click(within(cards()[1]).getByRole("button", { name: "Open Draft Preview" }));
    expect(onShow).toHaveBeenCalledTimes(2); expect(m.show).toHaveBeenCalledOnce();
    expect(m.setReviewOpen).not.toHaveBeenCalled();
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
});
