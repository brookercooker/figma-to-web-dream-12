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

const serifStyle = (px: number): TextStyle => ({ font: "serif", px } as TextStyle);

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
      const label = clean(el.textContent);
      // Skip wrappers around images or long blocks of copy.
      if (!label || label.length > 40 || el.querySelector("img,h1,h2,h3,p")) continue;
      if (base.buttonLabel) continue;
      base.buttonLabel = label;
      base.buttonHref = el.getAttribute("href") ?? "#";
      base.buttonVariant = "outline";
      order.push("button");
      continue;
    }

    // Only take leaf text so we don't duplicate wrapper copy.
    if (el.querySelector("h1,h2,h3,h4,h5,h6,p,span,img,a,button")) continue;
    const text = clean(el.textContent);
    if (!text || seenText.has(text)) continue;
    seenText.add(text);

    const heading = /^h[1-6]$/.test(tag);
    const px = Math.round(parseFloat(getComputedStyle(el).fontSize)) || undefined;

    if (!base.eyebrow && !heading && looksLikeEyebrow(el)) {
      base.eyebrow = text;
      order.push("eyebrow");
      continue;
    }
    if (heading && !base.heading) {
      base.heading = text;
      base.textStyle = serifStyle(px ?? 48);
      order.push("heading");
      continue;
    }
    if (!heading && !base.body && text.length > 24) {
      base.body = text;
      base.bodyStyle = { font: "sans", px } as TextStyle;
      order.push("body");
      continue;
    }

    const extra: FreeParagraph = {
      id: id(),
      text,
      kind: heading ? "title" : "text",
      style: { font: heading ? "serif" : "sans", px } as TextStyle,
    };
    extras.push(extra);
    order.push(`text:${extras.length - 1}`);
  }

  base.images = images;
  base.extras = extras;
  base.order = order;
  base.captionAlign = base.align;

  const empty = !base.heading && !base.eyebrow && !base.body && !images.length && !extras.length;
  return empty ? null : base;
}

/** Reads a rendered coded object and returns editable blocks. */
export function sectionsFromDom(root: HTMLElement): Section[] {
  return blockRoots(root)
    .map(sectionFromNode)
    .filter((s): s is FreeSection => !!s);
}
