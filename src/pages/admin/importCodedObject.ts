/**
 * Turns an object that was built in code into editable design blocks.
 *
 * We render the coded component off-screen and read what it actually puts on
 * the page — eyebrows, titles, paragraphs, images and buttons — then rebuild
 * that as normal blocks the Design tab can edit. It is an approximation of the
 * original layout, not a pixel-perfect copy, but it keeps the wording, the
 * pictures and the general arrangement so the user can take it from there.
 */

import {
  newSectionId,
  SECTION_ICON_NAMES,
  type SectionVideo,
  type FreeParagraph,
  type FreeDivider,
  type FreeSection,
  type LockedSection,
  type ImageText,
  type Section,
  type SectionAlign,
  type SectionImage,
  type TextColor,
  type TextStyle,
} from "@/components/ObjectSections";

const id = () => newSectionId();

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

function alignOf(el: Element): SectionAlign {
  const cls = el.className?.toString() ?? "";
  if (/\btext-center\b/.test(cls)) return "center";
  if (/\btext-right\b/.test(cls)) return "right";
  const ta = getComputedStyle(el as HTMLElement).textAlign;
  if (ta === "center") return "center";
  if (ta === "right") return "right";
  return "left";
}

function columnsOf(root: Element): 1 | 2 | 3 | 4 {
  const grid = root.querySelector('[class*="grid-cols-"]');
  const cls = grid?.className?.toString() ?? "";
  const matches = [...cls.matchAll(/(?:^|\s|:)grid-cols-(\d)/g)].map((m) => Number(m[1]));
  const n = matches.length ? Math.max(...matches) : 0;
  return (n >= 1 && n <= 4 ? n : 2) as 1 | 2 | 3 | 4;
}

/** Small, spaced-out, uppercase text reads as an eyebrow. */
function looksLikeEyebrow(el: HTMLElement): boolean {
  const cls = el.className?.toString() ?? "";
  if (/uppercase/.test(cls) && /tracking-/.test(cls)) return true;
  const cs = getComputedStyle(el);
  return cs.textTransform === "uppercase" && parseFloat(cs.fontSize) <= 14;
}

function isVisible(el: HTMLElement): boolean {
  if (el.closest("[aria-hidden='true']")) return false;
  if (el.closest("[data-import-skip]")) return false;
  if (el.closest(".sr-only")) return false;
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
  const r = el.getBoundingClientRect();
  if (r.width <= 1 && r.height <= 1 && el.tagName.toLowerCase() !== "img") return false;
  return true;
}

/**
 * Alignment as it looks on the page: text-align, but also items centred by a
 * flex/grid parent or by auto margins.
 */
function visualAlign(el: HTMLElement, stop?: HTMLElement): SectionAlign {
  const own = alignOf(el);
  if (own !== "left") return own;
  let cur: HTMLElement = el;
  for (let i = 0; i < 4; i += 1) {
    const parent = cur.parentElement;
    if (!parent || cur === stop) break;
    const pcs = getComputedStyle(parent);
    const flex = /flex/.test(pcs.display);
    const grid = /grid/.test(pcs.display);
    if (flex && pcs.flexDirection.startsWith("column") && pcs.alignItems === "center") return "center";
    if (flex && pcs.flexDirection.startsWith("row") && pcs.justifyContent === "center" && parent.children.length === 1) return "center";
    if (grid && pcs.justifyItems === "center") return "center";
    if (flex && pcs.flexDirection.startsWith("column") && pcs.alignItems === "flex-end") return "right";
    const pr = parent.getBoundingClientRect();
    const cr = cur.getBoundingClientRect();
    const padL = parseFloat(pcs.paddingLeft) || 0;
    const padR = parseFloat(pcs.paddingRight) || 0;
    const gapL = cr.left - (pr.left + padL);
    const gapR = pr.right - padR - cr.right;
    if (gapL > 12 && gapR > 12 && Math.abs(gapL - gapR) < 4) return "center";
    if (parent === stop) break;
    cur = parent;
  }
  return "left";
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Keeps coloured, italic or bold words inside one piece of text as inline
 * markup, so "Seventy years of *light*" stays one line with its styled word.
 * Returns null when the text has no differently styled parts.
 */
function richOf(el: HTMLElement): string | null {
  const base = getComputedStyle(el);
  let styled = false;
  const serifOf = (f: string) => /serif/.test(f.toLowerCase().replace(/sans-serif/g, ""));
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml((node.textContent ?? "").replace(/\s+/g, " "));
    if (!(node instanceof HTMLElement)) return "";
    if (node.tagName === "BR") return "<br>";
    if (node.tagName.toLowerCase() === "svg" || !isVisible(node)) return "";
    const inner = [...node.childNodes].map(walk).join("");
    const cs = getComputedStyle(node);
    let open = "";
    let close = "";
    const bold = Number(cs.fontWeight) >= 600 && Number(base.fontWeight) < 600;
    const italic = cs.fontStyle === "italic" && base.fontStyle !== "italic";
    const underline = cs.textDecorationLine.includes("underline") && !base.textDecorationLine.includes("underline");
    const colorDiff = cs.color !== base.color;
    const fontDiff = serifOf(cs.fontFamily) !== serifOf(base.fontFamily);
    if (colorDiff || fontDiff) {
      const color = colorDiff ? colorOf(cs.color) : undefined;
      const font = fontDiff ? (serifOf(cs.fontFamily) ? "serif" : "sans") : undefined;
      const attrs = [color ? `data-color="${color}"` : "", font ? `data-font="${font}"` : ""].filter(Boolean).join(" ");
      if (attrs) { open += `<span ${attrs}>`; close = "</span>" + close; }
    }
    if (bold) { open += "<b>"; close = "</b>" + close; }
    if (italic) { open += "<i>"; close = "</i>" + close; }
    if (underline) { open += "<u>"; close = "</u>" + close; }
    if (open) styled = true;
    // A child laid out as its own line keeps a line break before it.
    const block = cs.display === "block" && node !== el;
    return `${block ? "<br>" : ""}${open}${inner}${close}`;
  };
  const html = [...el.childNodes].map(walk).join("").replace(/^(\s|<br>)+|(\s|<br>)+$/g, "").replace(/\s+/g, " ").trim();
  return styled ? html : null;
}

/** Lucide icon names that the editor offers under a different key. */
const ICON_ALIASES: Record<string, string> = {
  "move-right": "longArrow",
  "shield-check": "shield",
  "pen-tool": "pen",
  "house": "home",
};

/** Editor icon name for a rendered lucide svg, when the editor has it. */
function iconNameOf(svg: Element): string | undefined {
  const cls = svg.getAttribute("class") ?? "";
  const m = [...cls.matchAll(/lucide-([a-z0-9-]+)/g)].map((x) => x[1]).filter((n) => n !== "icon");
  for (const raw of m) {
    if (ICON_ALIASES[raw]) return ICON_ALIASES[raw];
    const camel = raw.replace(/-([a-z0-9])/g, (_s, c: string) => c.toUpperCase());
    if (SECTION_ICON_NAMES.includes(camel)) return camel;
  }
  return undefined;
}

