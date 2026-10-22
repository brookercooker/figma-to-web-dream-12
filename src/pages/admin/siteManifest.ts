// The Site Manager's view of the public site: which pages it has and what each one uses.
//
// The public site writes `site-manifest.json` on every build (scripts/siteManifest.mjs). This file fetches it and answers
// "which pages use this object?" and "which pages refer to this image or video?" without reading any of the public site's
// code, so it keeps working when the two are separate projects.
//
// Read the current draft embed origin (including its query token) first, then VITE_PUBLIC_SITE_URL or the same site.

export interface SiteManifestPage {
  path: string;
  type: "static" | "landing";
  file: string;
  exportName?: string;
  /** component_key of every object the page renders. */
  objects: string[];
  /** The page's own file plus the modules of its objects: where its images and videos are named. */
  files: string[];
}

export interface SiteManifest {
  version: number;
  generatedAt: string;
  buildId: string;
  pages: SiteManifestPage[];
  objects: Record<string, { file: string }>;
  files: Record<string, { refs: string[] }>;
}

/** The manifest couldn't be read. Callers treat the usage data as unknown (not as "nothing is used"). */
export class SiteManifestUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteManifestUnavailable";
  }
}

export const SUPPORTED_VERSION = 1;
let draftBase: string | null = null;
let knownPaths = new Set<string>();
export const MANIFEST_CHANGED = "nova-manifest-changed";
export function setManifestBase(url: string) {
  if (url === draftBase) return;
  draftBase = url || null;
  resetSiteManifestCache();
}
export function manifestHasPage(path: string) { return knownPaths.has(path === "/" ? "/home" : path.replace(/\/+$/, "")); }

export function siteManifestUrl(): string {
  if (draftBase) {
    const url = new URL(draftBase);
    url.pathname = "/site-manifest.json";
    url.hash = "";
    return url.toString();
  }
  return fallbackManifestUrl();
}

function fallbackManifestUrl(): string {
  const base = String((import.meta as any).env?.VITE_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  return `${base}/site-manifest.json`;
}

export function parseSiteManifest(x: unknown): SiteManifest {
  const m = x as Partial<SiteManifest> | null;
  if (!m || typeof m !== "object") throw new SiteManifestUnavailable("The site manifest isn't valid.");
  if (m.version !== SUPPORTED_VERSION) throw new SiteManifestUnavailable(`The site manifest is version ${String(m.version)}; this Site Manager reads version ${SUPPORTED_VERSION}.`);
  if (!Array.isArray(m.pages) || typeof m.files !== "object" || m.files === null) throw new SiteManifestUnavailable("The site manifest is missing its pages.");
  return { objects: {}, buildId: "", generatedAt: "", ...m } as SiteManifest;
}

const TTL_MS = 60_000;
let draftRetryMs = 2000;
/** Tests: shorten the pause before the draft manifest is retried. */
export function setDraftRetryDelay(ms: number) { draftRetryMs = ms; }
let draftReachable = true;
/** False when the last load could not read the draft preview's manifest (and fell back, or failed). */
export function draftManifestReachable() { return draftReachable; }
let cached: { at: number; promise: Promise<SiteManifest> } | null = null;

/** Fetch the manifest (kept for a minute). Throws SiteManifestUnavailable if it can't be had. */
export function loadSiteManifest(force = false): Promise<SiteManifest> {
  if (!force && cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = (async () => {
    const draftUrl = siteManifestUrl();
    const urls = [...new Set([draftUrl, fallbackManifestUrl()])];
    // The draft address is tried twice (a short pause between) before falling back.
    if (draftBase) urls.splice(1, 0, draftUrl);
    let failure: unknown;
    draftReachable = true;
    for (const [index, url] of urls.entries()) {
      const isDraft = !!draftBase && url === draftUrl;
      if (isDraft && index > 0) await new Promise((r) => setTimeout(r, draftRetryMs));
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new SiteManifestUnavailable(`The site manifest returned ${res.status}.`);
        const manifest = parseSiteManifest(await res.json());
        knownPaths = codePagePaths(manifest);
        window.dispatchEvent(new Event(MANIFEST_CHANGED));
        return manifest;
      } catch (e) {
        failure = e;
        if (isDraft) {
          draftReachable = false;
          console.warn(`Draft page manifest could not be read (${e instanceof Error ? e.message : "network error"})${index === 0 ? "; retrying" : "; trying the public manifest"}.`);
        }
      }
    }
    throw new SiteManifestUnavailable(`Couldn't reach the site manifest (${failure instanceof Error ? failure.message : "network error"}).`);
  })();
  cached = { at: Date.now(), promise };
  promise.catch(() => { if (cached?.promise === promise) cached = null; }); // a failure isn't remembered
  return promise;
}

export function resetSiteManifestCache() { cached = null; }

export type PageRef = { path: string; type: "static" | "landing" };

/** Pages that render the object with this component_key. */
export function pagesUsingObject(m: SiteManifest, componentKey: string): PageRef[] {
  return m.pages.filter((p) => p.objects.includes(componentKey)).map((p) => ({ path: p.path, type: p.type }));
}

const blobs = new WeakMap<SiteManifest, Map<string, string>>();
function blobOf(m: SiteManifest, file: string): string {
  let per = blobs.get(m);
  if (!per) { per = new Map(); blobs.set(m, per); }
  let b = per.get(file);
  if (b === undefined) { b = (m.files[file]?.refs ?? []).join("\n"); per.set(file, b); }
  return b;
}

/** Pages whose files name any of these (case-insensitive: paths, file names, ids, addresses). */
export function pagesReferencing(m: SiteManifest, needles: string[]): PageRef[] {
  const lc = needles.map((n) => n.toLowerCase()).filter(Boolean);
  if (lc.length === 0) return [];
  return m.pages
    .filter((p) => p.files.some((f) => { const b = blobOf(m, f); return lc.some((n) => b.includes(n)); }))
    .map((p) => ({ path: p.path, type: p.type }));
}

/** Paths of the pages the manifest covers, i.e. pages that exist as code. Pages kept in the database aren't in it. */
export function codePagePaths(m: SiteManifest): Set<string> {
  return new Set(m.pages.map((p) => p.path));
}
