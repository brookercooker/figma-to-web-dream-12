/**
 * Shared section model + renderer for Objects built in the Object Design page.
 * Sections are stored as JSON on `object_registry.content`.
 */

export type SectionAlign = "left" | "center" | "right";

export type TextFont = "serif" | "sans";
/** The Nova brand palette tokens. */
export type TextColorToken = "ink" | "stone" | "brass" | "garnet" | "cream";
/** A brand token, or any custom CSS color the user picks (e.g. "#3366ff"). */
export type TextColor = TextColorToken | (string & {});

/** True when the value is a custom color rather than a brand token. */
export function isCustomColor(c: TextColor | undefined): c is string {
  return !!c && !["ink", "stone", "brass", "garnet", "cream"].includes(c);
}
export type TextSize = "sm" | "md" | "lg" | "xl";

export interface TextStyle {
  font?: TextFont;
  color?: TextColor;
  size?: TextSize;
  /** exact size in px — overrides the preset size when set */
  sizePx?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export const MIN_TEXT_PX = 10;
export const MAX_TEXT_PX = 96;

/** Approximate px behind each preset, so the number input starts from the current look. */
export const HEADING_PX: Record<TextSize, number> = { sm: 24, md: 30, lg: 36, xl: 48 };
export const BODY_PX: Record<TextSize, number> = { sm: 14, md: 16, lg: 18, xl: 20 };

/** Inline font-size / custom color for text that overrides the presets. */
export function textInlineStyle(style: TextStyle | undefined): React.CSSProperties | undefined {
  const css: React.CSSProperties = {};
  if (style?.sizePx) css.fontSize = `${style.sizePx}px`;
  if (isCustomColor(style?.color)) css.color = style?.color as string;
  return Object.keys(css).length ? css : undefined;
}

/** Bold / italic / underline classes shared by every text element. */
export function emphasisClasses(style: TextStyle | undefined) {
  return [
    style?.bold ? "font-semibold" : "",
    style?.italic ? "italic" : "",
    style?.underline ? "underline underline-offset-4" : "",
  ].filter(Boolean).join(" ");
}

/**
 * Text fields may contain light inline markup (bold / italic / underline applied
 * to a portion of the text). Everything else is escaped before rendering.
 */
const ALLOWED_INLINE = /^(b|strong|i|em|u|s|br)$/i;

export function sanitizeInline(input: string): string {
  const escaped = input
    .replace(/&(?!(amp|lt|gt|nbsp|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/&lt;(\/?)([a-zA-Z]+)\s*\/?&gt;/g, (m, slash: string, tag: string) =>
    ALLOWED_INLINE.test(tag) ? `<${slash}${tag.toLowerCase()}>` : m,
  );
}

/** Spread onto an element to render text with its inline formatting. */
export function richText(text: string) {
  return { dangerouslySetInnerHTML: { __html: sanitizeInline(text) } };
}

export const TEXT_FONTS: { value: TextFont; label: string }[] = [
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans" },
];

export const TEXT_COLORS: { value: TextColor; label: string; swatch: string }[] = [
  { value: "ink", label: "Ink", swatch: "hsl(var(--nova-ink))" },
  { value: "stone", label: "Stone", swatch: "hsl(var(--nova-stone))" },
  { value: "brass", label: "Tan", swatch: "hsl(var(--nova-brass))" },
  { value: "garnet", label: "Garnet", swatch: "hsl(var(--nova-garnet))" },
  { value: "cream", label: "White", swatch: "hsl(var(--nova-cream))" },
];

export const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
];

const fontClass: Record<TextFont, string> = { serif: "font-serif font-light", sans: "font-sans" };
const colorClass: Record<TextColorToken, string> = {
  ink: "text-ink",
  stone: "text-stone",
  brass: "text-brass",
  garnet: "text-garnet",
  cream: "text-cream",
};
/** Class for a brand token; custom colors are applied inline instead. */
function colorClassOf(c: TextColor): string {
  return isCustomColor(c) ? "" : colorClass[c as TextColorToken];
}
const headingSizeClass: Record<TextSize, string> = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
};
const bodySizeClass: Record<TextSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

/** Eyebrows default to bold, 10px unless the user picks otherwise. */
export function withEyebrowDefaults(style: TextStyle | undefined): TextStyle {
  return {
    ...style,
    bold: style?.bold ?? true,
    sizePx: style?.sizePx ?? (style?.size ? undefined : 10),
  };
}

export function headingClasses(style: TextStyle | undefined, fallback: { color: TextColor; size: TextSize }) {
  return [
    fontClass[style?.font ?? "serif"],
    colorClassOf(style?.color ?? fallback.color),
    style?.sizePx ? "" : headingSizeClass[style?.size ?? fallback.size],
    emphasisClasses(style),
  ].join(" ");
}

export function bodyClasses(style: TextStyle | undefined, fallback: { color: TextColor; size: TextSize }) {
  return [
    fontClass[style?.font ?? "sans"],
    colorClassOf(style?.color ?? fallback.color),
    style?.sizePx ? "" : bodySizeClass[style?.size ?? fallback.size],
    emphasisClasses(style),
  ].join(" ");
}

export type ImageHeight = "auto" | "sm" | "md" | "lg" | "xl";

export const IMAGE_HEIGHTS: { value: ImageHeight; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
];

/** Fixed heights so every image in a row lines up. */
export const imageHeightClass: Record<ImageHeight, string> = {
  auto: "aspect-[4/3]",
  sm: "h-40 sm:h-48",
  md: "h-56 sm:h-64",
  lg: "h-72 sm:h-96",
  xl: "h-96 sm:h-[32rem]",
};

/** Extra text boxes (and rules) that sit under an image and scroll with it. */
export type ImageTextKind = "eyebrow" | "title" | "subheading" | "text" | "divider" | "button";

export const IMAGE_TEXT_KINDS: { value: ImageTextKind; label: string }[] = [
  { value: "eyebrow", label: "Eyebrow" },
  { value: "title", label: "Title" },
  { value: "subheading", label: "Subheading" },
  { value: "text", label: "Text" },
  { value: "divider", label: "Divider" },
  { value: "button", label: "Button" },
];

export interface ImageText {
  id: string;
  kind: ImageTextKind;
  text: string;
  style?: TextStyle;
  /** overrides the block-wide caption alignment for this text */
  align?: SectionAlign;
  /** bar settings when kind is "divider" */
  divider?: { color?: TextColor; width?: "full" | "short"; widthPct?: number; thickness?: number };
  /** link settings when kind is "button" */
  button?: { href?: string; variant?: ButtonSection["variant"]; bg?: TextColor };
}

export const IMAGE_TEXT_DEFAULTS: Record<
  ImageTextKind,
  { font: TextFont; color: TextColor; size: TextSize; heading: boolean }
> = {
  eyebrow: { font: "sans", color: "stone", size: "sm", heading: false },
  title: { font: "serif", color: "ink", size: "md", heading: true },
  subheading: { font: "serif", color: "ink", size: "sm", heading: true },
  text: { font: "sans", color: "stone", size: "sm", heading: false },
  divider: { font: "sans", color: "stone", size: "sm", heading: false },
  button: { font: "sans", color: "ink", size: "sm", heading: false },
};

export interface SectionImage {
  url: string;
  alt: string;
  caption?: string;
  /** overrides the block-wide caption alignment for this image's caption */
  captionAlign?: SectionAlign;
  /** extra text boxes shown under the image */
  texts?: ImageText[];
  /** optional destination opened when the image is clicked */
  href?: string;
  /** which image grid inside the block this image belongs to (default 0) */
  group?: number;
}

/** Images of a free block split into their grids, keeping original indexes. */
export function imageGroups(images: SectionImage[]): { key: number; items: { image: SectionImage; index: number }[] }[] {
  const map = new Map<number, { image: SectionImage; index: number }[]>();
  images.forEach((image, index) => {
    const key = image.group ?? 0;
    if (!map.has(key)) map.set(key, []);
    (map.get(key) as { image: SectionImage; index: number }[]).push({ image, index });
  });
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([key, items]) => ({ key, items }));
}

