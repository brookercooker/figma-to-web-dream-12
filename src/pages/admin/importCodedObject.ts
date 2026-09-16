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
  type FreeParagraph,
  type FreeSection,
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
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
  return true;
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
 * Text that sat side by side on the page stays side by side: parts sharing a
 * vertical band become inline items, each keeping its share of the width.
 */
function inlineRows(
  parts: { part: string; box: Box }[],
  nodeWidth: number,
): { flows: Record<string, "inline">; widths: Record<string, number> } {
  const flows: Record<string, "inline"> = {};
  const widths: Record<string, number> = {};
  const rows: { part: string; box: Box }[][] = [];

  for (const item of parts) {
    const row = rows.find((r) => r.every((other) => vOverlap(other.box, item.box) > 0.5));
    if (row) row.push(item);
    else rows.push([item]);
  }

  for (const row of rows) {
    if (row.length < 2) continue;
    for (const { part, box } of row) {
      flows[part] = "inline";
      const pct = nodeWidth ? Math.round((box.width / nodeWidth) * 100) : 0;
      if (pct) widths[part] = Math.max(10, Math.min(100, pct));
    }
  }
  return { flows, widths };
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

/** Containers we treat as one editable block each. */
function blockRoots(root: HTMLElement): HTMLElement[] {
  const sections = [...root.querySelectorAll<HTMLElement>("section")].filter(
    (s) => !s.parentElement?.closest("section"),
  );
  return sections.length ? sections : [root];
}

function sectionFromNode(node: HTMLElement): FreeSection | null {
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
  const flows: Record<string, "inline" | "separate"> = {};
  const flowWidths: Record<string, number> = {};

  const keepFlow = (part: string, el: HTMLElement) => {
    const f = flowOf(el, node);
    if (f.flow !== "inline") return;
    flows[part] = "inline";
    if (f.width) flowWidths[part] = f.width;
  };

  const candidates = [
    ...node.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,span,img,a,button"),
  ].filter(isVisible);

  for (const el of candidates) {
    const tag = el.tagName.toLowerCase();

    if (tag === "img") {
      const img = el as HTMLImageElement;
      const url = img.currentSrc || img.src;
      if (url && !images.some((i) => i.url === url)) {
        images.push({ url, alt: clean(img.alt), href: el.closest("a")?.getAttribute("href") ?? undefined });
      }
      continue;
    }

    if (tag === "a" || tag === "button") {
      const label = clean(el.innerText || el.textContent);
      // Skip wrappers around images or long blocks of copy.
      if (!label || label.length > 40 || el.querySelector("img,h1,h2,h3,p")) continue;
      if (base.buttonLabel) continue;
      base.buttonLabel = label;
      base.buttonHref = el.getAttribute("href") ?? "#";
      base.buttonVariant = "outline";
      order.push("button");
      continue;
    }

    // Spans inside a paragraph or heading belong to that text, not their own.
    if (tag === "span" && el.closest("p,h1,h2,h3,h4,h5,h6")) continue;
    // Skip wrappers that hold other text so copy is not duplicated.
    if (el.querySelector("h1,h2,h3,h4,h5,h6,p,img,a,button")) continue;
    const text = clean(el.innerText || el.textContent);
    if (!text || seenText.has(text)) continue;
    seenText.add(text);

    const heading = /^h[1-6]$/.test(tag);
    const style = styleOf(el, heading);

    if (!base.eyebrow && !heading && looksLikeEyebrow(el)) {
      base.eyebrow = text;
      base.eyebrowStyle = style;
      order.push("eyebrow");
      keepFlow("eyebrow", el);
      continue;
    }
    if (heading && !base.heading) {
      base.heading = text;
      base.textStyle = style;
      order.push("heading");
      keepFlow("heading", el);
      continue;
    }
    if (!heading && !base.body && text.length > 24) {
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
    };
    extras.push(extra);
    const part = `text:${extras.length - 1}`;
    order.push(part);
    keepFlow(part, el);
  }

  base.images = images;
  base.extras = extras;
  base.order = order;
  base.captionAlign = base.align;
  if (Object.keys(flows).length) base.flows = flows;
  if (Object.keys(flowWidths).length) base.flowWidths = flowWidths;
  const bg = backgroundOf(node);
  if (bg) base.bg = bg;

  const empty = !base.heading && !base.eyebrow && !base.body && !images.length && !extras.length;
  return empty ? null : base;
}

/** Reads a rendered coded object and returns editable blocks. */
export function sectionsFromDom(root: HTMLElement): Section[] {
  return blockRoots(root)
    .map(sectionFromNode)
    .filter((s): s is FreeSection => !!s);
}
