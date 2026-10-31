import { clean, originalLink, parseKey, type Fingerprint } from "@/lib/inlineEditCore";
import type { InlineSelection } from "@/components/InlineEditSurface";

export interface SelectionSnapshot {
  key: string;
  scope: string;
  kind: InlineSelection["kind"];
  side?: InlineSelection["side"];
  tag: string;
  text?: string;
  context?: string | { section?: string; role?: string };
  html?: string;
  rect?: Partial<DOMRectInit>;
  attrs?: Record<string, string | null>;
  style?: Record<string, string>;
  fingerprint?: Fingerprint;
  link?: { key: string; scope: string; tag?: string; attrs?: Record<string, string | null>; fingerprint?: Fingerprint };
}
export type EditQuery = (op: "computed" | "measure" | "scrollTo" | "record", scope: string, key: string, props?: string[]) => Promise<unknown>;
const snapshots = new WeakMap<HTMLElement, SelectionSnapshot>();
export type FormatCommand = "bold" | "italic" | "underline" | "strike" | "color" | "size" | "weight" | "font" | "clear";
export interface WordRange { key: string; scope: string; collapsed: boolean; text: string; marks: { bold: boolean; italic: boolean; underline: boolean; strike: boolean; color: string; size: string | number; weight: string | number; font: string } }
export interface RemoteFormatting { range: WordRange | null; format: (command: FormatCommand, value?: string) => void }
const formatting = new WeakMap<HTMLElement, RemoteFormatting>();
export const remoteFormatting = (el: HTMLElement) => formatting.get(el);
export function validWordRange(value: unknown): value is WordRange {
  if (!value || typeof value !== "object") return false;
  const r = value as WordRange;
  return validPath(r.key) && typeof r.scope === "string" && !!r.scope && typeof r.collapsed === "boolean" && typeof r.text === "string" && r.text.length <= 100000 && !!r.marks &&
    [r.marks.bold, r.marks.italic, r.marks.underline, r.marks.strike].every(v => typeof v === "boolean") &&
    [r.marks.color, r.marks.font].every(v => typeof v === "string") && [r.marks.size, r.marks.weight].every(v => typeof v === "string" || (typeof v === "number" && Number.isFinite(v)));
}

export function remoteSnapshot(el: HTMLElement) { return snapshots.get(el); }
export function selectionComputedStyle(el: HTMLElement): CSSStyleDeclaration {
  const snapshot = snapshots.get(el);
  if (!snapshot) return getComputedStyle(el);
  const style = document.createElement("span").style;
  for (const [key, value] of Object.entries(snapshot.style ?? {})) {
    style.setProperty(key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), value);
  }
  return style;
}
function validPath(key: unknown): key is string { return typeof key === "string" && !!parseKey(`style:${key}`); }
export function validSnapshot(value: unknown): value is SelectionSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as SelectionSnapshot;
  if ((s.kind as string) === "field") s.kind = "input"; // Older frames called form fields "field".
  return validPath(s.key) && typeof s.scope === "string" && !!s.scope &&
    ["text", "image", "video", "divider", "locked", "input"].includes(s.kind) && typeof s.tag === "string" && /^[a-z][a-z0-9-]*$/i.test(s.tag) &&
    (s.text === undefined || typeof s.text === "string") && (s.context === undefined || typeof s.context === "string" ||
      (!!s.context && typeof s.context === "object" && !Array.isArray(s.context) &&
        (s.context.section === undefined || typeof s.context.section === "string") &&
        (s.context.role === undefined || typeof s.context.role === "string"))) && (s.html === undefined || typeof s.html === "string") &&
    (s.style === undefined || (!!s.style && typeof s.style === "object" && Object.values(s.style).every((v) => typeof v === "string"))) &&
    (!s.link || (validPath(s.link.key) && typeof s.link.scope === "string"));
}

/** Detached, inert DOM supports read-only panel queries, never impersonates a live Range. */
export function remoteSelection(snapshot: SelectionSnapshot, query?: EditQuery, words?: RemoteFormatting): InlineSelection {
  const el = document.createElement(snapshot.tag);
  if (snapshot.html !== undefined) el.innerHTML = clean(snapshot.html);
  else el.textContent = snapshot.text ?? "";
  for (const key of ["href", "src", "alt", "target", "poster", "title", "placeholder", "type", "label"]) {
    const value = snapshot.attrs?.[key];
    if (typeof value === "string") el.setAttribute(key, value);
  }
  snapshots.set(el, snapshot);
  if (words) formatting.set(el, words);
  el.getBoundingClientRect = () => {
    const { x = 0, y = 0, width = 0, height = 0 } = snapshot.rect ?? {};
    return { x, y, width, height, top: y, left: x, right: x + width, bottom: y + height, toJSON: () => ({ x, y, width, height }) };
  };
  el.scrollIntoView = () => { void query?.("scrollTo", snapshot.scope, snapshot.key); };
  let link: InlineSelection["link"];
  const info = snapshot.link ?? ((snapshot.tag.toLowerCase() === "a" || snapshot.tag.toLowerCase() === "button" || snapshot.attrs?.href) ? { key: snapshot.key, scope: snapshot.scope, tag: snapshot.tag, attrs: snapshot.attrs } : undefined);
  if (info) {
    const target = info.key === snapshot.key && info.scope === snapshot.scope ? el : document.createElement(info.tag ?? "a");
    for (const key of ["href", "target"]) {
      const value = info.attrs?.[key];
      if (typeof value === "string") target.setAttribute(key, value);
    }
    originalLink(target); // Freeze the serialized original destination before panel edits.
    link = { key: info.key, scope: info.scope, el: target };
    if (target !== el) target.appendChild(el); // closest("a,button") for icon controls.
  }
  return { key: snapshot.key, scope: snapshot.scope, kind: snapshot.kind, side: snapshot.side, el, link };
}