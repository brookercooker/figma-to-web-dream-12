/**
 * The pencil on the Preview tab: the strokes, how they are drawn, and how they are turned into what the design service gets.
 * Kept free of React so the rules can be tested. Positions are stored as 0 to 1 across the preview, so they survive resizing.
 */

export type Pt = { x: number; y: number };
export type Stroke = Pt[];
export type Box = { x: number; y: number; w: number; h: number };

export const MAX_STROKES = 12;
export const MIN_STROKE_PX = 8;
export const MAX_POINTS = 300;
/** Red with a white edge, so it shows on both dark and light parts of a page. */
export const INK = "#e11d48";
export const INK_EDGE = "rgba(255,255,255,0.92)";

/** What the previewed site reports under one stroke (see the site's annotateBridge). */
export type SiteElement = {
  tag: string; text?: string; selector?: string; component?: string; file?: string; line?: number;
  alt?: string; href?: string; section?: string;
};
export type SiteReply = {
  view: { scrollY: number; pageHeight: number; width: number; height: number };
  strokes: { elements: SiteElement[] }[];
};

/** What is sent to the design service with a request (it checks every field again). */
export type MarksPayload = {
  path: string | null; device: string; width: number; height: number; scrollY: number | null; pageHeight: number | null;
  marks: (Box & { elements: SiteElement[] })[];
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function boxOf(s: Stroke): Box {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const p of s) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return s.length ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 0, h: 0 };
}

/** Length of a stroke in screen pixels, for telling a drawing from an accidental click. */
export function lengthPx(s: Stroke, w: number, h: number): number {
  let len = 0;
  for (let i = 1; i < s.length; i++) len += Math.hypot((s[i].x - s[i - 1].x) * w, (s[i].y - s[i - 1].y) * h);
  return len;
}

/** At most `max` points, evenly spread, always keeping the first and the last. */
export function thin(s: Stroke, max = MAX_POINTS): Stroke {
  if (s.length <= max) return s;
  const out: Stroke = [];
  for (let i = 0; i < max; i++) out.push(s[Math.round((i * (s.length - 1)) / (max - 1))]);
  return out;
}

/** Adds a point only when the pointer has moved a little, so a slow drag doesn't make thousands of points. */
export function addPoint(s: Stroke, p: Pt, w: number, h: number, minPx = 2): boolean {
  const last = s[s.length - 1];
  if (last && Math.hypot((p.x - last.x) * w, (p.y - last.y) * h) < minPx) return false;
  s.push({ x: clamp01(p.x), y: clamp01(p.y) });
  return true;
}

/** Draws every stroke (a white edge first, then the colour) on a canvas that is `w` by `h` CSS pixels. */
export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: readonly Stroke[], w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const pass of [{ color: INK_EDGE, width: 7.5 }, { color: INK, width: 3.5 }]) {
    ctx.strokeStyle = pass.color;
    ctx.fillStyle = pass.color;
    ctx.lineWidth = pass.width;
    for (const s of strokes) {
      if (!s.length) continue;
      if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0].x * w, s[0].y * h, pass.width / 2, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.beginPath();
      ctx.moveTo(s[0].x * w, s[0].y * h);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x * w, s[i].y * h);
      ctx.stroke();
    }
  }
}

/** Asks the previewed site what is under each stroke. Resolves to null if it doesn't answer in time (an older site, say). */
export function askSite(frame: HTMLIFrameElement | null, strokes: readonly Stroke[], timeoutMs = 1500): Promise<SiteReply | null> {
  return new Promise((resolve) => {
    const target = frame?.contentWindow;
    let origin = "";
    try { origin = frame ? new URL(frame.src).origin : ""; } catch { /* no address */ }
    if (!frame || !target || !origin || origin === "null") { resolve(null); return; }
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const done = (r: SiteReply | null) => { window.removeEventListener("message", onMessage); clearTimeout(timer); resolve(r); };
    const onMessage = (ev: MessageEvent) => {
      const d = ev.data;
      if (ev.source !== target || ev.origin !== origin || !d || typeof d !== "object" || d.source !== "nova-site" || d.type !== "annotate-result" || d.id !== id) return;
      if (!d.view || typeof d.view !== "object" || !Array.isArray(d.strokes)) { done(null); return; }
      done({ view: d.view, strokes: d.strokes });
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    window.addEventListener("message", onMessage);
    try { target.postMessage({ source: "nova-manager", type: "annotate-query", id, strokes: strokes.map((s) => thin(s, 80)) }, origin); }
    catch { done(null); }
  });
}

/** Everything the design service needs to know about the drawing. `reply` is what the site said (or null). */
export function buildMarks(o: { strokes: readonly Stroke[]; width: number; height: number; device: string; path: string | null; reply: SiteReply | null }): MarksPayload {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    path: o.path, device: o.device, width: Math.round(o.width), height: Math.round(o.height),
    scrollY: num(o.reply?.view?.scrollY), pageHeight: num(o.reply?.view?.pageHeight),
    marks: o.strokes.map((s, i) => ({ ...boxOf(s), elements: o.reply?.strokes?.[i]?.elements ?? [] })),
  };
}