/** Part name used for an image grid inside a block. */
export function imageGroupPart(key: number): string {
  return key === 0 ? "images" : `images:${key}`;
}

/** Display settings that each image grid inside a block can set on its own. */
export interface FreeImageGroupSettings {
  gallery?: "grid" | "carousel";
  perView?: number;
  imageHeight?: ImageHeight;
  imageAlign?: SectionAlign;
  imageBorder?: boolean;
  imageBorderColor?: TextColor;
  imageBorderWidth?: number;
  imageBorderRadius?: number;
  imageBorderPad?: number;
  imageBorderStyle?: "solid" | "dashed" | "dotted";
}

/** CSS color value for a semantic text color token. */
export function textColorCss(c: TextColor): string {
  return TEXT_COLORS.find((t) => t.value === c)?.swatch ?? "hsl(var(--nova-sand))";
}

/** Inline style for the box drawn around an image and its text. */
export function imageBorderStyleOf(section: FreeSection): React.CSSProperties {
  return {
    borderWidth: `${section.imageBorderWidth ?? 1}px`,
    borderStyle: section.imageBorderStyle ?? "solid",
    borderColor: section.imageBorderColor ? textColorCss(section.imageBorderColor) : "hsl(var(--nova-sand))",
    borderRadius: `${section.imageBorderRadius ?? 8}px`,
    padding: `${section.imageBorderPad ?? 12}px`,
  };
}

/** Merge a grid's own settings over the block defaults. */
export function groupSection(section: FreeSection, key: number): FreeSection {
  const s = section.groupSettings?.[String(key)];
  if (!s) return section;
  const merged: FreeSection = { ...section };
  for (const [k, v] of Object.entries(s)) {
    if (v !== undefined) (merged as unknown as Record<string, unknown>)[k] = v;
  }
  return merged;
}

/** A video placed in a block: an uploaded file or a YouTube / Vimeo link. */
export interface SectionVideo {
  id: string;
  url: string;
  poster?: string;
  caption?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/** Turn a YouTube / Vimeo link into an embed URL. Returns null for plain files. */
export function videoEmbedUrl(url: string): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["shorts", "embed", "live"].includes(parts[0])) {
      return `https://www.youtube.com/embed/${parts[1]}`;
    }
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p));
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  return null;
}

/**
 * How an item sits next to its neighbours.
 * inline = shares a row with the inline items around it, each in its own column.
 * separate = always takes a row of its own.
 */
export type SectionFlow = "inline" | "separate";

export const FLOW_OPTIONS: { value: SectionFlow; label: string }[] = [
  { value: "separate", label: "Own row" },
  { value: "inline", label: "Same row" },
];

/** Flex style for an inline item with an optional width percentage. */
export function flowWidthStyle(width?: number): React.CSSProperties {
  if (!width || width <= 0) return {};
  const w = Math.min(100, Math.max(1, width));
  return { flex: `0 0 ${w}%`, maxWidth: `${w}%` };
}

/** Group consecutive inline entries together; separate entries stand alone. */
export function groupByFlow<T>(items: T[], flowOf: (item: T) => SectionFlow | undefined): T[][] {
  const groups: T[][] = [];
  for (const item of items) {
    const inline = flowOf(item) === "inline";
    const last = groups[groups.length - 1];
    if (inline && last && last.length && flowOf(last[0]) === "inline") last.push(item);
    else groups.push([item]);
  }
  return groups;
}

export interface CarouselSection {
  id: string;
  type: "carousel";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  heading?: string;
  textStyle?: TextStyle;
  captionStyle?: TextStyle;
  images: SectionImage[];
}

export interface ImageRowSection {
  id: string;
  type: "imageRow";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  heading?: string;
  textStyle?: TextStyle;
  columns: 2 | 3 | 4;
  images: SectionImage[];
}

