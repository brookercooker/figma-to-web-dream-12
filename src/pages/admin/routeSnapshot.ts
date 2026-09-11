// Serial hidden-iframe snapshot capture for arbitrary routes.
// Used by:
//  - Page thumbnails in the Site Manager (route = page.path)
//  - Link Audit scanner (custom callback via withRouteIframe)
//
// Captures run one at a time globally via a plain task queue. Do NOT chain via
// `chain = chain.then(...)`; nesting queue calls inside a queue callback (e.g.
// captureOnce → withRouteIframe) causes the outer callback to await a task
// that is queued *behind* itself → permanent deadlock.

import html2canvas from "html2canvas";

const CACHE_VERSION = "v4";
const cacheKey = (key: string) => `routesnap:${CACHE_VERSION}:${key}`;

const inflight = new Map<string, Promise<string | null>>();

type Task = () => Promise<void>;
const queue: Task[] = [];
let running = false;

function enqueue(task: Task) {
  queue.push(task);
  if (!running) void drain();
}

async function drain() {
  running = true;
  try {
    while (queue.length) {
      const t = queue.shift()!;
      try { await t(); } catch { /* task errors are swallowed here; task resolves its own promise */ }
    }
  } finally {
    running = false;
  }
}

const CAPTURE_WIDTH = 1280;
const CAPTURE_HEIGHT = 1200;   // capture the top portion so hero + a few sections show
const SETTLE_MS = 400;         // small final settle after prepareForCapture

export function getCachedRouteSnapshot(key: string): string | null {
  try { return localStorage.getItem(cacheKey(key)); } catch { return null; }
}
export function clearRouteSnapshot(key: string) {
  try { localStorage.removeItem(cacheKey(key)); } catch { /* noop */ }
}

/** Clear every cached routesnap entry so thumbnails refetch fresh. */
export function clearAllRouteSnapshots() {
  try {
    const prefix = `routesnap:${CACHE_VERSION}:`;
    const hiPrefix = `routesnap-hi:${CACHE_VERSION}:`;
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(prefix) || k.startsWith(hiPrefix))) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch { /* noop */ }
}

/**
 * Force page body content to fully render before capture:
 *  - Wait for iframe load
 *  - Flip every lazy image/iframe to eager
 *  - Scroll top → bottom → top to trip IntersectionObserver-based reveals
 *  - Await fonts.ready and every <img> completion
 *  - Small final settle for any remaining animation frames
 */
async function prepareForCapture(iframe: HTMLIFrameElement, captureHeight: number) {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) return;

  // 1. Force eager loading on everything lazy.
  doc.querySelectorAll('img[loading="lazy"]').forEach((el) => { (el as HTMLImageElement).loading = "eager"; });
  doc.querySelectorAll('iframe[loading="lazy"]').forEach((el) => { (el as HTMLIFrameElement).loading = "eager"; });

  // 2. Scroll pass to trigger IntersectionObserver/viewport-triggered content.
  const totalHeight = () => Math.max(
    doc.body?.scrollHeight ?? 0,
    doc.documentElement?.scrollHeight ?? 0,
  );
  const step = 500;
  const scrollMax = Math.min(totalHeight(), Math.max(captureHeight * 3, 3000));
  for (let y = 0; y <= scrollMax; y += step) {
    try { win.scrollTo(0, y); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  try { win.scrollTo(0, 0); } catch { /* noop */ }

  // 3. Wait for fonts.
  try { await (doc as any).fonts?.ready; } catch { /* noop */ }

  // 4. Wait for every img (with a per-image timeout so one broken asset can't hang capture).
  const imgs = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[];
  await Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((res) => {
      const done = () => res();
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
      setTimeout(done, 3500);
    });
  }));

  // 5. Final paint settle.
  await new Promise((r) => setTimeout(r, SETTLE_MS));
}

/**
 * Load a route in a hidden iframe, run `onReady` against its document, then remove.
 * Serial across all callers.
 */
