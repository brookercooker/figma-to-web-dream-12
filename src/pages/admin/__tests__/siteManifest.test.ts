import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SiteManifestUnavailable, codePagePaths, loadSiteManifest, pagesReferencing, pagesUsingObject,
  parseSiteManifest, resetSiteManifestCache, siteManifestUrl, type SiteManifest,
  setManifestBase, setDraftRetryDelay, draftManifestReachable,
  manifestHasPage, requestFrameManifest, startSiteManifestBridge, MANIFEST_CHANGED, setManifestMessageDelay,
  isSafePublicFrameUrl,
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

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); setManifestBase(""); resetSiteManifestCache(); setManifestMessageDelay(1500); document.querySelectorAll("iframe").forEach((frame) => frame.remove()); });

describe("public frame manifest messages", () => {
  const publicManifest: SiteManifest = { ...manifest, buildId: "public-build", pages: [...manifest.pages, { path: "/draft", type: "static", file: "/src/pages/DraftPage.tsx", objects: [], files: [] }] };
  function deliver(origin: string, value: unknown = publicManifest) {
    window.dispatchEvent(new MessageEvent("message", { origin, data: { source: "nova-site", type: "manifest", manifest: value } }));
  }
  it("accepts the draft origin and uses its code-only paths without HTTP", async () => {
    setManifestBase("https://draft.example/?__lovable_token=test-token");
    const changed = vi.fn(); window.addEventListener(MANIFEST_CHANGED, changed);
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    deliver("https://draft.example");
    expect(await loadSiteManifest()).toEqual(publicManifest);
    expect(manifestHasPage("/draft")).toBe(true);
    expect(manifestHasPage("/")).toBe(true);
    expect(draftManifestReachable()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
    window.removeEventListener(MANIFEST_CHANGED, changed);
  });
  it("accepts the configured public-site origin", async () => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://public.example/some-path");
    setManifestBase("https://draft.example/");
    deliver("https://public.example");
    expect(await loadSiteManifest()).toEqual(publicManifest);
    expect(manifestHasPage("/draft")).toBe(true);
    expect(draftManifestReachable()).toBe(false);
  });
  it("rejects an unrelated origin, including a deceptive hostname suffix", () => {
    setManifestBase("https://draft.example/");
    deliver("https://untrusted.example"); deliver("https://draft.example.evil.test");
    expect(manifestHasPage("/draft")).toBe(false);
  });
  it("ignores invalid manifests without overwriting a valid one", async () => {
    setManifestBase("https://draft.example/");
    deliver("https://draft.example");
    deliver("https://draft.example", { version: 2, pages: [], files: {} });
    deliver("https://draft.example", { version: 1, pages: [{ path: 3 }], files: {} });
    expect(await loadSiteManifest()).toEqual(publicManifest);
  });
  it("requests from the mounted preview using its exact origin and prefers the reply", async () => {
    setManifestBase("https://draft.example/?__lovable_token=test-token");
    const frame = document.createElement("iframe"); frame.src = "https://draft.example/about?__lovable_token=test-token"; frame.dataset.sitePreview = "true"; document.body.appendChild(frame);
    const target = frame.contentWindow;
    if (!target) throw new Error("No frame window");
    const post = vi.spyOn(target, "postMessage").mockImplementation(() => { deliver("https://draft.example"); });
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect(await loadSiteManifest()).toEqual(publicManifest);
    expect(post).toHaveBeenCalledWith({ source: "nova-manager", type: "request-manifest" }, "https://draft.example");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("never requests a manifest from an untrusted frame", () => {
    setManifestBase("https://draft.example/");
    const frame = document.createElement("iframe"); frame.src = "https://evil.test/"; document.body.appendChild(frame);
    const target = frame.contentWindow;
    if (!target) throw new Error("No frame window");
    const post = vi.spyOn(target, "postMessage");
    expect(requestFrameManifest(frame)).toBe(false); expect(post).not.toHaveBeenCalled();
  });
  it.each(["", "/manage/preview", "http://draft.example/", "https://", window.location.origin + "/manage/preview"])("does not create a receiver for missing, relative, non-HTTPS or same-origin target %s", (url) => {
    expect(isSafePublicFrameUrl(url)).toBe(false);
    setManifestBase(url);
    const stop = startSiteManifestBridge();
    try { expect(document.querySelector("iframe[data-manifest-receiver]")).toBeNull(); } finally { stop(); }
  });
  it("does not create a receiver inside a frame", () => {
    setManifestBase("https://draft.example/");
    vi.spyOn(window, "self", "get").mockReturnValue({} as Window & typeof globalThis);
    const stop = startSiteManifestBridge();
    try { expect(document.querySelector("iframe[data-manifest-receiver]")).toBeNull(); } finally { stop(); }
  });
  it("allows only an absolute cross-origin HTTPS preview URL", () => {
    expect(isSafePublicFrameUrl("https://draft.example/")).toBe(true);
    expect(isSafePublicFrameUrl(undefined)).toBe(false);
  });
  it("caps the receiver at one per page load, including errors, address changes and real-frame handoff", async () => {
    setManifestBase("https://draft.example/?__lovable_token=test-token");
    const stop = startSiteManifestBridge(); const stopOther = startSiteManifestBridge();
    try {
      const receiver = document.querySelector<HTMLIFrameElement>("iframe[data-manifest-receiver]");
      expect(receiver?.getAttribute("aria-hidden")).toBe("true");
      expect(receiver?.tabIndex).toBe(-1);
      expect(receiver?.src).toBe("https://draft.example/?__lovable_token=test-token");
      expect(document.querySelectorAll("iframe[data-manifest-receiver]")).toHaveLength(1);
      receiver?.dispatchEvent(new Event("error"));
      receiver?.dispatchEvent(new Event("load"));
      setManifestBase("https://other-draft.example/");
      await new Promise((r) => setTimeout(r, 0));
      expect(document.querySelector("iframe[data-manifest-receiver]")).toBe(receiver);
      expect(receiver?.src).toBe("https://draft.example/?__lovable_token=test-token");
      setManifestBase("https://draft.example/");
      const real = document.createElement("iframe"); real.src = "https://draft.example/about"; real.dataset.sitePreview = "true"; document.body.appendChild(real);
      await new Promise((r) => setTimeout(r, 0));
      expect(document.querySelector("iframe[data-manifest-receiver]")).toBeNull();
      real.remove(); await new Promise((r) => setTimeout(r, 0));
      expect(document.querySelectorAll("iframe[data-manifest-receiver]")).toHaveLength(0);
    } finally { stop(); stopOther(); }
    expect(document.querySelector("iframe[data-manifest-receiver]")).toBeNull();
    const restart = startSiteManifestBridge();
    expect(document.querySelector("iframe[data-manifest-receiver]")).toBeNull();
    restart();
  });
  it("falls back to HTTP after a missing reply and logs only once at debug level", async () => {
    setManifestBase("https://draft.example/"); setManifestMessageDelay(0);
    const frame = document.createElement("iframe"); frame.src = "https://draft.example/"; frame.dataset.sitePreview = "true"; document.body.appendChild(frame);
    const warn = vi.spyOn(console, "warn"); const debug = vi.spyOn(console, "debug");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(manifest))));
    await loadSiteManifest(); await loadSiteManifest(true);
    expect(warn).not.toHaveBeenCalled(); expect(debug.mock.calls.length).toBeLessThanOrEqual(1);
  });
});

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