export interface CaptionedImagesSection {
  id: string;
  type: "captionedImages";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  heading?: string;
  textStyle?: TextStyle;
  captionStyle?: TextStyle;
  columns: 1 | 2 | 3;
  images: SectionImage[];
}

export interface OverlaySection {
  id: string;
  type: "overlay";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  image: SectionImage;
  eyebrow?: string;
  heading: string;
  body?: string;
  align: SectionAlign;
  height: "sm" | "md" | "lg";
  textStyle?: TextStyle;
  bodyStyle?: TextStyle;
  eyebrowStyle?: TextStyle;
  labelStyle?: TextStyle;
  buttonLabel?: string;
  buttonHref?: string;
}

export interface SplitSection {
  id: string;
  type: "split";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  image: SectionImage;
  imageSide: "left" | "right";
  textStyle?: TextStyle;
  bodyStyle?: TextStyle;
  eyebrowStyle?: TextStyle;
  labelStyle?: TextStyle;
  eyebrow?: string;
  heading: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export interface ButtonSection {
  id: string;
  type: "button";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  label: string;
  href: string;
  align: SectionAlign;
  variant: "solid" | "outline" | "link";
  labelStyle?: TextStyle;
}

/** Freeform block: a blank space you add text and images to. */
export type FreeTextKind = "eyebrow" | "title" | "text";

export const FREE_TEXT_KINDS: { value: FreeTextKind; label: string }[] = [
  { value: "eyebrow", label: "Eyebrow" },
  { value: "title", label: "Title" },
  { value: "text", label: "Text" },
];

export interface FreeParagraph {
  id: string;
  text: string;
  /** what sort of text this is; defaults to a body paragraph */
  kind?: FreeTextKind;
  style?: TextStyle;
}

/** A separating bar placed between content. */
export interface FreeDivider {
  id: string;
  color?: TextColor;
  /** full = spans the block, short = a small centered/aligned rule */
  width?: "full" | "short";
  /** width as a percentage of the available width (1-100); overrides width when set */
  widthPct?: number;
  /** bar thickness in px */
  thickness?: number;
  /** @deprecated placement is now controlled by FreeSection.order */
  after?: string;
}

export type RowVAlign = "top" | "middle" | "bottom" | "baseline";

export const ROW_VALIGN_CLASS: Record<RowVAlign, string> = {
  top: "items-start",
  middle: "items-center",
  bottom: "items-end",
  baseline: "items-baseline",
};

export type OverlayVAlign = "top" | "middle" | "bottom";

export const OVERLAY_VALIGN_CLASS: Record<OverlayVAlign, string> = {
  top: "justify-start",
  middle: "justify-center",
  bottom: "justify-end",
};

export interface FreeSection {
  id: string;
  type: "free";
  flow?: SectionFlow;
  /** width percentage when inline (10-100) */
  flowWidth?: number;
  /** per-element flow, keyed by part (eyebrow, heading, body, text:i, divider:i, button) */
  flows?: Record<string, SectionFlow>;
  /** per-element inline width percentage, keyed by the same parts */
  flowWidths?: Record<string, number>;
  /** per-element alignment within its inline column, keyed by the same parts */
  flowAligns?: Record<string, SectionAlign>;
  /** vertical alignment of items sharing a row */
  rowVAlign?: RowVAlign;
  /** separating bars shown under the text content */
  dividers?: FreeDivider[];
  /** explicit stacking order of text parts (eyebrow, heading, body, text:i, divider:i, button) */
  order?: string[];
  eyebrow?: string;
  heading?: string;
  body?: string;
  /** additional paragraphs, each with its own styling */
  extras?: FreeParagraph[];
  eyebrowStyle?: TextStyle;
  textStyle?: TextStyle;
  bodyStyle?: TextStyle;
  captionStyle?: TextStyle;
  labelStyle?: TextStyle;
  images: SectionImage[];
  /** videos placed under the text / images */
  videos?: SectionVideo[];
  /** how images sit relative to the text */
  layout: "stacked" | "beside" | "behind";
  imageSide: "left" | "right";
  gallery: "grid" | "carousel";
  columns: 1 | 2 | 3 | 4;
  /** how many images show at once in carousel mode */
  perView?: number;
  /** shared height for every image in the block */
  imageHeight?: ImageHeight;
  /** horizontal position of images when they don't fill the width */
  imageAlign?: SectionAlign;
  /** horizontal alignment of image captions */
  captionAlign?: SectionAlign;
  /** draw a border around each image and its text */
  imageBorder?: boolean;
  /** border customization */
  imageBorderColor?: TextColor;
  imageBorderWidth?: number;
  imageBorderRadius?: number;
  imageBorderPad?: number;
  imageBorderStyle?: "solid" | "dashed" | "dotted";
  /** per image-grid overrides, keyed by grid number */
  groupSettings?: Record<string, FreeImageGroupSettings>;
  align: SectionAlign;
  /** vertical position of text sitting over an image ("behind" layout) */
  overlayVAlign?: "top" | "middle" | "bottom";
  height: "sm" | "md" | "lg";
  buttonLabel?: string;
  buttonHref?: string;
  buttonVariant?: "solid" | "outline" | "link";
  /** background color for the button */
  buttonBg?: TextColor;
}

export type Section =
  | CarouselSection
  | ImageRowSection
  | CaptionedImagesSection
  | OverlaySection
  | SplitSection
  | ButtonSection
  | FreeSection;

export type SectionType = Section["type"];

export const SECTION_LABEL: Record<SectionType, string> = {
  free: "Block",
  carousel: "Carousel",
  imageRow: "Row of images",
  captionedImages: "Images with captions",
  overlay: "Image with text on top",
  split: "Image beside text",
  button: "Button",
};

export const newSectionId = () =>
  globalThis.crypto?.randomUUID?.() ?? `s-${Math.random().toString(36).slice(2)}`;

const emptyImage = (): SectionImage => ({ url: "", alt: "" });

export function makeSection(type: SectionType): Section {
  const id = newSectionId();
  switch (type) {
    case "free":
      return {
        id, type: "free", images: [], layout: "stacked", imageSide: "left",
        gallery: "grid", columns: 2, align: "left", height: "md",
      };
    case "carousel":
      return { id, type, heading: "", images: [emptyImage(), emptyImage()] };
    case "imageRow":
      return { id, type, heading: "", columns: 3, images: [emptyImage(), emptyImage(), emptyImage()] };
    case "captionedImages":
      return { id, type, heading: "", columns: 2, images: [emptyImage(), emptyImage()] };
    case "overlay":
      return {
        id, type, image: emptyImage(), heading: "A quiet statement",
        body: "", align: "center", height: "md", eyebrow: "", buttonLabel: "", buttonHref: "",
      };
    case "split":
      return {
        id, type, image: emptyImage(), imageSide: "left", heading: "Designed to be lived with",
        body: "", eyebrow: "", buttonLabel: "", buttonHref: "",
      };
    case "button":
    default:
      return { id, type: "button", label: "Explore", href: "/", align: "center", variant: "solid" };
  }
}

export function parseSections(value: unknown): Section[] {
  if (Array.isArray(value)) return value as Section[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as Section[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ------------------------------- rendering ------------------------------- */

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const alignText: Record<SectionAlign, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

const alignRow: Record<SectionAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const alignTextOnly: Record<SectionAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const colClass: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

const overlayHeight: Record<OverlaySection["height"], string> = {
  sm: "min-h-[280px]",
  md: "min-h-[420px]",
  lg: "min-h-[560px]",
};

function Placeholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground ${className}`}
    >
      Image
    </div>
  );
}

function Pic({ image, className }: { image: SectionImage; className: string }) {
  if (!image?.url) return <Placeholder className={className} />;
  const href = image.href?.trim();
  const inner = (
    <img
      src={image.url}
      alt={image.alt || ""}
      loading="lazy"
      className="block h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover/pic:scale-[1.04]"
    />
  );
  const box = `${className} group/pic overflow-hidden`;
  if (href) {
    const external = /^(https?:)?\/\//i.test(href);
    return (
      <a
        href={href}
        className={`block ${box}`}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return <div className={box}>{inner}</div>;
}

const bgClass: Record<TextColor, string> = {
  ink: "bg-ink hover:bg-ink/90",
  stone: "bg-stone hover:bg-stone/90",
  brass: "bg-brass hover:bg-brass/90",
  garnet: "bg-garnet hover:bg-garnet/90",
  cream: "bg-cream hover:bg-cream/90",
};
const bgTextColor: Record<TextColor, TextColor> = {
  ink: "cream", stone: "cream", brass: "ink", garnet: "cream", cream: "ink",
};

function SectionButton({
  label, href, variant = "solid", style, bg,
}: { label: string; href: string; variant?: ButtonSection["variant"]; style?: TextStyle; bg?: TextColor }) {
  const base = "inline-flex items-center justify-center uppercase tracking-[0.18em] transition-colors";
  const fill = bg ?? "ink";
  const styles =
    variant === "outline"
      ? "border border-ink px-7 py-3 hover:bg-ink hover:text-cream"
      : variant === "link"
        ? `${style?.underline === false ? "" : "underline underline-offset-4"} hover:text-brass`
        : `${bgClass[fill]} px-7 py-3`;
  const text = bodyClasses(style, { color: variant === "solid" ? bgTextColor[fill] : "ink", size: "sm" });
  return (
    <a href={href || "#"} className={`${base} ${styles} ${text}`} style={textInlineStyle(style)} {...richText(label)} />
  );
}

function Carousel({ section }: { section: CarouselSection }) {
  const images = section.images.length ? section.images : [emptyImage()];
  const [i, setI] = useState(0);
  const n = images.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  useEffect(() => { setI((v) => (v < n ? v : 0)); }, [n]);

  return (
    <div className="relative overflow-hidden rounded-lg aspect-[16/9] bg-muted">
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
        >
          <Pic image={img} className="h-full w-full" />
          {img.caption ? (
            <div
              className={`absolute bottom-0 inset-x-0 bg-ink/50 px-6 py-3 ${bodyClasses(section.captionStyle, { color: "cream", size: "sm" })}`}
            >
              {img.caption}
            </div>
          ) : null}
        </div>
      ))}
      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={(e) => { e.stopPropagation(); setI((v) => (v - 1 + n) % n); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-cream/85 hover:bg-cream p-2 shadow"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={(e) => { e.stopPropagation(); setI((v) => (v + 1) % n); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-cream/85 hover:bg-cream p-2 shadow"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={(e) => { e.stopPropagation(); setI(idx); }}
                className={`h-2 w-2 rounded-full transition ${idx === i ? "bg-cream" : "bg-cream/50 hover:bg-cream/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** An image plus its caption and any extra text boxes, optionally boxed by a border. */
function FreeFigureBody({
  section, image, index, onDark,
}: { section: FreeSection; image: SectionImage; index: number; onDark?: boolean }) {
  const blockAlign: SectionAlign = section.captionAlign ?? "left";
  const align = alignTextOnly[image.captionAlign ?? blockAlign];
  const baseColor: TextColor = onDark ? "cream" : "stone";
  const texts = image.texts ?? [];
  const bordered = !!section.imageBorder;

  return (
    <div
      className={bordered ? "overflow-hidden" : ""}
      style={bordered ? imageBorderStyleOf(section) : undefined}
    >
      <div data-part={`image:${index}`}>
        <Pic image={image} className={`w-full rounded-lg ${imageHeightClass[section.imageHeight ?? "auto"]}`} />
      </div>
      {image.caption ? (
        <figcaption
          data-part={`caption:${index}`}
          className={`mt-3 leading-relaxed ${align} ${bodyClasses(section.captionStyle, { color: baseColor, size: "sm" })}`}
          style={textInlineStyle(section.captionStyle)}
          {...richText(image.caption)}
        />
      ) : null}
      {texts.map((t, ti) => {
        const d = IMAGE_TEXT_DEFAULTS[t.kind];
        const ts = t.kind === "eyebrow" ? withEyebrowDefaults(t.style) : t.style;
        const fallback = { color: onDark ? ("cream" as TextColor) : d.color, size: d.size };
        const cls = d.heading ? headingClasses(ts, fallback) : bodyClasses(ts, fallback);
        if (t.kind === "divider") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className="mt-3 flex w-full flex-col">
              <DividerBar
                divider={{ id: t.id, ...(t.divider ?? {}) }}
                align={t.align ?? image.captionAlign ?? blockAlign}
                onDark={onDark}
              />
            </div>
          );
        }
        if (t.kind === "button") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className={`mt-3 ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]}`}>
              <SectionButton
                label={t.text || "Button"}
                href={t.button?.href || "#"}
                variant={t.button?.variant ?? (onDark ? "outline" : "solid")}
                style={t.style}
                bg={t.button?.bg}
              />
            </div>
          );
        }
        return (
          <p
            key={t.id}
            data-part={`imagetext:${index}:${ti}`}
            className={`${t.kind === "subheading" ? "mt-0" : "mt-3"} leading-relaxed ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]} ${t.kind === "eyebrow" ? "uppercase tracking-[0.24em]" : ""} ${cls}`}
            style={textInlineStyle(ts)}
            {...richText(t.text)}
          />
        );
      })}
    </div>
  );
}

function FreeCarousel({ section, onDark, items }: { section: FreeSection; onDark?: boolean; items?: { image: SectionImage; index: number }[] }) {
  const entries = items ?? section.images.map((image, index) => ({ image, index }));
  const n = entries.length;
  const perView = Math.min(Math.max(section.perView ?? 1, 1), Math.max(n, 1));
  const loop = n > perView;
  const steps = loop ? n : Math.max(n - perView + 1, 1);
  const display = loop ? [...entries, ...entries.slice(0, perView)] : entries;
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true);