/** Whether an icon sits before or after the wording beside it. */
function iconSideOf(svg: Element, host: HTMLElement): "before" | "after" {
  const s = svg.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  return s.left + s.width / 2 < h.left + h.width / 2 ? "before" : "after";
}

/** Nova palette, so colors coming out of the DOM keep their brand token. */
const BRAND_HEX: { token: TextColor; rgb: [number, number, number] }[] = [
  { token: "ink", rgb: [33, 33, 33] },
  { token: "stone", rgb: [163, 155, 142] },
  { token: "brass", rgb: [204, 190, 164] },
  { token: "garnet", rgb: [133, 55, 50] },
  { token: "cream", rgb: [255, 255, 255] },
];

function parseRgb(value: string): [number, number, number, number] | null {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2], parts[3] === undefined ? 1 : parts[3]];
}

const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}`;

/** Closest brand token, or the exact color when nothing matches. */
function colorOf(value: string): TextColor | undefined {
  const rgb = parseRgb(value);
  if (!rgb || rgb[3] === 0) return undefined;
  const [r, g, b] = rgb;
  for (const { token, rgb: t } of BRAND_HEX) {
    const d = Math.abs(t[0] - r) + Math.abs(t[1] - g) + Math.abs(t[2] - b);
    if (d <= 24) return token;
  }
  return hex(r, g, b);
}

/** Whether text (or a close wrapper) is turned sideways, and which way it reads. */
function verticalOf(el: HTMLElement): "up" | "down" | undefined {
  let turn = 0;
  let wm: string | null = null;
  for (let cur: HTMLElement | null = el, i = 0; cur && i < 4; cur = cur.parentElement, i += 1) {
    const cs = getComputedStyle(cur);
    if (!wm && cs.writingMode.startsWith("vertical") || cs.writingMode.startsWith("sideways")) wm = cs.writingMode;
    const m = cs.transform.match(/^matrix\(([^)]+)\)/);
    if (m) {
      const [a, b] = m[1].split(",").map(Number);
      turn += Math.round((Math.atan2(b, a) * 180) / Math.PI);
    }
  }
  turn = ((turn % 360) + 360) % 360;
  if (wm) {
    const up = wm === "sideways-lr" ? turn !== 180 : turn === 180;
    return up ? "up" : "down";
  }
  if (Math.abs(turn - 90) < 10) return "down";
  if (Math.abs(turn - 270) < 10) return "up";
  return undefined;
}

/** Font, exact size, color and bold/italic/underline, read from the rendered text. */
function styleOf(el: HTMLElement, heading: boolean): TextStyle {
  const cs = getComputedStyle(el);
  const px = Math.round(parseFloat(cs.fontSize)) || undefined;
  const weight = Number(cs.fontWeight) || 400;
  const family = cs.fontFamily.toLowerCase();
  const serif = /serif/.test(family.replace(/sans-serif/g, ""));
  return {
    font: serif || heading ? "serif" : "sans",
    sizePx: px,
    color: colorOf(cs.color),
    bold: weight >= 600 ? true : undefined,
    italic: cs.fontStyle === "italic" ? true : undefined,
    underline: cs.textDecorationLine.includes("underline") ? true : undefined,
    uppercase: cs.textTransform === "uppercase" ? true : undefined,
    trackingEm: (() => {
      const ls = parseFloat(cs.letterSpacing);
      const fs = parseFloat(cs.fontSize) || 16;
      return Number.isFinite(ls) && Math.abs(ls) > 0.2 ? Math.round((ls / fs) * 1000) / 1000 : undefined;
    })(),
    vertical: verticalOf(el),
    lineHeight: (() => {
      const lh = parseFloat(cs.lineHeight);
      const fs = parseFloat(cs.fontSize) || 16;
      return Number.isFinite(lh) ? Math.round((lh / fs) * 100) / 100 : undefined;
    })(),
  };
}

interface Box { top: number; bottom: number; left: number; right: number; width: number }

const boxOf = (el: HTMLElement): Box => {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width };
};

const unionBox = (boxes: Box[]): Box | null =>
  boxes.length
    ? boxes.reduce((a, b) => ({
        top: Math.min(a.top, b.top),
        bottom: Math.max(a.bottom, b.bottom),
        left: Math.min(a.left, b.left),
        right: Math.max(a.right, b.right),
        width: 0,
      }))
    : null;

/** How much two boxes share the same vertical band (0-1). */
function vOverlap(a: Box, b: Box): number {
  const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  const smaller = Math.min(a.bottom - a.top, b.bottom - b.top) || 1;
  return overlap / smaller;
}

/** How much two boxes share the same horizontal band (0-1). */
function hOverlap(a: Box, b: Box): number {
  const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const smaller = Math.min(a.right - a.left, b.right - b.left) || 1;
  return overlap / smaller;
}

/**
 * Rebuilds the side-by-side arrangement of the original. Texts are split into
 * horizontal bands; inside a band, texts sharing a column are stacked and the
 * columns sit next to each other, each keeping its share of the width.
 */
function layoutRows(
  parts: { part: string; box: Box }[],
  nodeWidth: number,
): {
  flows: Record<string, "inline">;
  widths: Record<string, number>;
  stacks: Record<string, string>;
  order: string[];
  rows: { parts: string[]; box: Box }[][];
} {
  const rowsOut: { parts: string[]; box: Box }[][] = [];
  const flows: Record<string, "inline"> = {};
  const widths: Record<string, number> = {};
  const stacks: Record<string, string> = {};
  const order: string[] = [];

  const sorted = [...parts].sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left);
  const bands: { items: typeof parts; bottom: number }[] = [];
  for (const item of sorted) {
    const band = bands[bands.length - 1];
    if (band && item.box.top < band.bottom - 2) {
      band.items.push(item);
      band.bottom = Math.max(band.bottom, item.box.bottom);
    } else bands.push({ items: [item], bottom: item.box.bottom });
  }

  type Col = { items: typeof parts; box: Box };
  const colsOf = (items: typeof parts): Col[] => {
    const cols: Col[] = [];
    for (const item of items) {
      const col = cols.find((c) => hOverlap(c.box, item.box) > 0.5);
      if (col) {
        col.items.push(item);
        col.box = unionBox([col.box, item.box]) as Box;
      } else cols.push({ items: [item], box: { ...item.box } });
    }
    return cols.sort((x, y) => x.box.left - y.box.left);
  };

  // A band that sits wholly under one column of the band above (the rest of a
  // tall side column) is folded back into that column.
  const rows: Col[][] = [];
  for (const band of bands) {
    const prev = rows[rows.length - 1];
    if (prev && prev.length > 1) {
      const targets = band.items.map((it) => {
        const hits = prev.filter((c) => hOverlap(c.box, it.box) > 0.5);
        const colW = hits[0] ? hits[0].box.right - hits[0].box.left : 0;
        const centred = hits[0] ? Math.abs((hits[0].box.left + hits[0].box.right) / 2 - (it.box.left + it.box.right) / 2) < 10 : false;
        const fits = hits.length === 1 && (it.box.width <= colW * 1.25 || centred);
        return fits ? hits[0] : null;
      });
      if (targets.every(Boolean)) {
        band.items.forEach((it, i) => {
          const col = targets[i] as Col;
          col.items.push(it);
          col.box = unionBox([col.box, it.box]) as Box;
        });
        continue;
      }
    }
    rows.push(colsOf(band.items));
  }

  rows.forEach((cols, bi) => {
    for (const col of cols) col.items.sort((x, y) => x.box.top - y.box.top);
    if (cols.length < 2) {
      cols.forEach((c) => c.items.forEach((it) => order.push(it.part)));
      return;
    }
    rowsOut.push(cols.map((c) => ({ parts: c.items.map((i) => i.part), box: c.box })));
    cols.forEach((col, ci) => {
      const pct = nodeWidth ? Math.round(((col.box.right - col.box.left) / nodeWidth) * 100) : 0;
      col.items.forEach((it) => {
        flows[it.part] = "inline";
        if (col.items.length > 1) stacks[it.part] = `b${bi}c${ci}`;
        if (pct) widths[it.part] = Math.max(10, Math.min(100, pct));
        order.push(it.part);
      });
    });
  });
  return { flows, widths, stacks, order, rows: rowsOut };
}

/** Solid, outlined or plain-link look of a link or button — null when it's just text. */
function buttonKindOf(el: HTMLElement): "solid" | "outline" | "link" | null {
  const cs = getComputedStyle(el);
  const bg = parseRgb(cs.backgroundColor);
  if (bg && bg[3] > 0.1) return "solid";
  if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") return "outline";
  if (cs.textTransform === "uppercase" && parseFloat(cs.letterSpacing) > 0.5) return "link";
  return null;
}

/** Splits text with inline emphasis or line breaks into separately styled runs. */
function runsOf(el: HTMLElement): { text: string; styleEl: HTMLElement; box: Box }[] {
  if (!el.querySelector("em,i,strong,b,br,span")) return [];
  const runs: { text: string; styleEl: HTMLElement; box: Box }[] = [];
  let buf: Node[] = [];
  const flush = (styleEl: HTMLElement) => {
    const text = clean(buf.map((n) => n.textContent).join(""));
    if (text) {
      const range = document.createRange();
      range.setStartBefore(buf[0]);
      range.setEndAfter(buf[buf.length - 1]);
      const r = range.getBoundingClientRect();
      runs.push({ text, styleEl, box: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width } });
    }
    buf = [];
  };
  for (const n of [...el.childNodes]) {
    if (n instanceof HTMLBRElement) { flush(el); continue; }
    if (n instanceof HTMLElement) {
      const cs = getComputedStyle(n);
      const pcs = getComputedStyle(el);
      // Only a new line starts a new run; emphasis within a line stays with it.
      const differs = cs.display === "block" && (cs.fontStyle !== pcs.fontStyle || cs.color !== pcs.color || cs.fontWeight !== pcs.fontWeight || true);
      if (differs) {
        flush(el);
        buf = [n];
        flush(n);
        continue;
      }
    }
    buf.push(n);
  }
  flush(el);
  return runs;
}

/** Background tint painted behind the block, when it isn't plain white. */
function backgroundOf(node: HTMLElement): TextColor | undefined {
  let el: HTMLElement | null = node;
  for (let i = 0; el && i < 3; i += 1, el = el.parentElement) {
    const rgb = parseRgb(getComputedStyle(el).backgroundColor);
    if (!rgb || rgb[3] === 0) continue;
    const [r, g, b] = rgb;
    if (r > 250 && g > 250 && b > 250) return undefined;
    return colorOf(getComputedStyle(el).backgroundColor);
  }
  return undefined;
}

const hasContent = (el: HTMLElement) =>
  !!clean(el.innerText || el.textContent) || !!el.querySelector("img,video");

/** Walks past plain wrappers (containers, width limiters) to the real content. */
function contentRoot(el: HTMLElement): HTMLElement {
  let node = el;
  for (let i = 0; i < 6; i += 1) {
    const kids = [...node.children].filter(
      (c): c is HTMLElement => c instanceof HTMLElement && isVisible(c) && hasContent(c),
    );
    if (kids.length !== 1) return node;
    node = kids[0];
  }
  return node;
}

/**
 * Each visual band of the original layout becomes its own block, so a header,
 * an image-and-text row and a grid of cards stay separate instead of collapsing
 * into one long block.
 */
function blockRoots(root: HTMLElement): HTMLElement[][] {
  const sections = [...root.querySelectorAll<HTMLElement>("section")].filter(
    (s) => !s.parentElement?.closest("section"),
  );
  const tops = sections.length ? sections : [root];

  return tops.flatMap((top) => {
    const inner = contentRoot(top);
    const bands = [...inner.children].filter(
      (c): c is HTMLElement => c instanceof HTMLElement && isVisible(c) && hasContent(c),
    );
    if (bands.length < 2 || !bands.some(isMultiColumn)) return [[inner]];
    // Rows of side-by-side items (a grid of steps, image beside text) each get
    // their own block; stacked text between them is kept together.
    const groups: HTMLElement[][] = [];
    let run: HTMLElement[] = [];
    for (const band of bands) {
      if (isMultiColumn(band)) {
        if (run.length) groups.push(run);
        run = [];
        groups.push([band]);
      } else run.push(band);
    }
    if (run.length) groups.push(run);
    return groups;
  });
}

/** Whether an element lays its content out in side-by-side columns. */
function isMultiColumn(el: HTMLElement): boolean {
  let cur = el;
  for (let depth = 0; depth < 4; depth++) {
    const kids = [...cur.children].filter(
      (c): c is HTMLElement => c instanceof HTMLElement && isVisible(c) && hasContent(c),
    );
    if (kids.length === 1) { cur = kids[0]; continue; }
    const boxes = kids.map(boxOf);
    return boxes.some((a, i) => boxes.some((b, j) => j > i && vOverlap(a, b) > 0.5 && (a.right <= b.left + 2 || b.right <= a.left + 2)));
  }
  return false;
}

/** Picture painted as a CSS background rather than an <img>. */
function bgImageUrl(el: HTMLElement): string | undefined {
  const m = getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
  const url = m?.[1];
  if (!url || url.startsWith("data:image/svg")) return undefined;
  const r = el.getBoundingClientRect();
  return r.width > 40 && r.height > 40 ? url : undefined;
}

/** Where text sitting over a picture is anchored. */
function overlayVAlignOf(el: HTMLElement): "top" | "middle" | "bottom" {
  const cs = getComputedStyle(el.parentElement ?? el);
  const j = `${cs.justifyContent} ${cs.alignItems}`;
  if (/end|bottom/.test(j)) return "bottom";
  if (/center/.test(j)) return "middle";
  return "top";
}

/** Text that sits on a picture or reads as its caption becomes part of that picture. */
function imageTextOf(el: HTMLElement, text: string): ImageText {
  const heading = /^h[1-6]$/.test(el.tagName.toLowerCase());
  const kind: ImageText["kind"] = heading ? "title" : looksLikeEyebrow(el) ? "eyebrow" : "text";
  return { id: id(), kind, text, style: styleOf(el, heading), align: alignOf(el) };
}

const centerInside = (inner: Box, outer: Box) => {
  const cx = (inner.left + inner.right) / 2;
  const cy = (inner.top + inner.bottom) / 2;
  return cx >= outer.left && cx <= outer.right && cy >= outer.top && cy <= outer.bottom;
};

/** Visible border lines on an element, with their colour (brand token when it matches). */
function borderOf(el: HTMLElement): { top: boolean; bottom: boolean; all: boolean; color: string; width: number } | null {
  const cs = getComputedStyle(el);
  const on = (side: "Top" | "Bottom" | "Left" | "Right") =>
    parseFloat(cs[`border${side}Width` as "borderTopWidth"]) > 0 &&
    cs[`border${side}Style` as "borderTopStyle"] !== "none" &&
    !/rgba\([^)]*,\s*0\)$/.test(cs[`border${side}Color` as "borderTopColor"]);
  const top = on("Top"), bottom = on("Bottom"), left = on("Left"), right = on("Right");
  if (!top && !bottom) return null;
  const side = top ? "Top" : "Bottom";
  const raw = cs[`border${side}Color` as "borderTopColor"];
  const width = Math.round(parseFloat(cs[`border${side}Width` as "borderTopWidth"])) || 1;
  return { top, bottom, all: top && bottom && left && right, color: brandBorderColor(raw), width };
}

/** Maps a computed border colour back to the nearest brand token, else keeps it as-is. */
function brandBorderColor(raw: string): string {
  const probe = document.createElement("span");
  document.body.appendChild(probe);
  const tokens = ["sand", "brass", "stone", "ink", "garnet"];
  const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const target = rgb(raw);
  let best = raw, dist = 40;
  for (const t of tokens) {
    probe.style.color = `hsl(var(--nova-${t}))`;
    const c = rgb(getComputedStyle(probe).color);
    const d = Math.hypot(c[0] - target[0], c[1] - target[1], c[2] - target[2]);
    if (d < dist) { dist = d; best = t; }
  }
  probe.remove();
  return best;
}

function sectionFromNode(parts: HTMLElement[]): FreeSection | null {
  const node = parts.length === 1 ? parts[0] : (parts[0].parentElement ?? parts[0]);
  const base: FreeSection = {
    id: id(),
    type: "free",
    images: [],
    layout: "stacked",
    imageSide: "left",
    gallery: "grid",
    columns: columnsOf(node),
    align: alignOf(node),
    height: "md",
    extras: [],
  };

  const seenText = new Set<string>();
  const order: string[] = [];
  const extras: FreeParagraph[] = [];
  const images: SectionImage[] = [];
  const textBoxes: { part: string; box: Box }[] = [];
  const imageBoxes: Box[] = [];

  const partAligns: Record<string, SectionAlign> = {};
  const partEls: Record<string, HTMLElement> = {};
  const keepFlow = (part: string, el: HTMLElement) => {
    textBoxes.push({ part, box: boxOf(el) });
    if (!partAligns[part]) partAligns[part] = visualAlign(el, node);
    if (!partEls[part]) partEls[part] = el;
  };

  const TEXTUAL = "h1,h2,h3,h4,h5,h6,p,span,img,a,button,video,svg";
  const all = parts.flatMap((p) => [p, ...p.querySelectorAll<HTMLElement>("*")]).filter(isVisible);
  const candidates = all.filter((el) => el.matches(TEXTUAL) || !!bgImageUrl(el));

  const isTextLeaf = (el: HTMLElement) => {
    const tag = el.tagName.toLowerCase();
    if (!/^(h[1-6]|p|span)$/.test(tag)) return false;
    if (tag === "span" && el.closest("p,h1,h2,h3,h4,h5,h6")) return false;
    if (el.querySelector("h1,h2,h3,h4,h5,h6,p,img,a,button")) return false;
    return !!clean(el.innerText || el.textContent);
  };

  // Text sitting on a picture, or reading as its caption, is attached to that
  // picture so it can be moved behind, beside or above it afterwards.
  const textLeaves = candidates.filter(isTextLeaf).map((el) => ({ el, box: boxOf(el) }));
  const imageEls = all.filter((el) => el.tagName.toLowerCase() === "img" || !!bgImageUrl(el));
  const attached = new Map<HTMLElement, ImageText[]>();
  const consumed = new Set<HTMLElement>();
  let overlaid: HTMLElement | null = null;

  // Repeating cards (a carousel or grid of products): each card's picture
  // carries all of the wording inside that card, lined up the same way.
  const cardOf = (img: HTMLElement): HTMLElement | null => {
    let card: HTMLElement | null = null;
    for (let cur = img.parentElement; cur && cur !== node && node.contains(cur); cur = cur.parentElement) {
      if (cur.querySelectorAll("img").length !== 1) break;
      card = cur;
    }
    return card;
  };
  const cardByImg = new Map<HTMLElement, HTMLElement>();
  for (const el of imageEls) {
    const c = cardOf(el);
    if (c) cardByImg.set(el, c);
  }
  const siblingCounts = new Map<Element, number>();
  for (const c of cardByImg.values()) {
    // Cards may be wrapped once more (carousel slides), so count by grandparent too.
    const key = c.parentElement?.parentElement && c.parentElement.children.length === 1 ? c.parentElement.parentElement : c.parentElement;
    if (key) siblingCounts.set(key, (siblingCounts.get(key) ?? 0) + 1);
  }
  const repeatingCards = [...cardByImg.entries()].filter(([, c]) => {
    const key = c.parentElement?.parentElement && c.parentElement.children.length === 1 ? c.parentElement.parentElement : c.parentElement;
    return key && (siblingCounts.get(key) ?? 0) >= 3;
  });
  let cardAlign: SectionAlign | null = null;
  let carousel = false;
  let visibleCards = 0;
  if (repeatingCards.length >= 3) {
    carousel = !!node.querySelector("[aria-roledescription='carousel'],[aria-roledescription='slide']");
    const nb = node.getBoundingClientRect();
    for (const [img, card] of repeatingCards) {
      const cb = card.getBoundingClientRect();
      if (cb.left >= nb.left - 4 && cb.right <= nb.right + 4) visibleCards += 1;
      else carousel = true;
      const leaves = textLeaves.filter((l) => card.contains(l.el) && !consumed.has(l.el));
      if (!leaves.length) continue;
      if (!cardAlign) cardAlign = visualAlign(leaves[0].el, card);
      const texts = leaves.map((l) => {
        consumed.add(l.el);
        return { ...imageTextOf(l.el, clean(l.el.innerText || l.el.textContent)), align: cardAlign as SectionAlign };
      });
      attached.set(img, texts);
    }
  }

  for (const el of imageEls) {
    if (attached.has(el)) continue;
    const box = boxOf(el);
    const texts: ImageText[] = [];
    for (const leaf of textLeaves) {
      if (consumed.has(leaf.el) || leaf.el === el) continue;
      const text = clean(leaf.el.innerText || leaf.el.textContent);
      if (!text) continue;
      const over = centerInside(leaf.box, box);
      const below = leaf.box.top >= box.bottom - 4 && leaf.box.top < box.bottom + 96;
      const above = leaf.box.bottom <= box.top + 4 && leaf.box.bottom > box.top - 96;
      const near =
        (below || above) &&
        hOverlap(leaf.box, box) > 0.6 &&
        (leaf.el.parentElement === el.parentElement || !!el.parentElement?.contains(leaf.el));
      if (!over && !near) continue;
      if (over) overlaid = overlaid ?? leaf.el;
      texts.push(imageTextOf(leaf.el, text));
      consumed.add(leaf.el);
    }
    if (texts.length) attached.set(el, texts);
  }

  // A short label living in the same card as a single picture is that picture's
  // caption, even when the picture has not finished loading.
  for (const el of imageEls) {
    if (attached.has(el)) continue;
    let card: HTMLElement | null = el.parentElement;
    for (let i = 0; card && i < 3; i += 1, card = card.parentElement) {
      if (card.querySelectorAll("img").length !== 1) break;
      const label = clean(card.innerText || card.textContent);
      if (!label || label.length > 120) continue;
      const leaves = textLeaves.filter(
        (leaf) => card?.contains(leaf.el) && !consumed.has(leaf.el) && !el.contains(leaf.el),
      );
      if (!leaves.length || leaves.length > 2) continue;
      const texts = leaves.map((leaf) => {
        consumed.add(leaf.el);
        return imageTextOf(leaf.el, clean(leaf.el.innerText || leaf.el.textContent));
      });
      attached.set(el, texts);
      break;
    }
  }


  // Icons sitting beside a piece of wording travel with that wording.
  const iconFor = new Map<HTMLElement, { icon: string; side: "before" | "after" }>();
  const iconTaken = new Set<Element>();
  for (const svg of all.filter((e) => e.tagName.toLowerCase() === "svg")) {
    if (svg.closest("a,button")) continue;
    const name = iconNameOf(svg);
    const parent = svg.parentElement;
    if (!name || !parent) continue;
    const sibs = [...parent.children].filter((c) => c !== svg && c instanceof HTMLElement && isVisible(c)) as HTMLElement[];
    const text = sibs.length === 1 && isTextLeaf(sibs[0]) ? sibs[0] : isTextLeaf(parent) ? parent : null;
    if (text && !consumed.has(text)) {
      iconFor.set(text, { icon: name, side: iconSideOf(svg, text) });
      iconTaken.add(svg);
    }
  }

  for (const el of candidates) {
    const tag = el.tagName.toLowerCase();
    if (consumed.has(el)) continue;

    if (tag === "video") {
      const v = el as unknown as HTMLVideoElement;
      const url = v.currentSrc || v.src || v.querySelector("source")?.getAttribute("src") || "";
      if (!url) continue;
      const video: SectionVideo = {
        id: id(),
        url,
        poster: v.poster || undefined,
        controls: v.controls,
        autoplay: v.autoplay || undefined,
        loop: v.loop || undefined,
        muted: v.muted || undefined,
      };
      base.videos = [...(base.videos ?? []), video];
      if (!order.includes("videos")) {
        order.push("videos");
        // Measure the video's frame (its sized wrapper) so its width carries over.
        const frame = v.parentElement && v.parentElement.children.length === 1 ? v.parentElement : (v as unknown as HTMLElement);
        keepFlow("videos", frame);
      }
      continue;
    }

    if (tag === "svg") {
      if (iconTaken.has(el) || el.closest("a,button")) continue;
      const name = iconNameOf(el);
      const r = el.getBoundingClientRect();
      if (!name || r.width < 12) continue;
      const cs = getComputedStyle(el);
      // An icon drawn inside a round outline keeps its ring.
      const wrap = el.parentElement && el.parentElement.children.length === 1 ? el.parentElement : null;
      const ring = !!wrap && parseFloat(getComputedStyle(wrap).borderTopWidth) > 0 && parseFloat(getComputedStyle(wrap).borderTopLeftRadius) >= wrap.getBoundingClientRect().width / 2 - 1;
      extras.push({ id: id(), text: name, kind: "icon", style: { color: colorOf(cs.color), sizePx: Math.round(r.width), ...(ring ? { iconRing: true } : {}) } });
      const part = `text:${extras.length - 1}`;
      order.push(part);
      keepFlow(part, wrap ?? el);
      continue;
    }

    if (tag === "img" || (!el.matches(TEXTUAL) && bgImageUrl(el))) {
      const img = el as HTMLImageElement;
      const url = tag === "img" ? img.currentSrc || img.src : (bgImageUrl(el) as string);
      if (url && !images.some((i) => i.url === url)) {
        images.push({
          url,
          alt: tag === "img" ? clean(img.alt) : "",
          href: el.closest("a")?.getAttribute("href") ?? undefined,
          texts: attached.get(el),
        });
        imageBoxes.push(boxOf(el));
      }
      continue;
    }

    if (tag === "a" || tag === "button") {
      const label = clean(el.innerText || el.textContent);
      // Skip wrappers around images or long blocks of copy.
      if (!label || label.length > 40 || el.querySelector("img,h1,h2,h3,h4,h5,h6,p,span")) continue;
      const kind = buttonKindOf(el);
      if (base.buttonLabel || !kind) {
        // A plain text link reads as text, keeping its look.
        if (seenText.has(label)) continue;
        seenText.add(label);
        const svg = el.querySelector("svg");
        const icon = svg ? iconNameOf(svg) ?? "arrowRight" : undefined;
        extras.push({
          id: id(), text: label, kind: "text", style: styleOf(el, false),
          ...(icon && svg ? { icon, iconSide: iconSideOf(svg, el) } : {}),
        });
        const part = `text:${extras.length - 1}`;
        order.push(part);
        keepFlow(part, el);
        continue;
      }
      base.buttonLabel = label;
      base.buttonHref = el.getAttribute("href") ?? "#";
      base.buttonVariant = kind;
      base.labelStyle = styleOf(el, false);
      const bsvg = el.querySelector("svg");
      if (bsvg) {
        base.buttonIcon = iconNameOf(bsvg) ?? "arrowRight";
        base.buttonIconSide = iconSideOf(bsvg, el);
      }
      order.push("button");
      keepFlow("button", el);
      partAligns.button = alignOf(el.parentElement ?? el);
      continue;
    }

    // Spans inside a paragraph or heading belong to that text, not their own.
    if (tag === "span" && el.closest("p,h1,h2,h3,h4,h5,h6")) continue;
    // Skip wrappers that hold other text so copy is not duplicated.
    if (el.querySelector("h1,h2,h3,h4,h5,h6,p,img,a,button")) continue;
    const plain = clean(el.innerText || el.textContent);
    if (!plain || seenText.has(plain)) continue;
    // A carousel's own counter ("2 / 14") beside its play button is replaced by the editor's controls.
    if (repeatingCards.length >= 3 && (/^\d+\s*(\/|of|—|–|-)\s*\d+$/i.test(plain) || (/^(\d{1,3}|\/|of)$/i.test(plain) && !!el.closest("div")?.parentElement?.querySelector("button")))) continue;
    seenText.add(plain);
    const rich = richOf(el);
    const text = rich ?? plain;

    const heading = /^h[1-6]$/.test(tag);
    const runs = rich ? [] : runsOf(el);
    if (runs.length > 1) {
      // Mixed styling (an italic phrase, a line break) keeps each run's look,
      // stacked in the same place.
      runs.forEach((run, ri) => {
        const style = { ...styleOf(run.styleEl, heading), sizePx: styleOf(el, heading).sizePx };
        if (ri === 0 && heading && !base.heading) {
          base.heading = run.text;
          base.textStyle = style;
          order.push("heading");
          textBoxes.push({ part: "heading", box: run.box });
          partAligns.heading = visualAlign(el, node);
          return;
        }
        extras.push({ id: id(), text: run.text, kind: heading ? "title" : "text", style });
        const part = `text:${extras.length - 1}`;
        order.push(part);
        textBoxes.push({ part, box: run.box });
        partAligns[part] = visualAlign(el, node);
      });
      continue;
    }
    const style = styleOf(el, heading);

    const iconHere = iconFor.get(el);
    if (!base.eyebrow && !heading && !iconHere && looksLikeEyebrow(el)) {
      base.eyebrow = text;
      base.eyebrowStyle = style;
      order.push("eyebrow");
      keepFlow("eyebrow", el);
      continue;
    }
    if (heading && !base.heading && !iconHere) {
      base.heading = text;
      base.textStyle = style;
      order.push("heading");
      keepFlow("heading", el);
      continue;
    }
    if (!heading && !base.body && !iconHere && plain.length > 24) {
      base.body = text;
      base.bodyStyle = style;
      order.push("body");
      keepFlow("body", el);
      continue;
    }

    const extra: FreeParagraph = {
      id: id(),
      text,
      kind: heading ? "title" : "text",
      style,
      ...(iconHere ? { icon: iconHere.icon, iconSide: iconHere.side } : {}),
    };
    extras.push(extra);
    const part = `text:${extras.length - 1}`;
    order.push(part);
    keepFlow(part, el);
  }

  // Divider lines: thin empty rules, and top/bottom border lines on wrappers,
  // placed where they sat so nearby buttons and text keep their position.
  const dividers: FreeDivider[] = [];
  {
    const nr = node.getBoundingClientRect();
    const nw = nr.width || 1;
    const addRule = (color: string | undefined, thickness: number, box: Box) => {
      if (dividers.some((d, i) => { const b = textBoxes.find((t) => t.part === `divider:${i}`)?.box; return b && Math.abs(b.top - box.top) < 3 && hOverlap(b, box) > 0.8; })) return;
      const pct = Math.round((box.width / nw) * 100);
      dividers.push({ id: id(), color: color as TextColor | undefined, thickness: Math.max(1, Math.round(thickness)), ...(pct >= 97 ? { width: "full" as const } : { widthPct: Math.max(2, pct) }) });
      const part = `divider:${dividers.length - 1}`;
      order.push(part);
      textBoxes.push({ part, box });
    };
    const els = parts.flatMap((p) => [p, ...p.querySelectorAll<HTMLElement>("*")]);
    for (const el of els) {
      if (el.closest("[data-import-skip],button,a,svg,form")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 16) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
      const empty = !clean(el.textContent) && !el.querySelector("img,video,svg");
      const bg = parseRgb(cs.backgroundColor);
      if (el.tagName === "HR" || (empty && r.height > 0 && r.height <= 4 && bg && bg[3] > 0.1)) {
        const col = el.tagName === "HR" && !(bg && bg[3] > 0.1) ? cs.borderTopColor : cs.backgroundColor;
        addRule(colorOf(col) ?? brandBorderColor(col), el.tagName === "HR" ? parseFloat(cs.borderTopWidth) || r.height || 1 : r.height, { left: r.left, right: r.right, top: r.top, bottom: r.top + 1, width: r.width } as Box);
        continue;
      }
      if (el === node || empty) continue;
      const b = borderOf(el);
      if (!b || b.all) continue;
      if (b.top) addRule(b.color, b.width, { left: r.left, right: r.right, top: r.top - 1, bottom: r.top, width: r.width } as Box);
      if (b.bottom) addRule(b.color, b.width, { left: r.left, right: r.right, top: r.bottom, bottom: r.bottom + 1, width: r.width } as Box);
    }
  }
  if (dividers.length) base.dividers = dividers;

  base.images = images;
  base.extras = extras;
  base.captionAlign = base.align;

  const ncs = getComputedStyle(node);
  const nodeWidth = node.getBoundingClientRect().width - (parseFloat(ncs.paddingLeft) || 0) - (parseFloat(ncs.paddingRight) || 0);
  const laid = layoutRows(textBoxes, nodeWidth);
  base.order = laid.order.length === order.length ? laid.order : order;
  if (Object.keys(laid.flows).length) {
    base.flows = laid.flows;
    base.rowVAlign = "top";
  }
  // Items on their own line that were narrower than the block keep that width.
  const widths = { ...laid.widths };
  for (const [part, el] of Object.entries(partEls)) {
    if (laid.flows[part] || !nodeWidth || imageBoxes.length) continue;
    const disp = getComputedStyle(el).display;
    if (disp.startsWith("inline") && part !== "videos") continue;
    const w = el.getBoundingClientRect().width;
    const pct = (w / nodeWidth) * 100;
    if (pct < 92 && pct > 5) widths[part] = Math.min(100, Math.round(pct + (part === "videos" ? 0 : 3)));
  }
  if (Object.keys(widths).length) base.flowWidths = widths;
  if (Object.keys(laid.stacks).length) base.stacks = laid.stacks;

  // Rows keep their spread (title far left, button far right) and vertical alignment.
  const rowNb = node.getBoundingClientRect();
  const cLeft = rowNb.left + (parseFloat(ncs.paddingLeft) || 0);
  const cRight = rowNb.right - (parseFloat(ncs.paddingRight) || 0);
  const vAligns: Record<string, "top" | "middle" | "bottom"> = {};
  for (const cols of laid.rows) {
    const first = cols[0], last = cols[cols.length - 1];
    const used = cols.reduce((n, c) => n + c.box.width, 0);
    const spread = first.box.left - cLeft < 16 && cRight - last.box.right < 16 && used < (cRight - cLeft) * 0.8;
    if (spread) {
      cols.forEach((c, ci) => {
        const a: SectionAlign = ci === 0 ? "left" : ci === cols.length - 1 ? "right" : "center";
        for (const part of c.parts) {
          delete widths[part];
          partAligns[part] = a;
        }
      });
    }
    const near = (f: (b: Box) => number) => Math.max(...cols.map((c) => f(c.box))) - Math.min(...cols.map((c) => f(c.box))) < 4;
    const v = near((b) => b.top) ? "top" : near((b) => b.bottom) ? "bottom" : near((b) => (b.top + b.bottom) / 2) ? "middle" : "top";
    for (const c of cols) for (const part of c.parts) vAligns[part] = v;
  }
  if (Object.keys(widths).length) base.flowWidths = widths; else delete base.flowWidths;
  if (Object.keys(vAligns).length) {
    base.flowVAligns = vAligns;
    base.rowVAlign = vAligns[laid.rows[0][0].parts[0]] ?? "top";
  }

  // Each text keeps its own alignment when it differs from the block's.
  const aligns: Record<string, SectionAlign> = {};
  for (const [part, a] of Object.entries(partAligns)) if (a !== base.align) aligns[part] = a;
  if (Object.keys(aligns).length) base.flowAligns = aligns;

  // A block whose items are mostly centred is a centred block.
  const alignVals = Object.values(partAligns);
  const centred = alignVals.filter((a) => a === "center").length;
  if (alignVals.length && centred > alignVals.length / 2 && base.align !== "center") {
    base.align = "center";
    base.captionAlign = "center";
    const re: Record<string, SectionAlign> = {};
    for (const [part, a] of Object.entries(partAligns)) if (a !== "center") re[part] = a;
    base.flowAligns = Object.keys(re).length ? re : undefined;
  }

  // Repeating product cards become a carousel (or grid) of pictures with their wording.
  if (repeatingCards.length >= 3) {
    base.gallery = carousel ? "carousel" : "grid";
    const cw = repeatingCards[0][1].getBoundingClientRect().width;
    const per = Math.max(1, Math.min(4, cw ? Math.round(nodeWidth / cw) : visibleCards || 3));
    base.columns = per as 1 | 2 | 3 | 4;
    if (carousel) base.perView = per;
    if (cardAlign) base.captionAlign = cardAlign;
    // Every card's picture keeps the height it had on the page.
    const [firstImg, firstCard] = repeatingCards[0];
    const ib = firstImg.getBoundingClientRect();
    if (ib.height > 24) base.imageHeightPx = Math.round(ib.height);
    // A bordered card outlines the whole item, picture and wording together.
    // Look at the card, anything inside it (down to the picture) and its
    // single-item wrappers — whichever carries a border or ring outline.
    const pool: HTMLElement[] = [];
    for (let el: HTMLElement | null = firstCard.parentElement; el && el !== node && el.querySelectorAll("img").length === 1; el = el.parentElement) pool.push(el);
    pool.reverse();
    pool.push(firstCard, ...Array.from(firstCard.querySelectorAll<HTMLElement>("*")).filter((d) => d.contains(firstImg) || d === firstImg));
    const ringOf = (el: HTMLElement) => {
      const m = getComputedStyle(el).boxShadow.match(/(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+(\d+(?:\.\d+)?)px/);
      return m && parseFloat(m[2]) > 0 && !/,\s*0\)$/.test(m[1]) ? { color: brandBorderColor(m[1]), width: Math.round(parseFloat(m[2])) || 1 } : null;
    };
    for (const el of pool) {
      const b = borderOf(el);
      const hit = b && (b.all || (b.top && b.bottom)) ? b : ringOf(el);
      if (hit) {
        const cs3 = getComputedStyle(el);
        base.imageBorder = true;
        base.imageBorderColor = hit.color as FreeSection["imageBorderColor"];
        base.imageBorderWidth = hit.width;
        base.imageBorderRadius = Math.round(parseFloat(cs3.borderTopLeftRadius)) || 0;
        base.imageBorderPad = el === firstImg ? 0 : Math.round(parseFloat(cs3.paddingTop)) || 0;
        break;
      }
    }
  } else if (images.length > 1 && imageBoxes.length) {
    const h = imageBoxes[0].bottom - imageBoxes[0].top;
    if (h > 24) base.imageHeightPx = Math.round(h);
  } else if (images.length === 1 && imageBoxes[0] && nodeWidth) {
    // A single picture keeps its original size.
    const b = imageBoxes[0];
    if (b.width < nodeWidth * 0.95) base.imageWidthPx = Math.round(b.width);
    const h = b.bottom - b.top;
    if (h > 24) base.imageHeightPx = Math.round(h);
  }

  // Spacing around the block follows the original padding.
  const cs = getComputedStyle(node);
  const padY = Math.round((parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) / 2);
  const padX = Math.round((parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) / 2);
  if (padY > 0) base.padY = padY;
  if (padX > 0) base.padX = padX;

  // Text that sat on top of a picture keeps sitting on top of it.
  if (overlaid) {
    base.layout = "behind";
    base.overlayVAlign = overlayVAlignOf(overlaid);
  }

  // Images that sat in their own column beside the copy keep that arrangement.
  const imageUnion = unionBox(imageBoxes);
  if (imageUnion && base.layout !== "behind") {
    const beside = textBoxes.filter((t) => vOverlap(t.box, imageUnion) > 0.3).map((t) => t.box);
    const besideUnion = unionBox(beside);
    if (besideUnion && hOverlap(besideUnion, imageUnion) < 0.2) {
      base.layout = "beside";
      base.imageSide = imageUnion.left < besideUnion.left ? "left" : "right";
    }
  }

  const bg = backgroundOf(node);
  if (bg) base.bg = bg;

  // Outlined cards: a bordered box wrapping a stacked column or a single item.
  const cards: NonNullable<FreeSection["cards"]> = {};
  const groupsByKey: Record<string, HTMLElement[]> = {};
  for (const [part, el] of Object.entries(partEls)) {
    if (!base.flows?.[part]) continue;
    const key = base.stacks?.[part] ?? part;
    (groupsByKey[key] ??= []).push(el);
  }
  for (const [key, els] of Object.entries(groupsByKey)) {
    let anc: HTMLElement | null = els[0];
    while (anc && anc !== node && !els.every((e) => anc!.contains(e))) anc = anc.parentElement;
    for (let el = anc; el && el !== node && node.contains(el); el = el.parentElement) {
      const b = borderOf(el);
      if (b && b.all) {
        const cs2 = getComputedStyle(el);
        cards[key] = {
          color: b.color,
          width: b.width,
          radius: Math.round(parseFloat(cs2.borderTopLeftRadius)) || 0,
          pad: Math.round(parseFloat(cs2.paddingTop)) || 24,
          ...(backgroundOf(el) ? { bg: backgroundOf(el) } : {}),
        };
        break;
      }
    }
  }
  if (Object.keys(cards).length) base.cards = cards;

  // Framing lines on the block itself, or on a wrapper whose edge it shares.
  const nb = node.getBoundingClientRect();
  for (let el: HTMLElement | null = node; el && el.tagName !== "BODY"; el = el.parentElement) {
    if (el.hasAttribute("data-import-root")) break;
    const b = borderOf(el);
    if (b) {
      const eb = el.getBoundingClientRect();
      const top = b.top && (el === node || Math.abs(eb.top - nb.top) < 140 + parseFloat(getComputedStyle(el).paddingTop));
      const bottom = b.bottom && (el === node || Math.abs(eb.bottom - nb.bottom) < 140 + parseFloat(getComputedStyle(el).paddingBottom));
      if (b.all && el === node) base.frame = "all";
      else if (top && bottom) base.frame = "y";
      else if (top) base.frame = "top";
      else if (bottom) base.frame = "bottom";
      if (base.frame) {
        base.frameColor = b.color;
        if (b.width > 1) base.frameWidth = b.width;
        break;
      }
    }
  }

  const empty = !base.heading && !base.eyebrow && !base.body && !images.length && !extras.length;
  return empty ? null : base;
}

/** Finds parts the editor can't rebuild: forms, embeds and special text effects. */
function lockedParts(root: HTMLElement): { el: HTMLElement; reason: string; title: string }[] {
  const found: { el: HTMLElement; reason: string; title: string }[] = [];
  const add = (el: HTMLElement, title: string, reason: string) => {
    if (found.some((f) => f.el.contains(el))) return;
    for (let i = found.length - 1; i >= 0; i -= 1) if (el.contains(found[i].el)) found.splice(i, 1);
    found.push({ el, title, reason });
  };
  root.querySelectorAll<HTMLElement>("form").forEach((el) =>
    add(el, "Form", "Forms collect and send information, which the object editor can't build."),
  );
  root.querySelectorAll<HTMLElement>("input,textarea,select").forEach((el) => {
    const host = (el.closest("form") ?? el.parentElement ?? el) as HTMLElement;
    add(host, "Form field", "Fields people type into can't be built in the object editor.");
  });
  root.querySelectorAll<HTMLElement>("iframe,canvas").forEach((el) =>
    add(el, "Embedded media", "Embedded players and drawn graphics can't be built in the object editor."),
  );
  root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,span").forEach((el) => {
    const cs = getComputedStyle(el);
    const clip = cs.backgroundClip === "text" || (cs as unknown as Record<string, string>).webkitBackgroundClip === "text";
    const shadow = cs.textShadow && cs.textShadow !== "none";
    const animated = /\banimate-(?!none)|\bmarquee|\bshimmer/.test(el.className?.toString() ?? "");
    const stroke = (cs as unknown as Record<string, string>).webkitTextStroke?.match(/^[1-9]/);
    if (!clip && !shadow && !animated && !stroke) return;
    const host = (el.closest("h1,h2,h3,h4,h5,h6,p") ?? el) as HTMLElement;
    add(
      host,
      "Special text effect",
      clip
        ? "This text uses a gradient or image fill, which the object editor can't reproduce."
        : shadow
          ? "This text uses a glow or shadow effect, which the object editor can't reproduce."
          : animated
            ? "This text moves or animates, which the object editor can't reproduce."
            : "This text uses an outline effect, which the object editor can't reproduce.",
    );
  });
  return found;
}

/** Reads a rendered coded object and returns editable blocks. */
export function sectionsFromDom(root: HTMLElement): Section[] {
  const locked = lockedParts(root).map((l) => {
    const section: LockedSection = {
      id: id(),
      type: "locked",
      title: l.title,
      note: l.reason,
      html: l.el.outerHTML,
    };
    return { ...l, section, top: l.el.getBoundingClientRect().top };
  });
  locked.forEach((l) => l.el.setAttribute("data-import-skip", ""));

  const out: Section[] = [];
  const boxes = new Map<Section, Box>();
  for (const l of locked) boxes.set(l.section, boxOf(l.el));
  const pending = [...locked];
  try {
    for (const group of blockRoots(root)) {
      const inside = pending.filter((l) => group.some((g) => g.contains(l.el)));
      const free = sectionFromNode(group);
      const freeTop = group[0].getBoundingClientRect().top;
      const before = free ? inside.filter((l) => l.top <= freeTop + 4) : inside;
      const after = inside.filter((l) => !before.includes(l));
      before.forEach((l) => out.push(l.section));
      if (free) {
        const cb = contentBox(group);
        if (cb) boxes.set(free, cb);
        out.push(free);
      }
      after.forEach((l) => out.push(l.section));
      inside.forEach((l) => pending.splice(pending.indexOf(l), 1));
    }
    pending.forEach((l) => out.push(l.section));
  } finally {
    locked.forEach((l) => l.el.removeAttribute("data-import-skip"));
  }
  return inlineRows(out, boxes, root.getBoundingClientRect().width);
}

/** Outer edges of a group's visible content, leaving out parts kept as locked sections. */
function contentBox(group: HTMLElement[]): Box | null {
  let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity;
  for (const g of group) {
    for (const el of [g, ...g.querySelectorAll<HTMLElement>("*")]) {
      if (el.closest("[data-import-skip]")) continue;
      const media = /^(img|video|svg|picture|button|hr)$/i.test(el.tagName);
      const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!media && !text) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom);
      left = Math.min(left, r.left); right = Math.max(right, r.right);
    }
  }
  return top < bottom ? { top, bottom, left, right, width: right - left } : null;
}

/** Sections that sat side by side on the page share a row again, left to right, at their old widths. */
function inlineRows(list: Section[], boxes: Map<Section, Box>, total: number): Section[] {
  const res: Section[] = [];
  let i = 0;
  while (i < list.length) {
    const row = [list[i]];
    let j = i + 1;
    while (j < list.length) {
      const b = boxes.get(list[j]);
      if (!b) break;
      const beside = row.every((r) => {
        const a = boxes.get(r);
        if (!a) return false;
        const ov = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        const minH = Math.min(a.bottom - a.top, b.bottom - b.top);
        return ov > minH * 0.5 && (a.right <= b.left + 4 || b.right <= a.left + 4);
      });
      if (!beside) break;
      row.push(list[j]);
      j += 1;
    }
    if (row.length > 1 && total > 0) {
      row.sort((a, b) => boxes.get(a)!.left - boxes.get(b)!.left);
      const used = row.reduce((n, r) => n + boxes.get(r)!.width, 0);
      for (const r of row) {
        const w = Math.round((boxes.get(r)!.width / Math.max(used, total * 0.6)) * 100);
        Object.assign(r, { flow: "inline", flowWidth: Math.max(10, Math.min(100, w)) });
      }
    }
    res.push(...row);
    i = j;
  }
  return res;
}
