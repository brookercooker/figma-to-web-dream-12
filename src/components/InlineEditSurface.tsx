/**
 * In-place editing for pages built in code. The page renders exactly as
 * visitors see it; text can be typed over directly and pictures swapped.
 *
 * Changes are stored as overrides keyed by each element's position. Parts of
 * the page that come from shared Objects keep their own overrides (keyed from
 * the object's top element), so they apply wherever that object is used.
 *
 * While editing, the page is shown divided into sections with a heading bar
 * each; bars fold a section away and can be dragged to reorder sections.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChevronDown, ChevronRight, ExternalLink, GripVertical, icons } from "lucide-react";
import DOMPurify from "dompurify";
import { findObjectRoots, loadObjectComponents, objectComponentsNow, type ObjectRoot } from "@/lib/objectScopes";
import { pageChunks, chunkName } from "@/pages/admin/codedPages";

export type InlineEdits = Record<string, string>;
/** "page" or the registry key of a shared object. */
export type InlineScope = string;
/** `side` is set when the line is an edge (border) of a larger element. */
export interface InlineSelection { key: string; kind: "text" | "image" | "divider"; el: HTMLElement; scope: InlineScope; side?: "top" | "bottom" | "left" | "right" }
/** Icons offered for buttons and links (lucide names). */
export const LINK_ICONS = ["ArrowRight", "ArrowUpRight", "ChevronRight", "ExternalLink", "Plus", "MapPin", "Phone", "Mail", "Calendar", "ShoppingBag", "Heart", "Download", "Play", "Search", "Star", "Sparkles", "Lightbulb", "Lamp"] as const;
export const styleKey = (key: string) => `style:${key}`;
export const readStyle = (edits: InlineEdits, key: string): Record<string, string> => {
  try { return JSON.parse(edits[styleKey(key)] ?? "{}"); } catch { return {}; }
};

const TEXT_TAGS = "h1,h2,h3,h4,h5,h6,p,li,a,button,span,blockquote,figcaption,dt,dd,label,small,em,strong";
const BLOCKISH = /^(DIV|SECTION|ARTICLE|UL|OL|IMG|VIDEO|IFRAME|SVG|FORM|INPUT|TEXTAREA|SELECT|H[1-6]|P|LI|FIGURE|TABLE|NAV|HEADER|FOOTER|BUTTON)$/;
const BAR = 40; // height of a section's heading bar while editing

export function pathOf(root: Element, el: Element): string {
  const parts: number[] = [];
  let n: Element | null = el;
  while (n && n !== root) {
    const p: Element | null = n.parentElement;
    if (!p) break;
    parts.unshift([...p.children].indexOf(n));
    n = p;
  }
  return parts.join(".");
}

function byPath(root: Element, path: string): Element | null {
  if (path === "") return root;
  let n: Element | null = root;
  for (const i of path.split(".")) {
    if (!n) return null;
    n = n.children[Number(i)] ?? null;
  }
  return n;
}

const clean = (html: string) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "br", "span", "u", "font", "svg", "path", "circle", "line", "polyline", "polygon", "rect"],
    ALLOWED_ATTR: ["style", "color", "class", "viewBox", "d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "width", "height", "cx", "cy", "r", "x", "y", "x1", "y1", "x2", "y2", "rx", "ry", "points", "xmlns", "aria-hidden", "data-inline-icon"],
  });

/** Swap (or hide) the icon inside a button or link. Value: lucide name, or "none". */
function applyIcon(el: HTMLElement, value: string) {
  const old = el.querySelector("svg");
  if (old?.getAttribute("data-inline-icon") === value) return;
  if (value === "none") { if (old) { old.style.display = "none"; old.setAttribute("data-inline-icon", "none"); } return; }
  const Icon = (icons as Record<string, Parameters<typeof createElement>[0]>)[value];
  if (!Icon) return;
  const cls = old?.getAttribute("class") ?? "inline-block h-4 w-4 ml-2 align-[-2px]";
  const holder = document.createElement("span");
  holder.innerHTML = renderToStaticMarkup(createElement(Icon as React.ComponentType<Record<string, unknown>>, { className: cls, "aria-hidden": true }));
  const svg = holder.firstElementChild as SVGElement;
  svg.setAttribute("data-inline-icon", value);
  if (old) old.replaceWith(svg); else el.appendChild(svg);
}