  useEffect(() => { setI((v) => (v < steps ? v : 0)); setAnim(true); }, [steps]);

  // jump without animation, then continue to `then` on the next frame
  const snapTo = (pos: number, then?: number) => {
    setAnim(false);
    setI(pos);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnim(true);
      if (then !== undefined) setI(then);
    }));
  };

  const next = () => {
    if (!loop) { setI((v) => (v + 1) % steps); return; }
    if (i >= n) { snapTo(0, 1); return; }
    setI(i + 1);
  };
  const prev = () => {
    if (!loop) { setI((v) => (v - 1 + steps) % steps); return; }
    if (i <= 0) { snapTo(n, n - 1); return; }
    setI(i - 1);
  };

  // after sliding onto the cloned first slide, snap silently back to the real one
  useEffect(() => {
    if (!loop || i !== n) return;
    const t = setTimeout(() => snapTo(0), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, n, loop]);

  useEffect(() => {
    if (steps < 2) return;
    const t = setInterval(() => { nextRef.current(); }, 5000);
    return () => clearInterval(t);
  }, [steps]);

  const nextRef = useRef(next);
  nextRef.current = next;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div
          className={`flex ${anim ? "transition-transform duration-700 ease-out" : ""}`}
          style={{ transform: `translateX(-${(i * 100) / perView}%)` }}
        >
          {display.map((e, di) => (
            <figure key={`${e.index}-${di}`} className="shrink-0 px-2 first:pl-0 last:pr-0" style={{ width: `${100 / perView}%` }}>
              <FreeFigureBody section={section} image={e.image} index={e.index} onDark={onDark} />
            </figure>
          ))}

        </div>
      </div>
      {steps > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-cream/85 hover:bg-cream p-2 shadow"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-cream/85 hover:bg-cream p-2 shadow"
          >
            <ChevronRight className="h-5 w-5 text-ink" />
          </button>
        </>
      )}
    </div>
  );
}

