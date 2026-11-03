import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePreview } from "../usePreview";
const auth = vi.hoisted(() => ({ user: true }));
vi.mock("@/lib/authGate", () => ({ hasManagerUser: async () => auth.user, SIGN_IN_REQUIRED: "Sign in to load or save this" }));

vi.mock("../helper", () => ({ EMBED_FN: "https://service.example/embed", SUPABASE_KEY: "" }));
vi.mock("../../manifestPageSync", () => ({ syncManifestPages: vi.fn() }));
vi.mock("../../siteManifest", () => ({ setManifestBase: vi.fn(), resetSiteManifestCache: vi.fn(), isSafePublicFrameUrl: (url: string) => url.startsWith("https://") }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); auth.user = true; });
describe("Chat public frames", () => {
  it("does not request a preview address without a user", async () => {
    auth.user = false; vi.stubGlobal("fetch", vi.fn());
    const view = renderHook(() => usePreview(null));
    await waitFor(() => expect(view.result.current.error).toBe("Sign in to load or save this"));
    expect(fetch).not.toHaveBeenCalled(); expect(view.result.current.frames).toEqual([]);
  });
  it("remembers canonical Homepage arrivals for later refreshes instead of keeping a stale home pin", async () => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://public.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ expires_at: "2099-01-01" }) }));
    const view = renderHook(() => usePreview(null, "/home/"));
    await waitFor(() => expect(view.result.current.frames).toHaveLength(1));
    act(() => { view.result.current.rememberPath("/"); view.result.current.rememberPath("/about"); });
    await act(async () => { await view.result.current.retry(); });
    expect(view.result.current.frames[1]?.url).toBe("https://public.example/about");
  });
  it("replaces the Manager preview with the public /draft route and preserves it across page changes", async () => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://public.example");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ embed_url: "https://manager.example/preview?token=manager", expires_at: "2099-01-01" }) }));
    const view = renderHook(({ path }) => usePreview(null, path), { initialProps: { path: "/draft" } });
    await waitFor(() => expect(view.result.current.frames).toHaveLength(1));
    expect(view.result.current.frames[0].url).toBe("https://public.example/draft");
    act(() => view.result.current.finish(1));
    view.rerender({ path: "/landing/example" });
    await waitFor(() => expect(view.result.current.frames).toHaveLength(2));
    expect(view.result.current.frames[1].url).toBe("https://public.example/landing/example");
  });
  it("still loads the public page when the old Manager embed service is unavailable", async () => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://public.example");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("unavailable")));
    const view = renderHook(({ path }) => usePreview(null, path), { initialProps: { path: "/draft" } });
    await waitFor(() => expect(view.result.current.frames[0]?.url).toBe("https://public.example/draft"));
    act(() => view.result.current.finish(1));
    view.rerender({ path: "/landing/new" });
    await waitFor(() => expect(view.result.current.frames[1]?.url).toBe("https://public.example/landing/new"));
  });
});