/** Which border edge of `el` (if any) sits within a few pixels of the point. */
function edgeAt(el: HTMLElement, x: number, y: number): InlineSelection["side"] | null {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const has = (s: string) => parseFloat(cs.getPropertyValue(`border-${s}-width`)) > 0 && cs.getPropertyValue(`border-${s}-style`) !== "none";
  const inX = x >= r.left - 5 && x <= r.right + 5, inY = y >= r.top - 5 && y <= r.bottom + 5;
  if (inX && has("top") && Math.abs(y - r.top) <= 5) return "top";
  if (inX && has("bottom") && Math.abs(y - r.bottom) <= 5) return "bottom";
  if (inY && has("left") && Math.abs(x - r.left) <= 5) return "left";
  if (inY && has("right") && Math.abs(x - r.right) <= 5) return "right";
  return null;
}

/** Thin, empty lines used as decorative rules. */
function isDivider(el: HTMLElement): boolean {
  if (el.children.length || (el.textContent ?? "").trim()) return false;
  if (/^(IMG|VIDEO|IFRAME|INPUT|SVG|BR|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName)) return false;
  if (el.tagName === "HR") return true;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const thin = (r.height <= 4 && r.width >= 12) || (r.width <= 4 && r.height >= 12);
  if (!thin) return false;
  const cs = getComputedStyle(el);
  const bg = cs.backgroundColor;
  return (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
}

function editableTexts(root: Element): HTMLElement[] {
  return ([...root.querySelectorAll(TEXT_TAGS)] as HTMLElement[]).filter((el) => {
    if (!(el.textContent ?? "").trim()) return false;
    if (el.closest("[data-inline-skip],form,header,footer,nav,[role=banner],[role=contentinfo]")) return false;
    if ([...el.children].some((c) => BLOCKISH.test(c.tagName))) return false;
    const parent = el.parentElement;
    if (parent && parent !== root && parent.matches(TEXT_TAGS) && ![...parent.children].some((c) => BLOCKISH.test(c.tagName))) return false;
    return true;
  });
}

function applyEdits(root: Element, edits: InlineEdits, tag: string) {
  const attr = `data-inline-styled-${tag}`;
  const entries = Object.entries(edits).sort(([a], [b]) => Number(a.startsWith("icon:")) - Number(b.startsWith("icon:")));
  for (const [key, value] of entries) {
    if (key.startsWith("icon:")) {
      const el = byPath(root, key.slice(5)) as HTMLElement | null;
      if (el) applyIcon(el, value);
    } else if (key.startsWith("style:")) {
      const el = byPath(root, key.slice(6)) as HTMLElement | null;
      if (!el) continue;
      let obj: Record<string, string> = {};
      try { obj = JSON.parse(value); } catch { /* ignore */ }
      (el.getAttribute(attr) ?? "").split(",").filter(Boolean).forEach((prop) => {
        if (!(prop in obj)) el.style.removeProperty(prop);
      });
      for (const [prop, v] of Object.entries(obj)) {
        if (el.style.getPropertyValue(prop) !== v) el.style.setProperty(prop, v, "important");
      }
      el.setAttribute(attr, Object.keys(obj).join(","));
    } else if (key.startsWith("img:")) {
      const el = byPath(root, key.slice(4));
      if (el instanceof HTMLImageElement && el.getAttribute("src") !== value) {
        el.src = value;
        el.removeAttribute("srcset");
      }
    } else {
      const el = byPath(root, key) as HTMLElement | null;
      if (el && document.activeElement !== el && el.innerHTML !== value) el.innerHTML = value;
    }
  }
}

export interface InlineChunk { key: string; parent: string; el: HTMLElement }

export default function InlineEditSurface({
  children, edits, objectEdits = {}, editing = false, onChange, onPickImage, onSelect, selectedKey,
  collapsed, onToggleCollapse, onReorder, onOpenObject, sections = true, isolate,
}: {
  /** Open a shared object in the object editor; `section` is the part's path inside the object. */
  onOpenObject?: (key: string, section: string) => void;
  /** Draw section bars (off in the object editor). */
  sections?: boolean;
  /** Show only this part (path inside the first object) and hide everything else. */
  isolate?: string;
  children: ReactNode;
  edits: InlineEdits;
  objectEdits?: Record<string, InlineEdits>;
  editing?: boolean;
  onChange?: (scope: InlineScope, next: InlineEdits) => void;
  onPickImage?: (current: string) => Promise<string | null>;
  onSelect?: (sel: InlineSelection | null) => void;
  selectedKey?: string | null;
  /** Section keys folded away in the editor (not saved). */
  collapsed?: Set<string>;
  onToggleCollapse?: (key: string) => void;
  /** Move section `from` before/after section `to` (siblings only). */
  onReorder?: (from: InlineChunk, to: InlineChunk, after: boolean, all: InlineChunk[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const editsRef = useRef(edits);
  editsRef.current = edits;
  const objRef = useRef(objectEdits);
  objRef.current = objectEdits;
  const objectsRef = useRef<ObjectRoot[]>([]);
  const chunksRef = useRef<InlineChunk[]>([]);
  const collapsedRef = useRef(collapsed);
  collapsedRef.current = collapsed;

  const outer = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<{ key: string; top: number; left: number; width: number; collapsed: boolean; object?: string }[]>([]);
  const barsSig = useRef("");
  const scopeOf = (el: Element): { scope: InlineScope; root: Element } => {
    const hit = objectsRef.current.find((o) => o.el === el || o.el.contains(el));
    return hit ? { scope: hit.key, root: hit.el } : { scope: "page", root: ref.current! };
  };

  const runAll = () => {
    const root = ref.current;
    if (!root) return;
    const map = objectComponentsNow();
    objectsRef.current = map ? findObjectRoots(root, map) : [];
    applyEdits(root, editsRef.current, "page");
    for (const o of objectsRef.current) applyEdits(o.el, objRef.current[o.key] ?? {}, "obj");
    if (isolate !== undefined && objectsRef.current[0]) {
      const target = byPath(objectsRef.current[0].el, isolate) as HTMLElement | null;
      if (target) {
        let n: HTMLElement = target;
        while (n !== root && n.parentElement) {
          [...n.parentElement.children].forEach((c) => {
            if (c !== n) (c as HTMLElement).setAttribute("data-inline-isolated-out", "");
          });
          n = n.parentElement;
        }
      }
    }
    if (!editing) return;
    editableTexts(root).forEach((el) => {
      if (el.dataset.inlineEditable) return;
      el.dataset.inlineEditable = "1";
      el.contentEditable = "true";
      el.spellcheck = true;
    });
    root.querySelectorAll("img").forEach((img) => {
      if (!img.closest("header,footer,nav")) img.dataset.inlineImage = "1";
    });
    root.querySelectorAll<HTMLElement>("div,span,hr,i").forEach((el) => {
      if (el.dataset.inlineDivider || el.closest("header,footer,nav")) return;
      if (isDivider(el)) el.dataset.inlineDivider = "1";
    });
    if (!sections) return;
    // Sections, each with a heading bar drawn by CSS.
    const first = root.firstElementChild as HTMLElement | null;
    if (!first) return;
    const chunks = pageChunks(first).filter((el) => el !== first && el.getBoundingClientRect().height > 0 || el.hasAttribute("data-inline-collapsed"));
    chunksRef.current = chunks.map((el) => ({ key: pathOf(root, el), parent: pathOf(root, el.parentElement!), el }));
    chunks.forEach((el, i) => {
      if (!el.dataset.inlineChunk) el.dataset.inlineChunk = chunkName(el, `Section ${i + 1}`);
      const obj = objectsRef.current.find((o) => o.el === el || el.contains(o.el) || o.el.contains(el));
      if (obj) el.dataset.inlineObject = obj.key; else delete el.dataset.inlineObject;
      const key = pathOf(root, el);
      if (collapsedRef.current?.has(key)) el.setAttribute("data-inline-collapsed", "");
      else el.removeAttribute("data-inline-collapsed");
    });
    // Real buttons (fold, open object) laid over each section's bar.
    const o = outer.current?.getBoundingClientRect();
    if (o) {
      const next = chunksRef.current.map((c) => {
        const r = c.el.getBoundingClientRect();
        return { key: c.key, top: r.top - o.top, left: r.left - o.left, width: r.width, collapsed: c.el.hasAttribute("data-inline-collapsed"), object: c.el.dataset.inlineObject };
      });
      const sig = JSON.stringify(next);
      if (sig !== barsSig.current) { barsSig.current = sig; setBars(next); }
    }
  };

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let busy = false;
    const run = () => { if (busy) return; busy = true; try { runAll(); } finally { busy = false; } };
    loadObjectComponents().then(run);
    run();
    const mo = new MutationObserver(() => requestAnimationFrame(run));
    mo.observe(root, { childList: true, subtree: true });
    const id = window.setInterval(run, 800);
    return () => {
      mo.disconnect();
      window.clearInterval(id);
      root.querySelectorAll<HTMLElement>("[data-inline-editable]").forEach((el) => {
        el.removeAttribute("contenteditable");
        delete el.dataset.inlineEditable;
      });
      root.querySelectorAll<HTMLElement>("[data-inline-image]").forEach((el) => delete el.dataset.inlineImage);
      root.querySelectorAll<HTMLElement>("[data-inline-divider]").forEach((el) => delete el.dataset.inlineDivider);
      barsSig.current = ""; setBars([]);
      root.querySelectorAll<HTMLElement>("[data-inline-chunk]").forEach((el) => {
        delete el.dataset.inlineChunk; delete el.dataset.inlineObject; el.removeAttribute("data-inline-collapsed");
      });
    };
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // New overrides or fold state take effect straight away.
  useEffect(() => { runAll(); }, [edits, objectEdits, collapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll("[data-inline-selected]").forEach((el) => el.removeAttribute("data-inline-selected"));
    if (editing && selectedKey) {
      const [scope, key] = selectedKey.split("|");
      const base = scope === "page" ? root : objectsRef.current.find((o) => o.key === scope)?.el;
      if (base) byPath(base, key)?.setAttribute("data-inline-selected", "1");
    }
  });

  const onInput = (e: React.FormEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-inline-editable]");
    if (!ref.current || !el || !onChange) return;
    const { scope, root } = scopeOf(el);
    const cur = scope === "page" ? editsRef.current : (objRef.current[scope] ?? {});
    onChange(scope, { ...cur, [pathOf(root, el)]: clean(el.innerHTML) });
  };

  /** The chunk whose heading bar is under the pointer, if any. */
  const barAt = (x: number, y: number) =>
    chunksRef.current.find((c) => {
      const r = c.el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y < r.top + BAR;
    });

  const drag = useRef<{ from: InlineChunk; x: number; y: number; moved: boolean; target?: { c: InlineChunk; after: boolean } } | null>(null);

  const clearDrop = () => ref.current?.querySelectorAll("[data-inline-drop]").forEach((el) => el.removeAttribute("data-inline-drop"));

  const onPointerDown = (e: React.PointerEvent) => {
    if (!editing || e.button !== 0) return;
    const c = barAt(e.clientX, e.clientY);
    if (!c) return;
    e.preventDefault();
    drag.current = { from: c, x: e.clientX, y: e.clientY, moved: false };
    const scroller = ref.current?.parentElement;
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 5) return;
      d.moved = true;
      d.from.el.setAttribute("data-inline-dragging", "");
      document.body.style.cursor = "grabbing";
      if (scroller) {
        const r = scroller.getBoundingClientRect();
        if (ev.clientY < r.top + 60) scroller.scrollTop -= 14;
        else if (ev.clientY > r.bottom - 60) scroller.scrollTop += 14;
      }
      clearDrop();
      const sibs = chunksRef.current.filter((c2) => c2.parent === d.from.parent && c2 !== d.from && !c2.el.hasAttribute("data-inline-hidden"));
      let best: { c: InlineChunk; after: boolean } | undefined;
      for (const c2 of sibs) {
        const r = c2.el.getBoundingClientRect();
        const top = r.top;
        const mid = top + (r.bottom - top) / 2;
        if (ev.clientY >= top && ev.clientY <= r.bottom) { best = { c: c2, after: ev.clientY > mid }; break; }
      }
      d.target = best;
      if (best) best.c.el.setAttribute("data-inline-drop", best.after ? "after" : "before");
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      const d = drag.current;
      drag.current = null;
      clearDrop();
      if (!d) return;
      d.from.el.removeAttribute("data-inline-dragging");
      if (!d.moved) onToggleCollapse?.(d.from.key);
      else if (d.target) onReorder?.(d.from, d.target.c, d.target.after, chunksRef.current);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onClick = async (e: React.MouseEvent) => {
    if (!editing) return;
    const t = e.target as HTMLElement;
    if (t.closest("a,button")) e.preventDefault();
    const root = ref.current;
    if (!root || barAt(e.clientX, e.clientY)) return;
    const img = t.closest("img[data-inline-image]") as HTMLImageElement | null;
    if (img) {
      e.preventDefault();
      e.stopPropagation();
      const { scope, root: base } = scopeOf(img);
      onSelect?.({ key: pathOf(base, img), kind: "image", el: img, scope });
      return;
    }
    // Dividers are thin, so a click within a few pixels counts.
    const div = t.closest<HTMLElement>("[data-inline-divider]") ?? ([...root.querySelectorAll<HTMLElement>("[data-inline-divider]")].find((d) => {
      const r = d.getBoundingClientRect();
      return e.clientX >= r.left - 6 && e.clientX <= r.right + 6 && e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6;
    }) ?? null);
    const txt = t.closest<HTMLElement>("[data-inline-editable]");
    // Lines drawn as an element's edge (border) can be picked too.
    if (!div) {
      let best: { el: HTMLElement; side: NonNullable<InlineSelection["side"]>; area: number } | null = null;
      for (const el of root.querySelectorAll<HTMLElement>("*")) {
        if (el.closest("header,footer,nav") || el.hasAttribute("data-inline-chunk")) continue;
        const side = edgeAt(el, e.clientX, e.clientY);
        if (!side) continue;
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        if (!best || area < best.area) best = { el, side, area };
      }
      if (best) {
        e.preventDefault();
        const { scope, root: base } = scopeOf(best.el);
        onSelect?.({ key: pathOf(base, best.el), kind: "divider", el: best.el, scope, side: best.side });
        return;
      }
    }
    if (div && !txt) {
      e.preventDefault();
      const { scope, root: base } = scopeOf(div);
      onSelect?.({ key: pathOf(base, div), kind: "divider", el: div, scope });
    } else if (txt) {
      const { scope, root: base } = scopeOf(txt);
      onSelect?.({ key: pathOf(base, txt), kind: "text", el: txt, scope });
    } else onSelect?.(null);
  };

  // ---- Moving a selected text box or picture among its neighbours ----
  const [grip, setGrip] = useState<{ top: number; left: number } | null>(null);
  const unitOf = (el: HTMLElement, base: Element) => {
    let u = el;
    while (u.parentElement && u.parentElement !== base && u.parentElement !== ref.current && u.parentElement.children.length === 1) u = u.parentElement;
    return u;
  };
  const selectedEl = () => {
    if (!selectedKey || !ref.current) return null;
    const [scope, key] = selectedKey.split("|");
    const base = scope === "page" ? ref.current : objectsRef.current.find((o) => o.key === scope)?.el;
    const el = base ? (byPath(base, key) as HTMLElement | null) : null;
    return el && base && (el.dataset.inlineEditable || el.dataset.inlineImage) ? { el, base, scope } : null;
  };
  useEffect(() => {
    if (!editing) { setGrip(null); return; }
    const place = () => {
      const s = selectedEl();
      const o = outer.current?.getBoundingClientRect();
      if (!s || !o) { setGrip((g) => (g ? null : g)); return; }
      const r = unitOf(s.el, s.base).getBoundingClientRect();
      const next = { top: r.top - o.top, left: Math.max(0, r.left - o.left - 30) };
      setGrip((g) => (g && g.top === next.top && g.left === next.left ? g : next));
    };
    place();
    const id = window.setInterval(place, 300);
    return () => window.clearInterval(id);
  }, [selectedKey, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const startItemDrag = (e: React.PointerEvent) => {
    const s = selectedEl();
    if (!s || !onChange) return;
    e.preventDefault();
    const unit = unitOf(s.el, s.base);
    const parent = unit.parentElement!;
    const pcs = getComputedStyle(parent);
    const row = (pcs.display.includes("flex") && !pcs.flexDirection.startsWith("column")) || (pcs.display.includes("grid") && pcs.gridTemplateColumns.split(" ").length > 1);
    const sibs = [...parent.children].filter((c) => c !== unit && (c as HTMLElement).getBoundingClientRect().height > 0) as HTMLElement[];
    let target: { el: HTMLElement; after: boolean } | null = null;
    unit.setAttribute("data-inline-dragging", "");
    document.body.style.cursor = "grabbing";
    const clear = () => parent.querySelectorAll("[data-inline-drop-item]").forEach((c) => c.removeAttribute("data-inline-drop-item"));
    const move = (ev: PointerEvent) => {
      clear();
      target = null;
      let bestD = Infinity;
      for (const c of sibs) {
        const r = c.getBoundingClientRect();
        const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        if (d < bestD) { bestD = d; target = { el: c, after: row ? ev.clientX > cx : ev.clientY > cy }; }
      }
      if (target) target.el.setAttribute("data-inline-drop-item", `${target.after ? "after" : "before"}-${row ? "x" : "y"}`);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      unit.removeAttribute("data-inline-dragging");
      clear();
      if (!target) return;
      // Current visual order, then move the item and store it as order styles.
      const kids = ([...parent.children] as HTMLElement[])
        .map((c, i) => ({ c, o: parseInt(getComputedStyle(c).order) || 0, i }))
        .sort((a, b) => a.o - b.o || a.i - b.i).map((x) => x.c).filter((c) => c !== unit);
      const at = kids.indexOf(target.el);
      kids.splice(target.after ? at + 1 : at, 0, unit);
      const cur = s.scope === "page" ? editsRef.current : (objRef.current[s.scope] ?? {});
      const out = { ...cur };
      const patch = (el: Element, props: Record<string, string>) => {
        const k = pathOf(s.base, el);
        out[styleKey(k)] = JSON.stringify({ ...readStyle(out, k), ...props });
      };
      if (!pcs.display.includes("flex") && !pcs.display.includes("grid")) patch(parent, { display: "flex", "flex-direction": "column" });
      kids.forEach((c, i) => patch(c, { order: String(i) }));
      onChange(s.scope, out);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).dataset.inlineEditable) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <div ref={outer} className="relative">
    <div
      ref={ref}
      className={editing ? "inline-edit-surface" : undefined}
      onInput={onInput}
      onClickCapture={onClick}
      onPointerDownCapture={onPointerDown}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
    {editing && grip && (
      <button
        type="button"
        aria-label="Drag to move"
        title="Drag to move"
        onPointerDown={startItemDrag}
        className="absolute z-[75] flex h-7 w-6 cursor-grab items-center justify-center rounded border bg-background text-foreground shadow-sm hover:bg-muted active:cursor-grabbing"
        style={{ top: grip.top, left: grip.left }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    )}
    {editing && bars.map((b) => (
      <div key={b.key}>
        <button
          type="button"
          aria-label={b.collapsed ? "Open section" : "Fold section"}
          title={b.collapsed ? "Open section" : "Fold section"}
          onClick={() => onToggleCollapse?.(b.key)}
          className="absolute z-[70] flex h-10 w-10 items-center justify-center text-foreground hover:bg-background/60 rounded"
          style={{ top: b.top, left: b.left + 18 }}
        >
          {b.collapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </button>
        {b.object && onOpenObject && (
          <button
            type="button"
            onClick={() => {
              const c = chunksRef.current.find((x) => x.key === b.key);
              const o = objectsRef.current.find((x) => x.key === b.object);
              onOpenObject(b.object!, c && o && o.el.contains(c.el) && o.el !== c.el ? pathOf(o.el, c.el) : "");
            }}
            className="absolute z-[70] my-1.5 inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted"
            style={{ top: b.top, left: b.left + b.width - 190, width: 180 }}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in object editor
          </button>
        )}
      </div>
    ))}
    </div>
  );
}
