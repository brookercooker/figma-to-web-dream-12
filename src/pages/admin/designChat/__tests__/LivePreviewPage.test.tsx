import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LivePreviewPage, { normalisePagePath, resolveLivePage } from "../LivePreviewPage";

const m = vi.hoisted(() => ({ load: vi.fn(), draftOk: true }));
vi.mock("../../siteManifest", () => ({ loadSiteManifest: (...a: unknown[]) => m.load(...a), draftManifestReachable: () => m.draftOk }));
vi.mock("../../codedPages", () => ({ codedPages: { "/coded-only": () => <h1>Coded backup</h1> } }));
vi.mock("@/pages/RaceTestPage", () => ({ default: () => <h1>Live race page</h1> }));
vi.mock("@/pages/TestPage", () => { throw new Error("chunk failed"); });

beforeEach(() => {
  m.draftOk = true;
  m.load.mockReset().mockResolvedValue({ pages: [
    { path: "/race-test-page", file: "/src/pages/RaceTestPage.tsx" },
    { path: "/test-page", file: "/src/pages/TestPage.tsx" },
  ] });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(cleanup);

describe("normalisePagePath", () => {
  it("strips trailing slashes, query and hash", () => {
    expect(normalisePagePath("/race-test-page/")).toBe("/race-test-page");
    expect(normalisePagePath("/race-test-page?x=1#top")).toBe("/race-test-page");
  });
  it("treats / and /home as the same page", () => {
    expect(normalisePagePath("/")).toBe("/home");
    expect(normalisePagePath("/home/")).toBe("/home");
  });
});

describe("resolveLivePage", () => {
  it("finds a manifest page even with a trailing slash", async () => {
    expect((await resolveLivePage("/race-test-page/")).status).toBe("found");
  });
  it("uses the coded pages list when the manifest has no entry", async () => {
    const r = await resolveLivePage("/coded-only");
    expect(r.status).toBe("found");
    expect(r.Page).toBeTruthy();
  });
  it("reports missing when the manifest loaded and has no such page", async () => {
    expect((await resolveLivePage("/brand-new")).status).toBe("missing");
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("manifest loaded: yes, draft manifest reachable: yes, entry found: no"));
  });
  it("reports unreachable when the draft list failed and the public list lacks the page", async () => {
    m.draftOk = false;
    expect((await resolveLivePage("/draft-only")).status).toBe("unreachable");
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("draft manifest reachable: no"));
  });
  it("reports missing when the draft list was read and lacks the page", async () => {
    m.draftOk = true;
    expect((await resolveLivePage("/draft-only")).status).toBe("missing");
  });
  it("reports missing with no draft at all (the public list is the authority)", async () => {
    m.draftOk = true; // draftManifestReachable() is true when no draft address is set
    expect((await resolveLivePage("/nowhere")).status).toBe("missing");
  });
  it("reports unreachable when the manifest can't be read", async () => {
    m.load.mockRejectedValue(new Error("down"));
    expect((await resolveLivePage("/brand-new")).status).toBe("unreachable");
  });
  it("reports unreachable when the page's code fails to load", async () => {
    expect((await resolveLivePage("/test-page")).status).toBe("unreachable");
  });
});

it("renders an unlisted public page within a Site Manager route without nesting router errors", async () => {
  const onStatus = vi.fn();
  render(<MemoryRouter initialEntries={["/manage/preview"]}>
    <Routes><Route path="/manage/preview" element={<LivePreviewPage path="/race-test-page" onStatus={onStatus} />} /></Routes>
  </MemoryRouter>);
  expect(await screen.findByRole("heading", { name: "Live race page" })).toBeVisible();
  expect(onStatus).toHaveBeenCalledWith("found");
});

it("does not fall back to an empty database page when the page is missing", async () => {
  const onStatus = vi.fn();
  render(<MemoryRouter><LivePreviewPage path="/brand-new" onStatus={onStatus} /></MemoryRouter>);
  await waitFor(() => expect(onStatus).toHaveBeenCalledWith("missing"));
  expect(screen.queryByText(/Content coming soon/)).toBeNull();
});