function FreeGallery({ section, onDark, items }: { section: FreeSection; onDark?: boolean; items?: { image: SectionImage; index: number }[] }) {
  const entries = items ?? section.images.map((image, index) => ({ image, index }));
  if (!entries.length) return null;
  if (section.gallery === "carousel") {
    return <FreeCarousel section={section} onDark={onDark} items={entries} />;
  }

  return (
    <div
      className={`flex flex-nowrap items-start gap-6 ${alignRow[section.imageAlign ?? "left"]}`}
    >
      {entries.map((e) => (
        <figure key={e.index} className="basis-0 grow min-w-0">
          <FreeFigureBody section={section} image={e.image} index={e.index} onDark={onDark} />
        </figure>
      ))}
    </div>
  );

}

export function VideoPlayer({ video, className = "" }: { video: SectionVideo; className?: string }) {
  const embed = videoEmbedUrl(video.url);
  const box = `w-full overflow-hidden rounded-lg bg-muted aspect-video ${className}`;
  if (!video.url?.trim()) {
    return (
      <div className={`${box} flex items-center justify-center text-xs text-muted-foreground`}>Video</div>
    );
  }
  if (embed) {
    const params = new URLSearchParams();
    if (video.autoplay) { params.set("autoplay", "1"); params.set("muted", "1"); params.set("mute", "1"); }
    if (video.loop) params.set("loop", "1");
    const q = params.toString();
    return (
      <div className={box}>
        <iframe
          src={q ? `${embed}?${q}` : embed}
          title={video.caption || "Video"}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className={box}>
      <video
        src={video.url}
        poster={video.poster || undefined}
        className="h-full w-full object-cover"
        controls={video.controls !== false}
        autoPlay={!!video.autoplay}
        loop={!!video.loop}
        muted={video.muted ?? !!video.autoplay}
        playsInline
        preload="metadata"
      />
    </div>
  );
}

function FreeVideos({ section, onDark }: { section: FreeSection; onDark?: boolean }) {
  const videos = section.videos ?? [];
  if (!videos.length) return null;
  const align = alignTextOnly[section.captionAlign ?? "left"];
  return (
    <div className="space-y-8">
      {videos.map((v, i) => (
        <figure key={v.id} data-part={`video:${i}`}>
          <VideoPlayer video={v} />
          {v.caption ? (
            <figcaption
              className={`mt-3 leading-relaxed ${align} ${bodyClasses(section.captionStyle, { color: onDark ? "cream" : "stone", size: "sm" })}`}
              style={textInlineStyle(section.captionStyle)}
              {...richText(v.caption)}
            />
          ) : null}
        </figure>
      ))}
    </div>
  );
}

const dividerBg: Record<TextColor, string> = {
  ink: "bg-ink",
  stone: "bg-stone",
  brass: "bg-brass",
  garnet: "bg-garnet",
  cream: "bg-cream",
};

const dividerSelf: Record<SectionAlign, string> = {
  left: "self-start",
  center: "self-center",
  right: "self-end",
};

/** Sort rendered parts by an explicit order list; unlisted parts keep their default spot. */
export function orderParts<T extends { part: string }>(items: T[], order?: string[]): T[] {
  if (!order?.length) return items;
  const rank = new Map(order.map((p, i) => [p, i]));
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => {
      const ra = rank.has(a.it.part) ? (rank.get(a.it.part) as number) : order.length + a.i;
      const rb = rank.has(b.it.part) ? (rank.get(b.it.part) as number) : order.length + b.i;
      return ra - rb || a.i - b.i;
    })
    .map((x) => x.it);
}

