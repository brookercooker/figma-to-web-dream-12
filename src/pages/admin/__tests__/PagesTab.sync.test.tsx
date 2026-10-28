import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PagesTab from "../PagesTab";
import { PAGES_SYNCED } from "../manifestPageSync";

const state = vi.hoisted(() => ({ rows: [] as any[], load: vi.fn(), choose: vi.fn(), start: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { from: () => ({ select: () => ({ order: async () => { state.load(); return { data: state.rows }; } }) }) } }));
vi.mock("../manifestPageSync", () => ({ PAGES_SYNCED: "nova-pages-synced", syncManifestPages: vi.fn() }));
vi.mock("../designChat/DesignChatContext", () => ({ useDesignChatOptional: () => ({ selectPage: state.choose, startEditing: state.start, workingPage: null }) }));
vi.mock("../useThumbnailCapture", () => ({ useAutoCaptureThumbnails: vi.fn(), regenerateThumbnail: vi.fn() }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
vi.mock("../LabelsCell", () => ({ default: () => null }));
vi.mock("../TagsPanel", () => ({ default: () => null }));
vi.mock("../CreatePageDialog", () => ({ default: () => null }));
vi.mock("../LandingPagesView", () => ({ default: () => null }));
vi.mock("../LinkAuditView", () => ({ default: () => null }));
vi.mock("../PagePreviewDialog", () => ({ default: () => null }));
vi.mock("../WorkStatusPopover", () => ({ default: () => null }));

beforeEach(() => { cleanup(); state.rows = []; state.load.mockClear(); state.choose.mockClear(); state.start.mockClear(); });
describe("Pages list synchronization", () => {
  it("shows a new page and chooses it without starting manual editing", async () => {
    render(<MemoryRouter initialEntries={["/manage/pages"]}><PagesTab /></MemoryRouter>);
    await waitFor(() => expect(state.load).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: "Fresh Code Page" })).toBeNull();
    state.rows = [{ id: "new", slug_id: "fresh-code-page-123abc", name: "Fresh Code Page", path: "/fresh-code-page", page_type: "static", build_status: "ready", tags: [], updated_at: "2026-10-22T06:30:00Z", archived_at: null }];
    act(() => { window.dispatchEvent(new Event(PAGES_SYNCED)); });
    await waitFor(() => expect(screen.getByRole("button", { name: "Fresh Code Page" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Fresh Code Page" }));
    expect(state.choose).toHaveBeenCalledWith({ id: "new", name: "Fresh Code Page", path: "/fresh-code-page" });
    expect(state.start).not.toHaveBeenCalled();
    expect(screen.queryByText(/Edit It Myself/)).toBeNull();
    expect(state.load).toHaveBeenCalledTimes(2);
  });
});