/** Shared verbatim between the Site Manager and the public site. Edit both together. */
import DOMPurify from "dompurify";

export type InlineEdits = Record<string, string>;
export type Kind = "html" | "style" | "img" | "icon" | "fp";
export interface Fingerprint { v: 1; tag: string; t: string; s?: string }
export interface ReplayReport {
  applied: string[];
  orphaned: { path: string; kinds: Kind[]; reason: string }[];
  unchecked: string[];
  rejected: { key: string; reason: string }[];
}
const PATH = /^(\d+(\.\d+)*)?$/;
export function parseKey(key: string): { kind: Kind; path: string } | null {
  const colon = key.indexOf(":");
  const kind = colon < 0 ? "html" : key.slice(0, colon);
  const path = colon < 0 ? key : key.slice(colon + 1);
  return ["html", "style", "img", "icon", "fp"].includes(kind) &&
    (colon < 0 || kind !== "html") && PATH.test(path) ? { kind: kind as Kind, path } : null;
}
// Properties written by InlineStylePanel, plus the existing surface's reorder controls.
const PROPERTIES = new Set([
  "font-weight", "font-style", "text-transform", "text-decoration", "text-align", "font-family",
  "font-size", "color", "letter-spacing", "line-height", "width", "height", "object-fit", "border-radius",
  "visibility", "background-color", "margin-top", "margin-bottom", "display", "flex-direction", "order",
  ...["top", "bottom", "left", "right"].flatMap((side) =>
    ["color", "style", "width"].map((part) => `border-${side}-${part}`)),
]);
const unsafeCss = /url\s*\(|expression\s*\(|javascript\s*:|@import/i;
export const clean = (html: string): string => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "br", "span", "u", "font", "svg", "path", "circle", "line", "polyline", "polygon", "rect"],
  ALLOWED_ATTR: ["style", "color", "class", "viewBox", "d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "width", "height", "cx", "cy", "r", "x", "y", "x1", "y1", "x2", "y2", "rx", "ry", "points", "xmlns", "aria-hidden", "data-inline-icon"],
});
function isFingerprint(value: unknown): value is Fingerprint {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const f = value as Record<string, unknown>;
  return f.v === 1 && typeof f.tag === "string" && typeof f.t === "string" &&
    (f.s === undefined || typeof f.s === "string");
}
export function validateEdits(edits: unknown): { ok: InlineEdits; rejected: ReplayReport["rejected"] } {
  const ok: InlineEdits = {}, rejected: ReplayReport["rejected"] = [];
  if (!edits || typeof edits !== "object" || Array.isArray(edits)) return { ok, rejected: [{ key: "", reason: "Edits must be an object" }] };
  for (const [key, value] of Object.entries(edits)) {
    const parsed = parseKey(key);
    let reason = "";
    if (!parsed) reason = "Unknown edit key or invalid path";
    else if (typeof value !== "string") reason = "Edit must be a string";
    else if (parsed.kind === "style") {
      try {
        const style: unknown = JSON.parse(value);
        if (!style || typeof style !== "object" || Array.isArray(style) ||
          Object.entries(style).some(([prop, v]) => !PROPERTIES.has(prop) || typeof v !== "string" || unsafeCss.test(v)))
          reason = "Style contains an unsupported property or unsafe value";
      } catch { reason = "Style must be a JSON object of strings"; }
    } else if (parsed.kind === "img") {
      if (!/^\/(?!\/)/.test(value) && !/^data:image\//i.test(value)) {
        try { const url = new URL(value); if (url.protocol !== "https:" || !url.hostname) reason = "Picture address is not allowed"; }
        catch { reason = "Picture address is not allowed"; }
      }
      if (/[\u0000-\u001f\u007f]/.test(value) || value.includes("\\")) reason = "Picture address is not allowed";
    } else if (parsed.kind === "fp") {
      try { if (!isFingerprint(JSON.parse(value))) reason = "Invalid fingerprint"; }
      catch { reason = "Invalid fingerprint"; }
    }
    if (reason) rejected.push({ key, reason });
    else if (typeof value === "string") ok[key] = value;
  }
  return { ok, rejected };
}
const hash = (value: string): string => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
};
export function fingerprintOf(el: Element): Fingerprint {
  return { v: 1, tag: el.tagName.toLowerCase(), t: hash((el.textContent ?? "").replace(/\s+/g, " ").trim()),
    ...(el.tagName.toLowerCase() === "img" ? { s: hash((el.getAttribute("src") ?? "").split(/[?#]/)[0]) } : {}) };
}
export function fingerprintMatches(saved: Partial<Fingerprint>, current: Fingerprint): boolean {
  return saved.tag === current.tag && (saved.t === undefined || saved.t === current.t) &&
    (saved.s === undefined || saved.s === current.s);
}
interface Original { html: string; src: string | null; srcset: string | null; style: string | null; icon: boolean; fp: Fingerprint }
// Shared snapshots also let withFingerprints read originals after replay/typing.
const originals = new WeakMap<Element, Original>();
function snapshot(el: Element): Original {
  let original = originals.get(el);
  if (!original) {
    original = { html: el.innerHTML, src: el.getAttribute("src"), srcset: el.getAttribute("srcset"),
      style: el.getAttribute("style"), icon: !!el.querySelector("svg"), fp: fingerprintOf(el) };
    originals.set(el, original);
  }
  return original;
}
export function resolvePath(root: Element, path: string): Element | null {
  if (!PATH.test(path)) return null;
  let el: Element | null = root;
  for (const index of path === "" ? [] : path.split(".")) el = el?.children[Number(index)] ?? null;
  return el;
}
export function hasVisibleEdits(edits: InlineEdits): boolean {
  return Object.keys(edits).some((key) => { const p = parseKey(key); return p && p.kind !== "fp"; });
}
export function withoutPath(edits: InlineEdits, path: string): InlineEdits {
  return Object.fromEntries(Object.entries(edits).filter(([key]) => parseKey(key)?.path !== path));
}
export function withFingerprints(edits: InlineEdits, root: Element, resolve: (root: Element, path: string) => Element | null = resolvePath): InlineEdits {
  const out = { ...edits };
  const paths = new Set(Object.keys(out).flatMap((key) => { const p = parseKey(key); return p && p.kind !== "fp" ? [p.path] : []; }));
  for (const key of Object.keys(out)) { const p = parseKey(key); if (p?.kind === "fp" && !paths.has(p.path)) delete out[key]; }
  for (const path of paths) {
    if (`fp:${path}` in out) continue;
    const el = resolve(root, path);
    if (el) out[`fp:${path}`] = JSON.stringify(snapshot(el).fp);
  }
  return out;
}
interface Applied { el: Element; kinds: Set<Kind>; styleProps: Set<string>; html?: string; icon?: string }
export interface ReplayOptions {
  /** Adapter for the existing icon library; keeps this shared file free of React/app imports. */
  iconMarkup?: (name: string, className: string) => string | null;
}
function attribute(el: Element, key: string, value: string | null) {
  if (el.getAttribute(key) === value) return;
  if (value === null) el.removeAttribute(key); else el.setAttribute(key, value);
}
function restore(entry: Applied, kinds: Set<Kind>) {
  const o = snapshot(entry.el), el = entry.el;
  if ((kinds.has("html") || kinds.has("icon")) && el.innerHTML !== o.html) el.innerHTML = o.html;
  if (kinds.has("img")) { attribute(el, "src", o.src); attribute(el, "srcset", o.srcset); }
  if (kinds.has("style")) attribute(el, "style", o.style);
}
export function createReplay() {
  const roots = new Map<Element, Map<string, Applied>>();
  return {
    apply(root: Element, edits: InlineEdits, opts: ReplayOptions = {}): ReplayReport {
      const { ok, rejected } = validateEdits(edits);
      const report: ReplayReport = { applied: [], orphaned: [], unchecked: [], rejected };
      // Snapshot ancestors and descendants before ANY override (including parent HTML) is written.
      snapshot(root); root.querySelectorAll("*").forEach(snapshot);
      const groups = new Map<string, { kind: Kind; key: string; value: string }[]>();
      for (const [key, value] of Object.entries(ok)) {
        const p = parseKey(key);
        if (!p || p.kind === "fp") continue;
        const group = groups.get(p.path) ?? []; group.push({ ...p, key, value }); groups.set(p.path, group);
      }
      const previous = roots.get(root) ?? new Map<string, Applied>();
      const next = new Map<string, Applied>();
      // Remove old overrides first; also restore the old node if a path now points elsewhere.
      for (const [path, entry] of previous) {
        const kinds = new Set(groups.get(path)?.map((v) => v.kind) ?? []);
        if (!groups.has(path) || resolvePath(root, path) !== entry.el) restore(entry, entry.kinds);
        else {
          const removed = new Set([...entry.kinds].filter((kind) => !kinds.has(kind)));
          restore(entry, removed);
          // Restoring HTML/icon must invalidate the other content kind's cache too.
          if (removed.has("html") || removed.has("icon")) { entry.html = undefined; entry.icon = undefined; }
        }
      }
      for (const [path, group] of [...groups].sort(([a], [b]) => a.split(".").length - b.split(".").length)) {
        const el = resolvePath(root, path), kinds = group.map((v) => v.kind);
        let reason = "";
        if (!el) reason = "This part of the page is no longer there.";
        else if (kinds.includes("img") && el.tagName.toLowerCase() !== "img") reason = "This part of the page is no longer a picture.";
        else if ((kinds.includes("html") || kinds.includes("icon")) && /^(img|input|br|hr|video|iframe|svg)$/i.test(el.tagName)) reason = "This part of the page is no longer the right kind of element.";
        const fpKey = `fp:${path}`;
        if (!reason && el && fpKey in edits) {
          if (!(fpKey in ok)) reason = "The saved verification information is not valid.";
          else if (!fingerprintMatches(JSON.parse(ok[fpKey]), snapshot(el).fp)) reason = "The text or picture under it changed in the code since this edit was made.";
        }
        if (reason || !el) {
          const old = previous.get(path); if (old) restore(old, old.kinds);
          report.orphaned.push({ path, kinds, reason }); continue;
        }
        if (!(fpKey in edits)) report.unchecked.push(path);
        const o = snapshot(el), old = previous.get(path);
        const entry: Applied = old?.el === el ? old : { el, kinds: new Set(), styleProps: new Set() };
        const values = new Map(group.map((v) => [v.kind, v.value]));
        const html = values.get("html"), icon = values.get("icon");
        // Compose HTML and icon together so repeated replay never oscillates between them.
        if (html !== undefined || icon !== undefined) {
          const base = html === undefined ? o.html : clean(html);
          const holder = document.createElement("div"); holder.innerHTML = base;
          if (icon !== undefined) {
            const svg = holder.querySelector("svg");
            if (icon === "none") { if (svg) { (svg as SVGElement).style.display = "none"; svg.setAttribute("data-inline-icon", "none"); } }
            else {
              const markup = opts.iconMarkup?.(icon, svg?.getAttribute("class") ?? "inline-block h-4 w-4 ml-2 align-[-2px]");
              if (markup) {
                const shell = document.createElement("div"); shell.innerHTML = clean(markup);
                const replacement = shell.querySelector("svg");
                if (replacement) { replacement.setAttribute("data-inline-icon", icon); if (svg) svg.replaceWith(replacement); else holder.append(replacement); }
              }
            }
          }
          if (document.activeElement !== el && el.innerHTML !== holder.innerHTML) el.innerHTML = holder.innerHTML;
          entry.html = html; entry.icon = icon;
        }
        const styleValue = values.get("style");
        if (styleValue !== undefined && el instanceof HTMLElement) {
          const style = JSON.parse(styleValue) as Record<string, string>;
          const base = document.createElement("div"); if (o.style !== null) base.setAttribute("style", o.style);
          for (const prop of entry.styleProps) if (!(prop in style)) {
            const v = base.style.getPropertyValue(prop), priority = base.style.getPropertyPriority(prop);
            if (el.style.getPropertyValue(prop) !== v || el.style.getPropertyPriority(prop) !== priority) {
              if (v) el.style.setProperty(prop, v, priority); else el.style.removeProperty(prop);
            }
          }
          for (const [prop, v] of Object.entries(style)) if (el.style.getPropertyValue(prop) !== v || el.style.getPropertyPriority(prop) !== "important") el.style.setProperty(prop, v, "important");
          entry.styleProps = new Set(Object.keys(style));
        }
        const img = values.get("img");
        if (img !== undefined) { attribute(el, "src", img); attribute(el, "srcset", null); }
        entry.kinds = new Set(kinds); next.set(path, entry);
        report.applied.push(...group.map((v) => v.key));
      }
      roots.set(root, next);
      return report;
    },
    restoreAll() { for (const entries of roots.values()) for (const entry of entries.values()) restore(entry, entry.kinds); roots.clear(); },
  };
}