export function DividerBar({
  divider, align, onDark,
}: { divider: FreeDivider; align: SectionAlign; onDark?: boolean }) {
  const color: TextColor = divider.color ?? (onDark ? "cream" : "stone");
  const cls = dividerBg[color];
  const pct = divider.widthPct;
  const sized = typeof pct === "number"
    ? `${dividerSelf[align]}`
    : divider.width === "short" ? `w-24 ${dividerSelf[align]}` : "w-full";
  return (
    <div
      className={`${cls} ${sized} my-2 rounded-full`}
      style={{
        height: `${divider.thickness ?? 1}px`,
        ...(typeof pct === "number" ? { width: `${Math.min(100, Math.max(1, pct))}%` } : null),
      }}
    />
  );
}

function FreeText({
  section,
  onDark,
  media,
}: { section: FreeSection; onDark?: boolean; media?: { part: string; node: React.ReactNode }[] }) {
  const hasText =
    section.eyebrow || section.heading || section.body || section.buttonLabel ||
    (section.extras ?? []).length || (section.dividers ?? []).length || (media ?? []).length;
  if (!hasText) return null;
  const base: TextColor = onDark ? "cream" : "ink";
  const boxSelf = (part: string) => {
    const a = section.flowAligns?.[part] ?? section.align;
    return a === "center" ? "mx-auto" : a === "right" ? "ml-auto" : "";
  };
  const flowOf = (part: string) => section.flows?.[part];
  const items: { part: string; node: React.ReactNode }[] = [];

  if (section.eyebrow) items.push({ part: "eyebrow", node: (
    <p
      data-part="eyebrow"
      className={`uppercase tracking-[0.24em] ${bodyClasses(withEyebrowDefaults(section.eyebrowStyle), { color: onDark ? "cream" : "stone", size: "sm" })}`}
      style={textInlineStyle(withEyebrowDefaults(section.eyebrowStyle))}
      {...richText(section.eyebrow)}
    />
  ) });
  if (section.heading) items.push({ part: "heading", node: (
    <h2
      data-part="heading"
      className={`max-w-2xl ${boxSelf("heading")} ${headingClasses(section.textStyle, { color: base, size: "xl" })}`}
      style={textInlineStyle(section.textStyle)}
      {...richText(section.heading)}
    />
  ) });
  if (section.body) items.push({ part: "body", node: (
    <p
      data-part="body"
      className={`max-w-xl ${boxSelf("body")} leading-relaxed whitespace-pre-wrap ${bodyClasses(section.bodyStyle, { color: onDark ? "cream" : "stone", size: "md" })}`}
      style={textInlineStyle(section.bodyStyle)}
      {...richText(section.body)}
    />
  ) });
  (section.extras ?? []).forEach((t, i) => {
    const part = `text:${i}`;
    const kind = t.kind ?? "text";
    if (kind === "title") {
      items.push({ part, node: (
        <h2
          data-part={part}
          className={`max-w-2xl ${boxSelf(part)} ${headingClasses(t.style, { color: base, size: "xl" })}`}
          style={textInlineStyle(t.style)}
          {...richText(t.text)}
        />
      ) });
      return;
    }
    if (kind === "eyebrow") {
      const es = withEyebrowDefaults(t.style);
      items.push({ part, node: (
        <p
          data-part={part}
          className={`uppercase tracking-[0.24em] ${bodyClasses(es, { color: onDark ? "cream" : "stone", size: "sm" })}`}
          style={textInlineStyle(es)}
          {...richText(t.text)}
        />
      ) });
      return;
    }
    items.push({ part, node: (
      <p
        data-part={part}
        className={`max-w-xl ${boxSelf(part)} leading-relaxed whitespace-pre-wrap ${bodyClasses(t.style, { color: onDark ? "cream" : "stone", size: "md" })}`}
        style={textInlineStyle(t.style)}
        {...richText(t.text)}
      />
    ) });
  });
  if (section.buttonLabel) items.push({ part: "button", node: (
    <div data-part="button" className="mt-2">
      <SectionButton
        label={section.buttonLabel}
        href={section.buttonHref || "#"}
        variant={section.buttonVariant ?? (onDark ? "outline" : "solid")}
        style={section.labelStyle}
        bg={section.buttonBg}
      />
    </div>
  ) });

  (section.dividers ?? []).forEach((d, i) => items.push({
    part: `divider:${i}`,
    node: (
      <div data-part={`divider:${i}`} className="w-full flex flex-col">
        <DividerBar divider={d} align={section.align} onDark={onDark} />
      </div>
    ),
  }));

  (media ?? []).forEach((m) => items.push(m));

  const ordered = orderParts(items, section.order);

  const groups = groupByFlow(ordered, (it) => flowOf(it.part));

  return (
    <div className={`flex flex-col gap-4 ${alignText[section.align]}`}>
      {groups.map((group) =>
        group.length > 1 ? (
          <div key={group[0].part} className={`-mx-3 flex w-full flex-wrap ${ROW_VALIGN_CLASS[section.rowVAlign ?? "middle"]} ${alignRow[section.align]}`}>
            {group.map((it) => {
              const w = section.flowWidths?.[it.part];
              const a = section.flowAligns?.[it.part] ?? section.align;
              return (
                <div
                  key={it.part}
                  className={`flex flex-col px-3 ${alignText[a]} ${w ? "" : "min-w-[10rem] flex-1 basis-0"}`}
                  style={flowWidthStyle(w)}
                >
                  {it.node}
                </div>
              );
            })}
          </div>
        ) : (
          (() => {
            const it = group[0];
            const w = section.flowWidths?.[it.part];
            const a = section.flowAligns?.[it.part] ?? section.align;
            return (
              <div
                key={it.part}
                className={`flex w-full ${alignRow[a]}`}
              >
                <div
                  className={`flex flex-col ${alignText[a]} ${w ? "" : "w-full"}`}
                  style={flowWidthStyle(w)}
                >
                  {it.node}
                </div>
              </div>
            );
          })()
        )

      )}
    </div>
  );
}

