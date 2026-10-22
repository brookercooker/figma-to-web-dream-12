import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeveloperReviewPage from "../DeveloperReviewPage";
import type { RelayState } from "../designChat/helper";

const mocks = vi.hoisted(() => ({ review: undefined as RelayState["draft"], admin: true }));
vi.mock("@/prototype/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: "staff" } } }) },
  rpc: async () => ({ data: mocks.admin }),
} }));
vi.mock("../designChat/helper", () => ({ RELAY: "https://design.example", RELAY_IS_HOSTED: true, relayHeaders: async () => ({}) }));
vi.mock("../designChat/useHelperState", () => ({ useHelperState: () => ({ state: { draft: mocks.review } }) }));
beforeEach(() => { mocks.admin = true; mocks.review = undefined; });
afterEach(cleanup);
const open = () => render(<MemoryRouter><DeveloperReviewPage /></MemoryRouter>);

describe("Developer review error details", () => {
  it.each([true, false, undefined])("shows exact service details and retry classification (%s)", async (retry) => {
    mocks.review = { review: { state: "error", headline: "GitHub refused commit abc123.", summary: "Missing actions:write.\nWorkflow review.yml could not start.", retry } };
    open();
    const block = await screen.findByRole("region", { name: "Review error details" });
    expect(block.querySelectorAll("p")[0].textContent).toBe("GitHub refused commit abc123.");
    expect(block.querySelectorAll("p")[1].textContent).toBe("Missing actions:write.\nWorkflow review.yml could not start.");
    expect(screen.getByText(retry ? "Staff can retry this themselves" : "Needs a developer")).toBeVisible();
    expect(screen.getByTitle("Developer review")).toHaveAttribute("src", "https://design.example/dev");
  });
  it("handles an older service without a reason", async () => {
    mocks.review = { review: { state: "error" } };
    open();
    expect(await screen.findByText("No reason was reported by the design service.")).toBeVisible();
    expect(screen.getByText("Needs a developer")).toBeVisible();
  });
  it("does not show an error block for a successful review", async () => {
    mocks.review = { review: { state: "success", headline: "Not an error" } };
    open();
    await screen.findByTitle("Developer review");
    expect(screen.queryByRole("region", { name: "Review error details" })).toBeNull();
  });
  it("keeps the details unavailable to non-admins", async () => {
    mocks.admin = false;
    mocks.review = { review: { state: "error", headline: "Private review details" } };
    open();
    await vi.waitFor(() => expect(screen.queryByRole("heading", { name: "Developer review" })).toBeNull());
    expect(screen.queryByText("Private review details")).toBeNull();
  });
});