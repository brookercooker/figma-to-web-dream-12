import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DeveloperReviewPage from "../DeveloperReviewPage";
import type { RelayState } from "../designChat/helper";

const mocks = vi.hoisted(() => ({ review: undefined as RelayState["draft"], admin: true, require: true, signedIn: true, hosted: true, headers: vi.fn() }));
vi.mock("@/lib/authGate", () => ({ get REQUIRE_LOGIN() { return mocks.require; } }));
vi.mock("@/prototype/client", () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: mocks.signedIn ? { id: "staff" } : null } }) },
  rpc: async () => ({ data: mocks.admin }),
} }));
vi.mock("../designChat/helper", () => ({ RELAY: "https://design.example", get RELAY_IS_HOSTED() { return mocks.hosted; }, relayHeaders: mocks.headers }));
vi.mock("../designChat/useHelperState", () => ({ useHelperState: () => ({ state: { draft: mocks.review } }) }));
beforeEach(() => { mocks.admin = true; mocks.review = undefined; mocks.require = true; mocks.signedIn = true; mocks.hosted = true; mocks.headers.mockReset().mockResolvedValue({ Authorization: "Bearer test-token" }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
const open = () => render(<MemoryRouter><DeveloperReviewPage /></MemoryRouter>);

describe("Developer Review error details", () => {
  it("answers token requests synchronously from warmed auth and also on load", async () => {
    open();
    const frame = await screen.findByTitle("Developer Review") as HTMLIFrameElement;
    const post = vi.spyOn(frame.contentWindow as Window, "postMessage");
    fireEvent(window, new MessageEvent("message", { source: frame.contentWindow, origin: "https://design.example", data: { type: "nova-dev-need-token" } }));
    expect(post).toHaveBeenCalledWith({ type: "nova-dev-token", token: "test-token", page: window.location.origin + "/manage/preview" }, "https://design.example");
    post.mockClear();
    fireEvent.load(frame);
    expect(post).toHaveBeenCalledOnce();
    expect(mocks.headers).toHaveBeenCalledOnce();
  });
  it("only trusted child ready messages remove the loading cover", async () => {
    open();
    const frame = await screen.findByTitle("Developer Review") as HTMLIFrameElement;
    fireEvent(window, new MessageEvent("message", { source: frame.contentWindow, origin: "https://other.example", data: { type: "nova-dev-ready" } }));
    expect(screen.getByText("Loading the draft…")).toBeInTheDocument();
    fireEvent(window, new MessageEvent("message", { source: window, origin: "https://design.example", data: { type: "nova-dev-ready" } }));
    expect(screen.getByText("Loading the draft…")).toBeInTheDocument();
    fireEvent(window, new MessageEvent("message", { source: frame.contentWindow, origin: "https://design.example", data: { type: "nova-dev-ready" } }));
    expect(screen.queryByText("Loading the draft…")).toBeNull();
  });
  it("limits the loading cover to 20 seconds", async () => {
    vi.useFakeTimers();
    open();
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByText("Loading the draft…")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(19_999));
    expect(screen.getByText("Loading the draft…")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Loading the draft…")).toBeNull();
  });
  it("opens the draft site in a safe new tab for an admin with the hosted relay", async () => {
    open();
    const link = await screen.findByRole("link", { name: "Open Draft Site" });
    expect(link).toHaveAttribute("href", window.location.origin + "/manage/preview");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("does not offer the draft site link without the hosted relay", async () => {
    mocks.hosted = false;
    open();
    await screen.findByText("The developer review needs the hosted design service.");
    expect(screen.queryByRole("link", { name: "Open Draft Site" })).toBeNull();
  });
  it("restores the original signed-out redirect with login required", async () => {
    mocks.signedIn = false;
    render(<MemoryRouter initialEntries={["/manage/developer"]}><Routes>
      <Route path="/manage/developer" element={<DeveloperReviewPage />} />
      <Route path="/manage/pages" element={<p>Pages list</p>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText("Pages list")).toBeVisible();
    expect(screen.queryByTitle("Developer Review")).toBeNull();
  });
  it("keeps the screen visible but private details unavailable during signed-out review", async () => {
    mocks.require = false; mocks.admin = false;
    mocks.review = { review: { state: "error", headline: "Private review details" } };
    open();
    expect(await screen.findByText(/Sign in to load or save this/)).toBeVisible();
    expect(screen.queryByText("Private review details")).toBeNull();
    expect(screen.queryByTitle("Developer Review")).toBeNull();
    expect(screen.queryByRole("link", { name: "Open Draft Site" })).toBeNull();
  });
  it.each([true, false, undefined])("shows exact service details and retry classification (%s)", async (retry) => {
    mocks.review = { review: { state: "error", headline: "GitHub refused commit abc123.", summary: "Missing actions:write.\nWorkflow review.yml could not start.", retry } };
    open();
    const block = await screen.findByRole("region", { name: "Review Error Details" });
    expect(block.querySelectorAll("p")[0].textContent).toBe("GitHub refused commit abc123.");
    expect(block.querySelectorAll("p")[1].textContent).toBe("Missing actions:write.\nWorkflow review.yml could not start.");
    expect(screen.getByText(retry ? "Staff can retry this themselves" : "Needs a Developer")).toBeVisible();
    expect(screen.getByTitle("Developer Review")).toHaveAttribute("src", "https://design.example/dev");
  });
  it("handles an older service without a reason", async () => {
    mocks.review = { review: { state: "error" } };
    open();
    expect(await screen.findByText("No reason was reported by the design service.")).toBeVisible();
    expect(screen.getByText("Needs a Developer")).toBeVisible();
  });
  it("does not show an error block for a successful review", async () => {
    mocks.review = { review: { state: "success", headline: "Not an error" } };
    open();
    await screen.findByTitle("Developer Review");
    expect(screen.queryByRole("region", { name: "Review Error Details" })).toBeNull();
  });
  it("keeps the details unavailable to non-admins", async () => {
    mocks.admin = false;
    mocks.review = { review: { state: "error", headline: "Private review details" } };
    render(<MemoryRouter initialEntries={["/manage/developer"]}><Routes>
      <Route path="/manage/developer" element={<DeveloperReviewPage />} />
      <Route path="/manage/pages" element={<p>Pages list</p>} />
    </Routes></MemoryRouter>);
    await screen.findByText("Pages list");
    expect(screen.queryByText("Private review details")).toBeNull();
  });
});