/** Text boxes attached to an image, rendered in front of it for the "behind" layout. */
function OverlayImageTexts({
  section, image, index,
}: { section: FreeSection; image: SectionImage; index: number }) {
  const texts = image.texts ?? [];
  if (!texts.length) return null;
  const blockAlign: SectionAlign = section.align ?? "left";
  return (
    <>
      {texts.map((t, ti) => {
        const d = IMAGE_TEXT_DEFAULTS[t.kind];
        const ts = t.kind === "eyebrow" ? withEyebrowDefaults(t.style) : t.style;
        const fallback = { color: "cream" as TextColor, size: d.size };
        const cls = d.heading ? headingClasses(ts, fallback) : bodyClasses(ts, fallback);
        if (t.kind === "divider") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className="mt-3 flex w-full flex-col">
              <DividerBar
                divider={{ id: t.id, ...(t.divider ?? {}) }}
                align={t.align ?? image.captionAlign ?? blockAlign}
                onDark
              />
            </div>
          );
        }
        if (t.kind === "button") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className={`mt-3 ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]}`}>
              <SectionButton
                label={t.text || "Button"}
                href={t.button?.href || "#"}
                variant={t.button?.variant ?? "outline"}
                style={t.style}
                bg={t.button?.bg}
              />
            </div>
          );
        }
        return (
          <p
            key={t.id}
            data-part={`imagetext:${index}:${ti}`}
            className={`${t.kind === "subheading" ? "mt-0" : "mt-3"} leading-relaxed ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]} ${t.kind === "eyebrow" ? "uppercase tracking-[0.24em]" : ""} ${cls}`}
            style={textInlineStyle(ts)}
            {...richText(t.text)}
          />
        );
      })}
    </>
  );
}

