import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPreviewPage, usePreviewPage } from "../usePreviewPage";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), lookup: vi.fn(), restore: vi.fn(), sync: vi.fn() }));
vi.mock("../contentSync", () => ({ notifyContentEdited: mocks.sync }));
vi.mock("@/prototype/client", () => ({ supabase: { from: () => ({
  insert: mocks.insert,
  update: mocks.restore,
  select: () => ({
    is: () => ({ in: mocks.lookup }),
    eq: () => ({ maybeSingle: mocks.lookup }),
  }),
}) } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("preview registration cache", () => {
  it("is unavailable while loading, accepts a missing page, caches registration, and rejects a later 404", async () => {
    const path = "/cache-registration-test";
    mocks.lookup.mockResolvedValue({ data: [], error: null });
    const { result, rerender } = renderHook(({ notFound }) => usePreviewPage(path, notFound), { initialProps: { notFound: false } });
    expect(result.current.registrable).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.registrable).toEqual({ name: "Cache Registration Test", path });
    const page = { id: "cache-page", name: "Cache Registration Test", path };
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: page, error: null }) }) });
    await act(async () => { await registerPreviewPage({ name: page.name, path }); });
    expect(result.current.page).toEqual(page);
    expect(result.current.registrable).toBeNull();
    await registerPreviewPage({ name: page.name, path });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
    rerender({ notFound: true });
    expect(result.current.page).toBeNull();
    expect(result.current.registrable).toBeNull();
  });

  it.each([false, true])("reuses an existing path after a conflict (archived: %s)", async (archived) => {
    const path = `/conflict-${archived}`;
    const page = { id: `conflict-${archived}`, name: "Existing Page", path };
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: null, error: { code: "23505" } }) }) });
    mocks.lookup.mockResolvedValue({ data: { ...page, archived_at: archived ? "2026-10-01" : null }, error: null });
    mocks.restore.mockReturnValue({ eq: () => ({ select: () => ({ single: async () => ({ data: page, error: null }) }) }) });
    expect(await registerPreviewPage({ name: "New Name", path })).toEqual(page);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.restore).toHaveBeenCalledTimes(archived ? 1 : 0);
    expect(mocks.sync).toHaveBeenCalledTimes(1);
  });

  it("does not sync or cache a failed insert", async () => {
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: null, error: { code: "42501" } }) }) });
    await expect(registerPreviewPage({ name: "Denied", path: "/denied-registration" })).rejects.toEqual({ code: "42501" });
    expect(mocks.sync).not.toHaveBeenCalled();
  });
});