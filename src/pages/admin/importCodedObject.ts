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
    uppercase: cs.textTransform === "uppercase" ? true : undefined,
    trackingEm: (() => {
      const ls = parseFloat(cs.letterSpacing);
      const fs = parseFloat(cs.fontSize) || 16;
      return Number.isFinite(ls) && Math.abs(ls) > 0.2 ? Math.round((ls / fs) * 1000) / 1000 : undefined;
    })(),
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
} {
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
        const fits = hits.length === 1 && it.box.width <= (hits[0].box.right - hits[0].box.left) * 1.25;
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
  return { flows, widths, stacks, order };
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
      const differs = cs.fontStyle !== pcs.fontStyle || cs.color !== pcs.color || cs.fontWeight !== pcs.fontWeight || cs.display === "block";
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
  !!clean(el.innerText || el.textContent) || !!el.querySelector("img");

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
function blockRoots(root: HTMLElement): HTMLElement[] {
  const sections = [...root.querySelectorAll<HTMLElement>("section")].filter(
    (s) => !s.parentElement?.closest("section"),
  );
  const tops = sections.length ? sections : [root];

  return tops.flatMap((top) => {
    const inner = contentRoot(top);
    const bands = [...inner.children].filter(
      (c): c is HTMLElement => c instanceof HTMLElement && isVisible(c) && hasContent(c),
    );
    // Keep everything in one block unless a band is itself a separate
    // picture-led area (a gallery below a heading, for instance).
    if (bands.length < 2) return [inner];
    const heavy = bands.filter((b) => b.querySelectorAll("img").length >= 2);
    return heavy.length && heavy.length < bands.length ? bands : [inner];
  });
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
  const textBoxes: { part: string; box: Box }[] = [];
  const imageBoxes: Box[] = [];

  const partAligns: Record<string, SectionAlign> = {};
  const keepFlow = (part: string, el: HTMLElement) => {
    textBoxes.push({ part, box: boxOf(el) });
    if (!partAligns[part]) partAligns[part] = alignOf(el);
  };

  const TEXTUAL = "h1,h2,h3,h4,h5,h6,p,span,img,a,button";
  const all = [node, ...node.querySelectorAll<HTMLElement>("*")].filter(isVisible);
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

  for (const el of imageEls) {
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


  for (const el of candidates) {
    const tag = el.tagName.toLowerCase();
    if (consumed.has(el)) continue;

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
        extras.push({ id: id(), text: label, kind: "text", style: styleOf(el, false) });
        const part = `text:${extras.length - 1}`;
        order.push(part);
        keepFlow(part, el);
        continue;
      }
      base.buttonLabel = label;
      base.buttonHref = el.getAttribute("href") ?? "#";
      base.buttonVariant = kind;
      base.labelStyle = styleOf(el, false);
      if (el.querySelector("svg")) {
        base.buttonIcon = "arrowRight";
        base.buttonIconSide = "after";
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
    const text = clean(el.innerText || el.textContent);
    if (!text || seenText.has(text)) continue;
    seenText.add(text);

    const heading = /^h[1-6]$/.test(tag);
    const runs = runsOf(el);
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
          partAligns.heading = alignOf(el);
          return;
        }
        extras.push({ id: id(), text: run.text, kind: heading ? "title" : "text", style });
        const part = `text:${extras.length - 1}`;
        order.push(part);
        textBoxes.push({ part, box: run.box });
        partAligns[part] = alignOf(el);
      });
      continue;
    }
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
  base.captionAlign = base.align;

  const nodeWidth = node.getBoundingClientRect().width;
  const laid = layoutRows(textBoxes, nodeWidth);
  base.order = laid.order.length === order.length ? laid.order : order;
  if (Object.keys(laid.flows).length) {
    base.flows = laid.flows;
    base.rowVAlign = "top";
  }
  if (Object.keys(laid.widths).length) base.flowWidths = laid.widths;
  if (Object.keys(laid.stacks).length) base.stacks = laid.stacks;

  // Each text keeps its own alignment when it differs from the block's.
  const aligns: Record<string, SectionAlign> = {};
  for (const [part, a] of Object.entries(partAligns)) if (a !== base.align) aligns[part] = a;
  if (Object.keys(aligns).length) base.flowAligns = aligns;

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
  root.querySelectorAll<HTMLElement>("iframe,canvas,video").forEach((el) =>
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
  const pending = [...locked];
  try {
    for (const node of blockRoots(root)) {
      const inside = pending.filter((l) => node.contains(l.el));
      const free = sectionFromNode(node);
      const freeTop = node.getBoundingClientRect().top;
      const before = free ? inside.filter((l) => l.top <= freeTop + 4) : inside;
      const after = inside.filter((l) => !before.includes(l));
      before.forEach((l) => out.push(l.section));
      if (free) out.push(free);
      after.forEach((l) => out.push(l.section));
      inside.forEach((l) => pending.splice(pending.indexOf(l), 1));
    }
    pending.forEach((l) => out.push(l.section));
  } finally {
    locked.forEach((l) => l.el.removeAttribute("data-import-skip"));
  }
  return out;
}
