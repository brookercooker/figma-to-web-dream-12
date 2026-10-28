// The Site Manager's view of the public site: which pages it has and what each one uses.
//
// The public site writes `site-manifest.json` on every build (scripts/siteManifest.mjs). This file fetches it and answers
// "which pages use this object?" and "which pages refer to this image or video?" without reading any of the public site's
// code, so it keeps working when the two are separate projects.
//
// Prefer a manifest sent by the trusted public preview; HTTP is the last fallback.

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
let received: SiteManifest | null = null;
let messageDelayMs = 1500;
let listening = false;
let bridgeUsers = 0;
let receiver: HTMLIFrameElement | null = null;
let receiverCreated = false; // Hard lifetime cap: never navigate or recreate the hidden frame.
let observedFrame: HTMLIFrameElement | null = null;
let observer: MutationObserver | null = null;
let loggedFallback = false;
const waiters = new Set<(manifest: SiteManifest) => void>();
export function setManifestMessageDelay(ms: number) { messageDelayMs = ms; }
function originOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try { const parsed = new URL(url); return /^https?:$/.test(parsed.protocol) ? parsed.origin : null; } catch { return null; }
}
function publicOrigin() { return originOf(import.meta.env.VITE_PUBLIC_SITE_URL); }
function trustedOrigin(origin: string) { return origin === originOf(draftBase) || origin === publicOrigin(); }
function receiveManifest(event: MessageEvent) {
  const data = event.data;
  if (!trustedOrigin(event.origin) || !data || data.source !== "nova-site" || data.type !== "manifest") return;
  let manifest: SiteManifest;
  try { manifest = parseSiteManifest(data.manifest); } catch { return; }
  received = manifest;
  lastDraftReachable = !draftBase || event.origin === originOf(draftBase);
  cached = { at: Date.now(), promise: Promise.resolve(manifest), draftOk: lastDraftReachable };
  knownPaths = codePagePaths(manifest);
  waiters.forEach((resolve) => resolve(manifest));
  window.dispatchEvent(new Event(MANIFEST_CHANGED));
}
function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("message", receiveManifest);
}
/** Requests never include the embed token and never broadcast to an unknown origin. */
export function requestFrameManifest(frame: HTMLIFrameElement): boolean {
  if (frame.hasAttribute("data-site-editor") || new URL(frame.src, window.location.href).searchParams.has("nova-edit")) return false;
  const origin = originOf(frame.src);
  if (!origin || !trustedOrigin(origin) || !frame.contentWindow) return false;
  frame.contentWindow.postMessage({ source: "nova-manager", type: "request-manifest" }, origin);
  return true;
}
function requestObserved() { if (observedFrame) requestFrameManifest(observedFrame); }
export function isSafePublicFrameUrl(target: unknown): target is string {
  if (typeof target !== "string" || !target) return false;
  try {
    const url = new URL(target);
    return url.protocol === "https:" && url.origin !== window.location.origin;
  } catch { return false; }
}
function receiverTargetAllowed(): boolean {
  return window.self === window.top && isSafePublicFrameUrl(draftBase);
}
function reconcileReceiver() {
  if (!bridgeUsers) return;
  const real = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview]")).find((frame) => {
    if (frame.hasAttribute("data-site-editor") || new URL(frame.src, window.location.href).searchParams.has("nova-edit")) return false;
    const origin = originOf(frame.src); return origin && trustedOrigin(origin);
  });
  if (real || !receiverTargetAllowed()) { receiver?.remove(); receiver = null; }
  else if (draftBase) {
    if (!receiver && !receiverCreated) {
      receiverCreated = true;
      receiver = document.createElement("iframe");
      receiver.title = "Public Site Manifest Receiver";
      receiver.setAttribute("aria-hidden", "true");
      receiver.tabIndex = -1;
      receiver.dataset.manifestReceiver = "true";
      receiver.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;pointer-events:none";
      receiver.referrerPolicy = "origin";
      receiver.src = draftBase;
      document.body.appendChild(receiver);
    }
  }
  const frame = real ?? receiver;
  if (frame !== observedFrame) {
    observedFrame?.removeEventListener("load", requestObserved);
    observedFrame = frame;
    observedFrame?.addEventListener("load", requestObserved);
    requestObserved();
  }
}
/** One receiver across manager screens; real PreviewPanel frames take precedence. */
export function startSiteManifestBridge(): () => void {
  listen();
  bridgeUsers++;
  if (!observer) {
    observer = new MutationObserver(reconcileReceiver);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "data-site-preview"] });
  }
  reconcileReceiver();
  return () => {
    bridgeUsers--;
    if (bridgeUsers) return;
    observer?.disconnect(); observer = null;
    observedFrame?.removeEventListener("load", requestObserved); observedFrame = null;
    receiver?.remove(); receiver = null;
  };
}
async function requestManifest(): Promise<SiteManifest | null> {
  listen();
  const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview], iframe[data-manifest-receiver]"));
  if (!frames.length) return null;
  return new Promise((resolve) => {
    const finish = (manifest: SiteManifest | null) => { clearTimeout(timer); waiters.delete(onManifest); resolve(manifest); };
    const onManifest = (manifest: SiteManifest) => finish(manifest);
    const timer = setTimeout(() => finish(null), messageDelayMs);
    waiters.add(onManifest);
    if (!frames.some(requestFrameManifest)) finish(null);
  });
}
let knownPaths = new Set<string>();
let editingUsers = 0;
/** Invalidating a build must not erase the last known paths underneath an active editor. */
export function retainEditingManifestPaths(): () => void {
  editingUsers++;
  return () => { editingUsers--; };
}
export const MANIFEST_CHANGED = "nova-manifest-changed";
export function hasDraftManifestBase() { return !!draftBase; }
/** Preserve the embed query when composing a public edit-frame address. */
export function draftEmbedUrl() { return draftBase; }
export function setManifestBase(url: string) {
  if (url === draftBase) return;
  const sameOrigin = !!url && originOf(url) === originOf(draftBase);
  draftBase = url || null;
  if (!sameOrigin) resetSiteManifestCache();
  listen();
  reconcileReceiver();
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
  if (m.pages.some((p) => !p || typeof p.path !== "string" || !p.path.startsWith("/") || !["static", "landing"].includes(p.type) || typeof p.file !== "string" || !Array.isArray(p.objects) || p.objects.some((key) => typeof key !== "string") || !Array.isArray(p.files) || p.files.some((file) => typeof file !== "string")) || Object.values(m.files).some((file) => !file || !Array.isArray(file.refs) || file.refs.some((ref) => typeof ref !== "string"))) throw new SiteManifestUnavailable("The site manifest contains invalid pages or files.");
  return { objects: {}, buildId: "", generatedAt: "", ...m } as SiteManifest;
}

