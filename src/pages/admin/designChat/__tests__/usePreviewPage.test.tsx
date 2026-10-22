import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerPreviewPage, usePreviewPage } from "../usePreviewPage";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), lookup: vi.fn(), restore: vi.fn(), sync: vi.fn(), conflict: vi.fn() }));
vi.mock("../contentSync", () => ({ notifyContentEdited: mocks.sync }));
vi.mock("@/prototype/client", () => ({ supabase: { from: () => ({
  insert: mocks.insert,
  update: mocks.restore,
  select: () => ({
    is: () => ({ in: mocks.lookup }),
    in: (...a: unknown[]) => mocks.conflict(...a),
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
    mocks.conflict.mockResolvedValue({ data: [{ ...page, archived_at: archived ? "2026-10-01" : null }], error: null });
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

describe("the front page answers at both / and /home", () => {
  it("an address of /home finds the / row, and / shares the same cache entry", async () => {
    const home = { id: "home", name: "Homepage", path: "/" };
    mocks.lookup.mockResolvedValue({ data: [home], error: null });
    const a = renderHook(() => usePreviewPage("/home"));
    await waitFor(() => expect(a.result.current.page).toEqual(home));
    expect(mocks.lookup).toHaveBeenCalledWith("path", ["/", "/home"]);
    const b = renderHook(() => usePreviewPage("/"));
    expect(b.result.current.page).toEqual(home); // served from the shared cache
    expect(mocks.lookup).toHaveBeenCalledTimes(1);
    a.unmount(); b.unmount();
  });
});

describe("front page lookups on a fresh cache", () => {
  beforeEach(() => { vi.resetModules(); });
  it("an address of / finds a /home row, keeping its stored path", async () => {
    const { usePreviewPage: hook } = await import("../usePreviewPage");
    const home = { id: "home2", name: "Home", path: "/home" };
    mocks.lookup.mockResolvedValue({ data: [home], error: null });
    const { result } = renderHook(() => hook("/"));
    await waitFor(() => expect(result.current.page).toEqual(home));
  });
  it("with no home row under either spelling, offers and registers / (never /home)", async () => {
    const mod = await import("../usePreviewPage");
    mocks.lookup.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => mod.usePreviewPage("/home"));
    await waitFor(() => expect(result.current.registrable).toEqual({ name: "Home", path: "/" }));
    mocks.insert.mockImplementation((row: any) => ({ select: () => ({ single: async () => ({ data: { id: "new-home", name: row.name, path: row.path }, error: null }) }) }));
    await act(async () => { await mod.registerPreviewPage({ name: "Home", path: "/home" }); });
    expect(mocks.insert.mock.calls[0][0].path).toBe("/");
  });
  it("restores an archived home row after a conflict when it is the only match", async () => {
    const mod = await import("../usePreviewPage");
    const home = { id: "old-home", name: "Homepage", path: "/" };
    mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: null, error: { code: "23505" } }) }) });
    mocks.conflict.mockResolvedValue({ data: [{ ...home, archived_at: "2026-10-01" }], error: null });
    mocks.restore.mockReturnValue({ eq: () => ({ select: () => ({ single: async () => ({ data: home, error: null }) }) }) });
    expect(await mod.registerPreviewPage({ name: "Home", path: "/home" })).toEqual(home);
    expect(mocks.conflict).toHaveBeenCalledWith("path", ["/", "/home"]);
    expect(mocks.restore).toHaveBeenCalledTimes(1);
  });
  it("leaves /about unchanged", async () => {
    const { usePreviewPage: hook } = await import("../usePreviewPage");
    const about = { id: "about", name: "About", path: "/about" };
    mocks.lookup.mockResolvedValue({ data: [about], error: null });
    const { result } = renderHook(() => hook("/about/"));
    await waitFor(() => expect(result.current.page).toEqual(about));
    expect(mocks.lookup).toHaveBeenCalledWith("path", ["/about"]);
  });
});