function FreeView({ section }: { section: FreeSection }) {
  const hasImages = section.images.length > 0;

  if (section.layout === "behind" && hasImages) {
    return (
      <section className="py-12">
        <div className={`flex flex-nowrap gap-6 ${alignRow[section.imageAlign ?? "left"]}`}>
          {section.images.map((img, i) => (
            <div
              key={i}
              className={`group/pic relative basis-0 grow min-w-0 overflow-hidden rounded-lg ${overlayHeight[section.height]}`}
            >
              <div data-part={`image:${i}`} className="absolute inset-0">
                <Pic image={img} className="absolute inset-0 h-full w-full" />
              </div>
              <div className="absolute inset-0 bg-ink/35" />
              <div className={`relative flex h-full flex-col ${OVERLAY_VALIGN_CLASS[section.overlayVAlign ?? "middle"]} px-8 sm:px-14 py-16 ${overlayHeight[section.height]}`}>
                {i === 0 ? <FreeText section={section} onDark /> : null}
                <OverlayImageTexts section={section} image={img} index={i} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8"><FreeVideos section={section} /></div>
      </section>
    );
  }


  if (section.layout === "beside" && hasImages) {
    return (
      <section className="py-12 space-y-8">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-2 items-center">
          <div className={section.imageSide === "right" ? "md:order-2" : ""}>
            <FreeGallery section={{ ...section, columns: section.images.length > 1 ? 2 : 1 }} />
          </div>
          <div className="max-w-xl w-full">
            <FreeText section={section} />
          </div>
        </div>
        <FreeVideos section={section} />
      </section>
    );
  }

  const media: { part: string; node: React.ReactNode }[] = [];
  if (hasImages) {
    for (const g of imageGroups(section.images)) {
      const part = imageGroupPart(g.key);
      media.push({
        part,
        node: <div data-part={part} className="w-full"><FreeGallery section={groupSection(section, g.key)} items={g.items} /></div>,
      });
    }
  }
  if ((section.videos ?? []).length) media.push({ part: "videos", node: <div data-part="videos" className="w-full"><FreeVideos section={section} /></div> });

  return (
    <section className="py-12 space-y-8">
      <FreeText section={section} media={media} />
    </section>
  );
}

export function SectionView({ section }: { section: Section }) {
  const heading = (text?: string, style?: TextStyle) =>
    text ? (
      <h2 className={`mb-8 ${headingClasses(style, { color: "ink", size: "md" })}`}>{text}</h2>
    ) : null;

  switch (section.type) {
    case "free":
      return <FreeView section={section} />;

    case "carousel":
      return (
        <section className="py-12">
          {heading(section.heading, section.textStyle)}
          <Carousel section={section} />
        </section>
      );

    case "imageRow":
      return (
        <section className="py-12">
          {heading(section.heading, section.textStyle)}
          <div className={`grid gap-4 ${colClass[section.columns]}`}>
            {section.images.map((img, i) => (
              <Pic key={i} image={img} className="w-full aspect-[4/5] rounded-lg" />
            ))}
          </div>
        </section>
      );

    case "captionedImages":
      return (
        <section className="py-12">
          {heading(section.heading, section.textStyle)}
          <div className={`grid gap-8 ${colClass[section.columns]}`}>
            {section.images.map((img, i) => (
              <figure key={i}>
                <Pic image={img} className="w-full aspect-[4/3] rounded-lg" />
                {img.caption ? (
                  <figcaption className={`mt-3 leading-relaxed ${bodyClasses(section.captionStyle, { color: "stone", size: "sm" })}`}>{img.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      );

    case "overlay":
      return (
        <section className="py-12">
          <div className={`relative overflow-hidden rounded-lg ${overlayHeight[section.height]}`}>
            <Pic image={section.image} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-ink/35" />
            <div
              className={`relative flex h-full flex-col justify-center gap-4 px-8 sm:px-14 py-16 ${alignText[section.align]} ${overlayHeight[section.height]}`}
            >
              {section.eyebrow ? (
                <p className={`uppercase tracking-[0.24em] ${bodyClasses(withEyebrowDefaults(section.eyebrowStyle), { color: "cream", size: "sm" })}`} style={textInlineStyle(withEyebrowDefaults(section.eyebrowStyle))}>{section.eyebrow}</p>
              ) : null}
              <h2 className={`max-w-2xl ${headingClasses(section.textStyle, { color: "cream", size: "xl" })}`}>
                {section.heading}
              </h2>
              {section.body ? (
                <p className={`max-w-xl leading-relaxed whitespace-pre-wrap ${bodyClasses(section.bodyStyle, { color: "cream", size: "md" })}`}>{section.body}</p>
              ) : null}
              {section.buttonLabel ? (
                <a
                  href={section.buttonHref || "#"}
                  className={`mt-2 inline-flex items-center border border-cream px-7 py-3 uppercase tracking-[0.18em] transition-colors hover:bg-cream hover:text-ink ${bodyClasses(section.labelStyle, { color: "cream", size: "sm" })}`}
                >
                  {section.buttonLabel}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      );

    case "split":
      return (
        <section className="py-12">
          <div className="grid gap-8 sm:gap-12 md:grid-cols-2 items-center">
            <div className={section.imageSide === "right" ? "md:order-2" : ""}>
              <Pic image={section.image} className="w-full aspect-[4/3] rounded-lg" />
            </div>
            <div className="max-w-xl">
              {section.eyebrow ? (
                <p className={`uppercase tracking-[0.24em] mb-3 ${bodyClasses(withEyebrowDefaults(section.eyebrowStyle), { color: "stone", size: "sm" })}`} style={textInlineStyle(withEyebrowDefaults(section.eyebrowStyle))}>{section.eyebrow}</p>
              ) : null}
              <h2 className={`mb-4 ${headingClasses(section.textStyle, { color: "ink", size: "xl" })}`}>{section.heading}</h2>
              {section.body ? (
                <p className={`leading-relaxed whitespace-pre-wrap ${bodyClasses(section.bodyStyle, { color: "stone", size: "md" })}`}>{section.body}</p>
              ) : null}
              {section.buttonLabel ? (
                <div className="mt-6">
                  <SectionButton label={section.buttonLabel} href={section.buttonHref || "#"} variant="outline" style={section.labelStyle} />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      );

    case "button":
    default: {
      const s = section as ButtonSection;
      return (
        <section className={`py-10 flex ${alignRow[s.align]}`}>
          <SectionButton label={s.label} href={s.href} variant={s.variant} style={s.labelStyle} />
        </section>
      );
    }
  }
}

/** Lays sections out in rows: inline neighbours share a row, separate ones stand alone. */
export function SectionFlowList({ sections }: { sections: Section[] }) {
  return (
    <>
      {groupByFlow(sections, (s) => s.flow).map((group) =>
        group.length > 1 ? (
          <div key={group[0].id} className="-mx-4 flex flex-wrap items-start">
            {group.map((s) => (
              <div
                key={s.id}
                className={`px-4 ${s.flowWidth ? "" : "min-w-[16rem] flex-1 basis-0"}`}
                style={flowWidthStyle(s.flowWidth)}
              >
                <SectionView section={s} />
              </div>
            ))}
          </div>
        ) : (
          <SectionView key={group[0].id} section={group[0]} />
        )
      )}
    </>
  );
}

export default function ObjectSections({ sections }: { sections: Section[] }) {
  if (!sections.length) return null;
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
      <SectionFlowList sections={sections} />
    </div>
  );
}

/** Normalise contentEditable HTML down to plain text + b/i/u/br markup. */
export function cleanEditedHtml(html: string): string {
  const root = document.createElement("div");
  root.innerHTML = html;
  const esc = (s: string) =>
    s.replace(/\u00a0/g, " ").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const walk = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return esc(n.textContent ?? "");
    if (n.nodeType !== Node.ELEMENT_NODE) return "";
    const el = n as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(walk).join("");
    if (tag === "br") return "<br>";
    if (tag === "div" || tag === "p") return inner ? `${inner}<br>` : "";
    const style = el.getAttribute("style") ?? "";
    let out = inner;
    if (tag === "u" || /underline/.test(style)) out = `<u>${out}</u>`;
    if (tag === "i" || tag === "em" || /font-style:\s*italic/.test(style)) out = `<i>${out}</i>`;
    if (tag === "b" || tag === "strong" || /font-weight:\s*(bold|[6-9]00)/.test(style)) out = `<b>${out}</b>`;
    return out;
  };
  return Array.from(root.childNodes).map(walk).join("").replace(/(<br>)+$/, "").trim();
}
