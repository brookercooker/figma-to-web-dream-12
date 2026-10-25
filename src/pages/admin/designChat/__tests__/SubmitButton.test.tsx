import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubmitButton } from "../PreviewTools";

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
  it.each([false, true])("keeps the review action and accessible name when compact=%s", async (compact) => {
    render(<SubmitButton compact={compact} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit for Review" }));
    await vi.waitFor(() => expect(m.refresh).toHaveBeenCalledTimes(1));
    expect(m.post).toHaveBeenCalledExactlyOnceWith("/publish");
  });
  it.each(["idle", "busy", "blocked", "unavailable"])("keeps submission disabled when %s", (reason) => {
    if (reason === "idle") m.state.publish.open = 0;
    if (reason === "busy") m.state.busy = true;
    if (reason === "blocked") m.state.publish.ok = false;
    if (reason === "unavailable") m.state = null;
    render(<SubmitButton />);
    expect(screen.getByRole("button", { name: "Submit for Review" })).toBeDisabled();
  });
  it("retains Publish when review is off", () => {
    m.state.review.enabled = false;
    render(<SubmitButton />);
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });
});