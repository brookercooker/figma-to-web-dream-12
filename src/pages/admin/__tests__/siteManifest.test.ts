import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SiteManifestUnavailable, codePagePaths, loadSiteManifest, pagesReferencing, pagesUsingObject,
  parseSiteManifest, resetSiteManifestCache, siteManifestUrl, type SiteManifest,
  setManifestBase, setDraftRetryDelay, draftManifestReachable,
} from "../siteManifest";
import { imageNeedles, videoNeedles } from "../assetUsages";

const manifest: SiteManifest = {
  version: 1, generatedAt: "2026-10-12T00:00:00Z", buildId: "b",
  pages: [
    { path: "/home", type: "static", file: "/src/pages/Index.tsx", objects: ["Hero"], files: ["/src/pages/Index.tsx", "/src/components/objects/Hero.tsx"] },
    { path: "/about", type: "static", file: "/src/pages/SimplePage.tsx", exportName: "AboutPage", objects: [], files: ["/src/pages/SimplePage.tsx"] },
    { path: "/landing/summer-sale", type: "landing", file: "/src/pages/landing/Summer.tsx", objects: ["Hero"], files: ["/src/pages/landing/Summer.tsx", "/src/components/objects/Hero.tsx"] },
  ],
  objects: { Hero: { file: "/src/components/objects/Hero.tsx" } },
  files: {
    "/src/pages/Index.tsx": { refs: ["/storage/videos-web/intro-reel.mp4"] },
    "/src/components/objects/Hero.tsx": { refs: ["/storage/images-web/hero-banner.webp"] },
    "/src/pages/SimplePage.tsx": { refs: [] },
    "/src/pages/landing/Summer.tsx": { refs: [] },
  },
};

afterEach(() => { vi.unstubAllGlobals(); setManifestBase(""); resetSiteManifestCache(); });

describe("reading the manifest", () => {
  it("pages using an object", () => {
    expect(pagesUsingObject(manifest, "Hero")).toEqual([
      { path: "/home", type: "static" },
      { path: "/landing/summer-sale", type: "landing" },
    ]);
    expect(pagesUsingObject(manifest, "Nope")).toEqual([]);
  });

  it("pages referring to an image count the objects on them too, ignoring case", () => {
    expect(pagesReferencing(manifest, ["HERO-BANNER.webp"]).map((p) => p.path)).toEqual(["/home", "/landing/summer-sale"]);
    expect(pagesReferencing(manifest, ["intro-reel.mp4"]).map((p) => p.path)).toEqual(["/home"]);
    expect(pagesReferencing(manifest, [])).toEqual([]);
    expect(pagesReferencing(manifest, ["not-anywhere.png"])).toEqual([]);
  });

  it("knows which pages exist as code", () => {
    expect([...codePagePaths(manifest)].sort()).toEqual(["/about", "/home", "/landing/summer-sale"]);
  });

  it("builds needles from an asset's paths and names", () => {
    expect(imageNeedles({ id: "1", web_path: "images-web/a/hero-banner.webp", original_path: "x.png" })).toEqual(["images-web/a/hero-banner.webp", "hero-banner.webp"]);
    expect(videoNeedles({ id: "1", external_video_id: "dQw4w9WgXcQ" })).toEqual(["dQw4w9WgXcQ"]);
  });
});

describe("loading the manifest", () => {
  it("reads the draft origin first, preserving its preview token", async () => {
    setManifestBase("https://draft.example/about?__lovable_token=test-token");
    const fetcher = vi.fn(async (_url: string) => new Response(JSON.stringify(manifest)));
    vi.stubGlobal("fetch", fetcher);
    await loadSiteManifest();
    expect(fetcher.mock.calls[0][0]).toBe("https://draft.example/site-manifest.json?__lovable_token=test-token");
  });
  it("falls back if the draft cannot be reached", async () => {
    setManifestBase("https://draft.example/?__lovable_token=test-token");
    setDraftRetryDelay(0);
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("CORS")).mockRejectedValueOnce(new Error("CORS")).mockResolvedValueOnce(new Response(JSON.stringify(manifest)));
    vi.stubGlobal("fetch", fetcher);
    expect((await loadSiteManifest()).buildId).toBe("b");
    expect(fetcher).toHaveBeenCalledTimes(3); // draft, draft retry, fallback
    expect(fetcher.mock.calls[1][0]).toBe("https://draft.example/site-manifest.json?__lovable_token=test-token");
    expect(fetcher.mock.calls[2][0]).toBe("/site-manifest.json");
    expect(draftManifestReachable()).toBe(false);
  });
  it("a cached fallback still reports the draft as unreachable, and a no-draft load as reachable", async () => {
    resetSiteManifestCache();
    setManifestBase("https://draft3.example/");
    setDraftRetryDelay(0);
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("x")).mockRejectedValueOnce(new Error("x")).mockImplementation(async () => new Response(JSON.stringify(manifest)));
    vi.stubGlobal("fetch", fetcher);
    await loadSiteManifest();
    await loadSiteManifest(); // from the cache
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(draftManifestReachable()).toBe(false);
    setManifestBase("");
    await loadSiteManifest();
    expect(draftManifestReachable()).toBe(true);
  });
  it("uses the draft retry when the first attempt fails, and does not cache a failure", async () => {
    resetSiteManifestCache();
    setManifestBase("https://draft2.example/");
    setDraftRetryDelay(0);
    const fetcher = vi.fn().mockRejectedValue(new Error("down"));
    vi.stubGlobal("fetch", fetcher);
    await expect(loadSiteManifest()).rejects.toThrow(SiteManifestUnavailable);
    fetcher.mockReset().mockImplementation(async () => new Response(JSON.stringify(manifest)));
    expect((await loadSiteManifest()).buildId).toBe("b");
    expect(draftManifestReachable()).toBe(true);
  });
  it("rejects a manifest of another version or shape", () => {
    expect(() => parseSiteManifest({ version: 2, pages: [], files: {} })).toThrow(SiteManifestUnavailable);
    expect(() => parseSiteManifest({ version: 1 })).toThrow(SiteManifestUnavailable);
    expect(() => parseSiteManifest(null)).toThrow(SiteManifestUnavailable);
    expect(parseSiteManifest({ version: 1, pages: [], files: {} }).pages).toEqual([]);
  });

  it("fetches it once and keeps it", async () => {
    const f = vi.fn(async (_url: string) => new Response(JSON.stringify(manifest)));
    vi.stubGlobal("fetch", f);
    const a = await loadSiteManifest();
    const b = await loadSiteManifest();
    expect(a.pages).toHaveLength(3);
    expect(b).toBe(a);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe(siteManifestUrl());
  });

  it("says so when it can't be read, and tries again next time", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    await expect(loadSiteManifest()).rejects.toThrow(SiteManifestUnavailable);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(manifest))));
    await expect(loadSiteManifest()).resolves.toBeTruthy();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    await expect(loadSiteManifest(true)).rejects.toThrow(/offline/);
  });
});