const TTL_MS = 60_000;
let draftRetryMs = 2000;
/** Tests: shorten the pause before the draft manifest is retried. */
export function setDraftRetryDelay(ms: number) { draftRetryMs = ms; }
let lastDraftReachable = true;
/** False when the last load could not read the draft preview's manifest (and fell back, or failed). */
/** Reflects the load that produced the current (possibly cached) manifest, so a cached fallback still reports the failure. */
export function draftManifestReachable() { return cached?.draftOk ?? lastDraftReachable; }
let cached: { at: number; promise: Promise<SiteManifest>; draftOk?: boolean } | null = null;

/** Fetch the manifest (kept for a minute). Throws SiteManifestUnavailable if it can't be had. */
export function loadSiteManifest(force = false): Promise<SiteManifest> {
  listen();
  if (!force && received && cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(received);
  if (!force && cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const entry: { at: number; promise: Promise<SiteManifest>; draftOk?: boolean } = { at: Date.now(), promise: null as unknown as Promise<SiteManifest> };
  const promise = (async () => {
    const delivered = await requestManifest();
    if (delivered) return delivered;
    if (received) return received;
    if (!loggedFallback) { console.debug("Public site manifest message unavailable; using HTTP fallback."); loggedFallback = true; }
    const draftUrl = siteManifestUrl();
    const urls = [...new Set([draftUrl, fallbackManifestUrl()])];
    // The draft address is tried twice (a short pause between) before falling back.
    if (draftBase) urls.splice(1, 0, draftUrl);
    let failure: unknown;
    let draftReachable = true;
    for (const [index, url] of urls.entries()) {
      const isDraft = !!draftBase && url === draftUrl;
      if (isDraft && index > 0) await new Promise((r) => setTimeout(r, draftRetryMs));
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new SiteManifestUnavailable(`The site manifest returned ${res.status}.`);
        const manifest = parseSiteManifest(await res.json());
        if (received) return received;
        knownPaths = codePagePaths(manifest);
        lastDraftReachable = draftReachable;
        entry.draftOk = draftReachable;
        window.dispatchEvent(new Event(MANIFEST_CHANGED));
        return manifest;
      } catch (e) {
        failure = e;
        if (isDraft) {
          draftReachable = false;
        }
      }
    }
    lastDraftReachable = draftReachable;
    throw new SiteManifestUnavailable(`Couldn't reach the site manifest (${failure instanceof Error ? failure.message : "network error"}).`);
  })();
  entry.promise = promise;
  cached = entry;
  promise.catch(() => { if (cached?.promise === promise) cached = null; }); // a failure isn't remembered
  return promise;
}

export function resetSiteManifestCache() { cached = null; received = null; if (!editingUsers) knownPaths = new Set(); }

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