export function withRouteIframe<T>(
  route: string,
  onReady: (doc: Document) => T | Promise<T>,
  settleMs = 1200,
): Promise<T | null> {
  return new Promise((resolve) => {
    enqueue(async () => {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.setAttribute("tabindex", "-1");
      iframe.style.cssText =
        "position:fixed;left:-10000px;top:0;width:1280px;height:800px;border:0;pointer-events:none;visibility:hidden";
      document.body.appendChild(iframe);
      try {
        await new Promise<void>((res) => {
          let done = false;
          const finish = () => { if (done) return; done = true; res(); };
          iframe.addEventListener("load", finish, { once: true });
          setTimeout(finish, 8000);
          iframe.src = route;
        });
        await new Promise((r) => setTimeout(r, settleMs));
        const doc = iframe.contentDocument;
        const result = doc ? await onReady(doc) : null;
        resolve(result as T | null);
      } catch {
        resolve(null);
      } finally {
        iframe.remove();
      }
    });
  });
}

async function captureRoute(
  route: string,
  width: number,
  height: number,
  scale: number,
  quality: number,
): Promise<string | null> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.style.cssText =
    `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;border:0;pointer-events:none;visibility:hidden`;
  document.body.appendChild(iframe);
  let dataUrl: string | null = null;
  try {
    await new Promise<void>((res) => {
      let done = false;
      const finish = () => { if (done) return; done = true; res(); };
      iframe.addEventListener("load", finish, { once: true });
      setTimeout(finish, 10000);
      iframe.src = route;
    });
    await prepareForCapture(iframe, height);
    const doc = iframe.contentDocument;
    if (doc?.body) {
      try {
        const canvas = await html2canvas(doc.body, {
          width, height,
          windowWidth: width, windowHeight: height,
          x: 0, y: 0,
          backgroundColor: "#ffffff", logging: false,
          useCORS: true, allowTaint: true, scale,
        });
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      } catch { /* html2canvas failure */ }
    }
  } catch { /* noop */ }
  finally { iframe.remove(); }
  return dataUrl;
}

/**
 * Request a snapshot for a route. Runs one at a time. Directly enqueues the
 * capture work — must NOT call withRouteIframe (double-queueing = deadlock).
 */
export function requestRouteSnapshot(route: string, key = route): Promise<string | null> {
  const cached = getCachedRouteSnapshot(key);
  if (cached) return Promise.resolve(cached);
  if (inflight.has(key)) return inflight.get(key)!;

  const p = new Promise<string | null>((resolve) => {
    enqueue(async () => {
      const dataUrl = await captureRoute(route, CAPTURE_WIDTH, CAPTURE_HEIGHT, 0.3, 0.7);
      if (dataUrl) {
        try { localStorage.setItem(cacheKey(key), dataUrl); } catch { /* quota */ }
      }
      resolve(dataUrl);
    });
  });
  inflight.set(key, p);
  p.finally(() => inflight.delete(key));
  return p;
}

// ---------- Hi-res on-demand snapshot for the preview modal ----------
// Kept out of localStorage (too large). In-memory cache only.
const HIRES_WIDTH = 1440;
const HIRES_HEIGHT = 1600;
const hiResCache = new Map<string, string>();
const hiResInflight = new Map<string, Promise<string | null>>();

export function getCachedHiResSnapshot(key: string): string | null {
  return hiResCache.get(key) ?? null;
}

export function requestHiResSnapshot(route: string, key = route): Promise<string | null> {
  const cached = hiResCache.get(key);
  if (cached) return Promise.resolve(cached);
  if (hiResInflight.has(key)) return hiResInflight.get(key)!;

  const p = new Promise<string | null>((resolve) => {
    enqueue(async () => {
      const dataUrl = await captureRoute(route, HIRES_WIDTH, HIRES_HEIGHT, 1, 0.9);
      if (dataUrl) hiResCache.set(key, dataUrl);
      resolve(dataUrl);
    });
  });
  hiResInflight.set(key, p);
  p.finally(() => hiResInflight.delete(key));
  return p;
}
