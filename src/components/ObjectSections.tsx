import { useIsThumbnail } from "@/lib/thumbnail";
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
  /** cut the text off after this many lines */
  lines?: number;
  /** draw a circle around an icon item */
  iconRing?: boolean;
  /** show in capital letters */
  uppercase?: boolean;
  /** letter spacing, in em */
  trackingEm?: number;
  /** line height, as a multiple of the font size */
  lineHeight?: number;
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
  if (style?.uppercase) css.textTransform = "uppercase";
  if (style?.trackingEm) css.letterSpacing = `${style.trackingEm}em`;
  if (style?.lineHeight) css.lineHeight = style.lineHeight;
  if (style?.lines && style.lines > 0) {
    css.display = "-webkit-box";
    (css as Record<string, unknown>).WebkitLineClamp = style.lines;
    (css as Record<string, unknown>).WebkitBoxOrient = "vertical";
    css.overflow = "hidden";
  }
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

/** Same as richText, but shows faded wording in the editor when nothing is typed yet. */
export function richTextOrPlaceholder(text: string, editing: boolean) {
  if (!text?.trim() && editing) {
    return { children: "Add text", "data-empty-text": "" } as const;
  }
  return richText(text);
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
  auto: "h-auto",
  sm: "h-40 sm:h-48",
  md: "h-56 sm:h-64",
  lg: "h-72 sm:h-96",
  xl: "h-96 sm:h-[32rem]",
};

/** Height class for an image, skipped when an exact pixel height is set. */
export function imageBoxClass(section: FreeSection): string {
  return section.imageHeightPx ? "" : imageHeightClass[section.imageHeight ?? "auto"];
}

/** Exact pixel height for an image, when one is set. */
export function imageBoxStyle(section: FreeSection): React.CSSProperties | undefined {
  return section.imageHeightPx ? { height: `${section.imageHeightPx}px` } : undefined;
}

/** Caps the width of an image (and its attached text) when an exact width is set. */
export function imageWidthStyle(section: FreeSection): React.CSSProperties | undefined {
  return section.imageWidthPx ? { width: "100%", maxWidth: `${section.imageWidthPx}px` } : undefined;
}

/** Extra text boxes (and rules) that sit under an image and scroll with it. */
export type ImageTextKind = "eyebrow" | "title" | "subheading" | "text" | "divider" | "button" | "icon";

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
  button?: { href?: string; variant?: ButtonSection["variant"]; bg?: TextColor; icon?: string; iconSide?: "before" | "after" };
  /** wording shown with the icon when kind is "icon" */
  iconLabel?: string;
  /** where the icon's wording sits */
  iconLabelSide?: "before" | "after" | "above" | "below";
  /** how the icon's wording lines up when it sits above or below */
  iconLabelAlign?: SectionAlign;
  /** optional symbol shown with this text */
  icon?: string;
  /** where that symbol sits relative to the text */
  iconSide?: "before" | "after" | "above" | "below";
  /** extra space above/below this item (px, may be negative) */
  padY?: number;
  /** extra space left/right of this item (px, may be negative) */
  padX?: number;
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
  icon: { font: "sans", color: "ink", size: "md", heading: false },
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
  /** which part of the picture stays in view when it is cropped (CSS object-position) */
  focus?: string;
  /** how far the picture is zoomed inside its crop window, in percent (100 = no zoom) */
  zoom?: number;
}

/** Zoom kept within sane limits. */
export function imageZoom(zoom: number | undefined): number {
  if (!Number.isFinite(zoom ?? NaN)) return 100;
  return Math.min(400, Math.max(100, Math.round(zoom as number)));
}

/** Where a picture is anchored when it gets cropped. */
export const IMAGE_FOCUS_OPTIONS: { value: string; label: string }[] = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "left top", label: "Top left" },
  { value: "right top", label: "Top right" },
  { value: "left bottom", label: "Bottom left" },
  { value: "right bottom", label: "Bottom right" },
];

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
  imageHeightPx?: number;
  imageWidthPx?: number;
  imageAlign?: SectionAlign;
  imageBorder?: boolean;
  imageBorderColor?: TextColor;
  imageBorderWidth?: number;
  imageBorderRadius?: number;
  imageBorderPad?: number;
  imageBorderStyle?: "solid" | "dashed" | "dotted";
  imageScrim?: ImageScrim;
  imageScrimStrength?: number;
  imageShadow?: ImageShadow;
  carouselControls?: boolean;
}

/** A dark wash over a picture so text on top of it stays readable. */
export type ImageScrim = "none" | "bottom" | "top" | "full";

export const IMAGE_SCRIMS: { value: ImageScrim; label: string }[] = [
  { value: "none", label: "None" },
  { value: "bottom", label: "From bottom" },
  { value: "top", label: "From top" },
  { value: "full", label: "Even" },
];

export type ImageShadow = "none" | "sm" | "md" | "lg";

export const IMAGE_SHADOWS: { value: ImageShadow; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Soft" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Deep" },
];

export const IMAGE_SHADOW_CLASS: Record<ImageShadow, string> = {
  none: "", sm: "shadow-md", md: "shadow-xl", lg: "shadow-2xl",
};

/** CSS color value for a brand token or a custom color. */
export function textColorCss(c: TextColor): string {
  const token = TEXT_COLORS.find((t) => t.value === c);
  if (token) return token.swatch;
  return isCustomColor(c) ? (c as string) : "hsl(var(--nova-sand))";
}

/** Readable text color to sit on top of a custom fill. */
export function contrastOn(color: string): string {
  const hex = color.trim().replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((h) => h + h).join("") : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return "hsl(var(--nova-cream))";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "hsl(var(--nova-ink))" : "hsl(var(--nova-cream))";
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
/** Inline padding for a block; falls back to the default 48px vertical rhythm. */
export function sectionPadStyle(section: {
  padY?: number;
  padX?: number;
  bg?: TextColor;
  bgImage?: string;
}): React.CSSProperties {
  const y = section.padY ?? 48;
  const x = section.padX ?? 0;
  return {
    ...spaceStyle(y, "Top"),
    ...spaceStyle(y, "Bottom"),
    ...spaceStyle(x, "Left"),
    ...spaceStyle(x, "Right"),
    ...(section.bg || section.bgImage ? { position: "relative", isolation: "isolate" } : {}),
  };
}

/**
 * Full-bleed background layer for a block: paints the block's colour or image
 * edge-to-edge across the page while the content stays inside the container.
 */

export function SectionBg({ section }: { section: { bg?: TextColor; bgImage?: string } }) {
  const contained = useContext(ContainedBgContext);
  if (!section.bg && !section.bgImage) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: contained ? 0 : "calc(50% - 50vw)",
        width: contained ? "100%" : "100vw",
        zIndex: -1,
        ...(section.bg ? { backgroundColor: bgColorCss(section.bg) } : {}),
        ...(section.bgImage
          ? {
              backgroundImage: `url(${section.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}),
      }}
    />
  );
}

/** Background choices for a block: default, a restrained emphasis tint, or any custom color. */
export const EMPHASIS_BG = "#f7f5f3";

export const BG_COLORS: { value: TextColor; label: string; swatch: string }[] = [
  { value: "", label: "Default", swatch: "transparent" },
  { value: EMPHASIS_BG as TextColor, label: "Emphasis", swatch: EMPHASIS_BG },
];

/** CSS color for a block background: brand surface token, or any custom color. */
export function bgColorCss(c: TextColor): string {
  const token = BG_COLORS.find((t) => t.value === c && t.value !== "");
  return token ? token.swatch : (c as string);
}

/** Positive values become padding; negative values become negative margin (CSS has no negative padding). */
function spaceStyle(value: number, side: "Top" | "Bottom" | "Left" | "Right"): React.CSSProperties {
  return value < 0
    ? ({ [`margin${side}`]: `${value}px`, [`padding${side}`]: "0px" } as React.CSSProperties)
    : ({ [`padding${side}`]: `${value}px` } as React.CSSProperties);
}

/** Inline padding for one item inside a block. */
export function partPadStyle(
  section: { padsY?: Record<string, number>; padsX?: Record<string, number> },
  part: string,
): React.CSSProperties {
  const y = section.padsY?.[part];
  const x = section.padsX?.[part];
  let style: React.CSSProperties = {};
  if (y !== undefined) {
    style = { ...style, ...spaceStyle(y, "Top"), ...spaceStyle(y, "Bottom") };
  }
  if (x !== undefined) {
    style = { ...style, ...spaceStyle(x, "Left"), ...spaceStyle(x, "Right") };
  }
  return style;
}

/** Width/height a text box was dragged to, if any. */
export function partSizeStyle(
  section: { sizesW?: Record<string, number>; sizesH?: Record<string, number> },
  part: string,
): React.CSSProperties {
  const w = section.sizesW?.[part];
  const h = section.sizesH?.[part];
  const style: React.CSSProperties = {};
  if (w) { style.width = `${w}px`; style.maxWidth = "100%"; }
  if (h) { style.height = `${h}px`; }
  return style;
}

/**
 * When a text box has been dragged to a set width, its wording must fill that
 * width and re-wrap inside it rather than shrink to its natural line length.
 */
export function sizedPartClass(
  section: { sizesW?: Record<string, number>; sizesH?: Record<string, number>; rotations?: Record<string, number> },
  part: string,
): string {
  if (section.rotations?.[part]) return ""; // turned items are sized inside the turn wrapper
  const sized = section.sizesW?.[part];
  return sized ? "[&>*]:w-full [&>*]:max-w-none" : "";
}

/** Where wording sits inside the height of its own box. */
export type PartVAlign = "top" | "middle" | "bottom";

const PART_VALIGN_CLASS: Record<PartVAlign, string> = {
  top: "justify-start",
  middle: "justify-center",
  bottom: "justify-end",
};

/** Vertical placement class for one item inside its own box. */
export function partVAlignClass(
  section: { flowVAligns?: Record<string, PartVAlign> },
  part: string,
): string {
  return PART_VALIGN_CLASS[section.flowVAligns?.[part] ?? "top"];
}

/** Degrees a part is turned by, kept within a half turn. */
export function partRotation(
  section: { rotations?: Record<string, number> },
  part: string,
): number {
  const deg = section.rotations?.[part];
  if (!deg) return 0;
  return Math.min(180, Math.max(-180, deg));
}

/**
 * Turns its content and reserves the space the turned content actually takes,
 * so a sideways item still sits inside its block instead of spilling over it.
 */
export function RotatedPart({
  deg,
  size,
  vAlignClass,
  children,
}: {
  deg: number;
  /** Width/height the item was dragged to, measured along its own turned axis. */
  size?: React.CSSProperties;
  /** Where the wording sits down the box's own axis. */
  vAlignClass?: string;
  children: React.ReactNode;
}) {
  const inner = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = inner.current;
    if (!el || !deg) return;
    const measure = () => {
      const rad = (Math.abs(deg) * Math.PI) / 180;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w && !h) return;
      setBox({
        w: Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)),
        h: Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [deg]);

  if (!deg) return <>{children}</>;
  const sized = !!(size && (size.width || size.height));
  // A turned box measures its width along its own axis, so the wrapper's width
  // (the turned outline) must not clamp it.
  const { maxWidth: _ignoredMaxWidth, ...turnedSize } = size ?? {};
  return (
    <div
      className="relative flex items-center justify-center"
      style={box ? { width: box.w, height: box.h } : undefined}
    >
      <div
        ref={inner}
        data-rot-inner=""
        className={`${box ? "absolute" : ""} flex flex-col ${vAlignClass ?? ""} ${sized ? "[&>*]:w-full [&>*]:max-w-none" : ""}`}
        style={{ ...turnedSize, maxWidth: "none", transform: `rotate(${deg}deg)`, transformOrigin: "center" }}
      >
        {children}
      </div>
    </div>
  );
}

/** Inline spacing for one text/divider/button attached to an image. */
export function imageTextPadStyle(t: { padY?: number; padX?: number }): React.CSSProperties {
  let style: React.CSSProperties = {};
  if (t.padY !== undefined) style = { ...style, ...spaceStyle(t.padY, "Top"), ...spaceStyle(t.padY, "Bottom") };
  if (t.padX !== undefined) style = { ...style, ...spaceStyle(t.padX, "Left"), ...spaceStyle(t.padX, "Right") };
  return style;
}

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
export type FreeTextKind = "eyebrow" | "title" | "text" | "icon";

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
  /** wording shown with the icon when kind is "icon" */
  iconLabel?: string;
  /** where the icon's wording sits */
  iconLabelSide?: "before" | "after" | "above" | "below";
  /** how the icon's wording lines up when it sits above or below */
  iconLabelAlign?: SectionAlign;
  /** optional symbol shown with this text */
  icon?: string;
  /** where that symbol sits relative to the text */
  iconSide?: "before" | "after" | "above" | "below";
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
  /** per-element vertical position inside its own box height, keyed by the same parts */
  flowVAligns?: Record<string, PartVAlign>;
  /** items sharing a stack id are stacked vertically inside one column of a side-by-side row */
  stacks?: Record<string, string>;
  /** per-element vertical padding in pixels, keyed by the same parts */
  padsY?: Record<string, number>;
  /** per-element horizontal padding in pixels, keyed by the same parts */
  padsX?: Record<string, number>;
  /** per-element rotation in degrees, keyed by the same parts */
  rotations?: Record<string, number>;
  /** per-element width in pixels, keyed by the same parts */
  sizesW?: Record<string, number>;
  /** per-element height in pixels, keyed by the same parts */
  sizesH?: Record<string, number>;
  /** vertical alignment of items sharing a row */
  rowVAlign?: RowVAlign;
  /** groups of items drawn together inside a box */
  boxes?: FreeBox[];
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
  /** exact image height in px (overrides imageHeight) */
  imageHeightPx?: number;
  /** exact image width in px */
  imageWidthPx?: number;
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
  /** dark wash over the picture so text on top stays readable */
  imageScrim?: ImageScrim;
  /** how strong that wash is (0-100) */
  imageScrimStrength?: number;
  /** drop shadow under each picture */
  imageShadow?: ImageShadow;
  /** show dots, a counter and a pause button under a carousel */
  carouselControls?: boolean;
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
  /** optional symbol shown beside the button label */
  buttonIcon?: string;
  /** which side the symbol sits on */
  buttonIconSide?: "before" | "after";
  /** vertical padding around the block, in pixels */
  padY?: number;
  /** horizontal padding around the block, in pixels */
  padX?: number;
  /** background color behind the whole block (subtle emphasis) */
  bg?: TextColor;
  /** background image behind the whole block */
  bgImage?: string;
}

/** Part of a coded object the editor can't rebuild, kept exactly as it was. */
export interface LockedSection {
  id: string;
  type: "locked";
  flow?: SectionFlow;
  flowWidth?: number;
  title: string;
  note: string;
  /** snapshot of the original markup */
  html: string;
}

export type Section =
  | LockedSection
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
  locked: "Not editable",
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

import { Fragment, createContext, useContext, useEffect, useRef, useState } from "react";
/** When true (the editor), block backgrounds stay inside the block instead of bleeding edge to edge. */
export const ContainedBgContext = createContext(false);
import {
  ChevronLeft, ChevronRight, Pause, Play,
  Calendar, Ruler, Compass, Lightbulb, MapPin, Phone, Mail, Clock, Star, Heart,
  Sparkles, Truck, ShieldCheck, Award, Home, Sofa, PenTool, Palette, Camera,
  Quote, Check, Leaf,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, MoveRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Icons an author can drop into a block. */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar, ruler: Ruler, compass: Compass, lightbulb: Lightbulb,
  mapPin: MapPin, phone: Phone, mail: Mail, clock: Clock, star: Star, heart: Heart,
  sparkles: Sparkles, truck: Truck, shield: ShieldCheck, award: Award, home: Home,
  sofa: Sofa, pen: PenTool, palette: Palette, camera: Camera, quote: Quote,
  check: Check, leaf: Leaf,
  arrowRight: ArrowRight, arrowLeft: ArrowLeft, arrowUp: ArrowUp, arrowDown: ArrowDown,
  arrowUpRight: ArrowUpRight, chevronRight: ChevronRight, chevronLeft: ChevronLeft, longArrow: MoveRight,
};

export const SECTION_ICON_NAMES = Object.keys(SECTION_ICONS);

/** An icon item: the stored text is the icon name. */
/** True while sections are shown inside the object editor canvas. */
export const SectionEditing = createContext(false);

export function SectionIcon({
  name, style, fallbackColor, label, labelSide = "after", labelAlign,
}: {
  name: string;
  style?: TextStyle;
  fallbackColor?: TextColor;
  label?: string;
  labelSide?: "before" | "after" | "above" | "below";
  labelAlign?: SectionAlign;
}) {
  const Icon = SECTION_ICONS[name?.trim()] ?? SECTION_ICONS.sparkles;
  const size = style?.sizePx ?? 28;
  const color = textColorCss(style?.color ?? fallbackColor ?? "ink");
  let glyph = <Icon style={{ width: size, height: size, color }} strokeWidth={1.4} />;
  if (style?.iconRing) {
    const box = size * 2.2;
    glyph = (
      <span
        className="inline-flex items-center justify-center rounded-full border"
        style={{ width: box, height: box, borderColor: color }}
      >
        {glyph}
      </span>
    );
  }
  const text = label?.trim();
  const editing = useContext(SectionEditing);
  if (!text && !editing) return glyph;
  const stack = labelSide === "above" || labelSide === "below";
  const first = labelSide === "before" || labelSide === "above";
  const fontSize = Math.max(12, Math.round(size * 0.55));
  const align = stack ? labelAlign ?? "center" : undefined;
  const textAlign = align === "left" ? "left" : align === "right" ? "right" : align === "center" ? "center" : undefined;
  const wording = text ? (
    <span
      data-icon-label=""
      className="whitespace-pre-wrap leading-snug"
      style={{ color, fontSize, textAlign, width: stack ? "100%" : undefined, display: stack ? "block" : undefined }}
      {...richText(text)}
    />
  ) : (
    <span
      data-icon-label=""
      data-icon-label-empty=""
      className="whitespace-pre-wrap leading-snug opacity-40"
      style={{ color, fontSize, textAlign, width: stack ? "100%" : undefined, display: stack ? "block" : undefined }}
    >
      Add text
    </span>
  );
  const stackItems = align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center";
  return (
    <span className={`inline-flex ${stack ? `flex-col ${stackItems}` : "flex-row items-center"} gap-2 align-middle`}>
      {first ? wording : glyph}
      {first ? glyph : wording}
    </span>
  );
}

/** Wraps a piece of text with its optional symbol. */
export function TextWithIcon({
  item, fallbackColor, align, children, part,
}: {
  item: { icon?: string; iconSide?: "before" | "after" | "above" | "below"; style?: TextStyle };
  fallbackColor?: TextColor;
  align?: SectionAlign;
  children: React.ReactNode;
  /** lets a click on the symbol select the same item as its wording */
  part?: string;
}) {
  const name = item.icon?.trim();
  if (!name) return <>{children}</>;
  const Icon = SECTION_ICONS[name] ?? SECTION_ICONS.sparkles;
  const size = Math.max(14, Math.round((item.style?.sizePx ?? 20) * 1.2));
  const color = textColorCss(item.style?.color ?? fallbackColor ?? "ink");
  const glyph = <Icon style={{ width: size, height: size, color, flex: "none" }} strokeWidth={1.4} />;
  const side = item.iconSide ?? "before";
  const stack = side === "above" || side === "below";
  const first = side === "before" || side === "above";
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  return (
    <span data-part={part} className={`flex gap-2 ${stack ? `flex-col ${align === "center" ? "items-center" : align === "right" ? "items-end" : "items-start"}` : `flex-row items-center ${justify}`}`}>
      {first ? glyph : null}
      {children}
      {first ? null : glyph}
    </span>
  );
}



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

/**
 * Alignment for one item, measured along the direction it is turned to face.
 * A sideways item aligned "left" lines up with the start of its own reading
 * direction (top or bottom of the block), not the left of the screen.
 */
export function partAlignClass(align: SectionAlign, deg: number): string {
  const text = alignTextOnly[align];
  const d = ((deg % 360) + 360) % 360;
  const quarter = Math.round(d / 90) % 4; // 0 = upright, 1 = quarter turn clockwise
  if (quarter === 0) return alignText[align];
  if (quarter === 2) {
    const flipped: Record<SectionAlign, string> = { left: "items-end", center: "items-center", right: "items-start" };
    return `${text} ${flipped[align]}`;
  }
  // Sideways: the reading direction runs down the block for a clockwise turn.
  const down = quarter === 1;
  const place: Record<SectionAlign, string> = {
    left: down ? "justify-end" : "justify-start",
    center: "justify-center",
    right: down ? "justify-start" : "justify-end",
  };
  return `${text} items-center ${place[align]}`;
}

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

/** The dark wash drawn over a picture, when one is set. */
function scrimStyle(scrim: ImageScrim | undefined, strength = 55): React.CSSProperties | null {
  if (!scrim || scrim === "none") return null;
  const a = Math.min(100, Math.max(0, strength)) / 100;
  if (scrim === "full") return { backgroundColor: `rgba(33,33,33,${a})` };
  const dir = scrim === "bottom" ? "to top" : "to bottom";
  return {
    backgroundImage: `linear-gradient(${dir}, rgba(33,33,33,${a}) 0%, rgba(33,33,33,${a * 0.35}) 45%, rgba(33,33,33,0) 100%)`,
  };
}

function Pic({
  image, className, scrim, scrimStrength, shadow,
}: {
  image: SectionImage; className: string;
  scrim?: ImageScrim; scrimStrength?: number; shadow?: ImageShadow;
}) {
  if (!image?.url) return <Placeholder className={className} />;
  const href = image.href?.trim();
  const wash = scrimStyle(scrim, scrimStrength);
  const auto = /(^|\s)h-auto(\s|$)/.test(className);
  const zoom = imageZoom(image.zoom);
  const picture = (
    <img
      src={image.url}
      alt={image.alt || ""}
      loading="lazy"
      style={image.focus ? { objectPosition: image.focus } : undefined}
      className={`block w-full ${auto ? "h-auto" : "h-full"} object-cover transition-transform duration-700 ease-out will-change-transform group-hover/pic:scale-[1.04]`}
    />
  );
  const inner = (
    <>
      {zoom > 100 ? (
        <span
          className={`block w-full ${auto ? "h-auto" : "h-full"}`}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: image.focus || "center" }}
        >
          {picture}
        </span>
      ) : picture}
      {wash ? <span aria-hidden className="pointer-events-none absolute inset-0" style={wash} /> : null}
    </>
  );
  const box = `${className} group/pic relative overflow-hidden ${shadow && shadow !== "none" ? IMAGE_SHADOW_CLASS[shadow] : ""}`;
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

const bgClass: Record<TextColorToken, string> = {
  ink: "bg-ink hover:bg-ink/90",
  stone: "bg-stone hover:bg-stone/90",
  brass: "bg-brass hover:bg-brass/90",
  garnet: "bg-garnet hover:bg-garnet/90",
  cream: "bg-cream hover:bg-cream/90",
};
const bgTextColor: Record<TextColorToken, TextColor> = {
  ink: "cream", stone: "cream", brass: "ink", garnet: "cream", cream: "ink",
};

function SectionButton({
  label, href, variant = "solid", style, bg, icon, iconSide = "before",
}: { label: string; href: string; variant?: ButtonSection["variant"]; style?: TextStyle; bg?: TextColor; icon?: string; iconSide?: "before" | "after" }) {
  const base = "inline-flex items-center justify-center gap-2 uppercase tracking-[0.18em] transition-colors";
  const fill = bg ?? "ink";
  const custom = isCustomColor(fill);
  const styles =
    variant === "outline"
      ? "border border-ink px-7 py-3 hover:bg-ink hover:text-cream"
      : variant === "link"
        ? `${style?.underline === false ? "" : "underline underline-offset-4"} hover:text-brass`
        : `${custom ? "" : bgClass[fill as TextColorToken]} px-7 py-3`;
  const fallbackText: TextColor = variant === "solid" && !custom ? bgTextColor[fill as TextColorToken] : "ink";
  const text = bodyClasses(style, { color: fallbackText, size: "sm" });
  const inline: React.CSSProperties = { ...textInlineStyle(style) };
  if (variant === "solid" && custom) {
    inline.backgroundColor = fill as string;
    if (!style?.color) inline.color = contrastOn(fill as string);
  }
  if (!icon) {
    return (
      <a href={href || "#"} className={`${base} ${styles} ${text}`} style={inline} {...richText(label)} />
    );
  }
  const Icon = SECTION_ICONS[icon.trim()] ?? SECTION_ICONS.sparkles;
  const glyphSize = Math.max(12, Math.round((style?.sizePx ?? 14) * 1.1));
  const glyph = <Icon style={{ width: glyphSize, height: glyphSize }} strokeWidth={1.6} className="shrink-0" />;
  return (
    <a href={href || "#"} className={`${base} ${styles} ${text}`} style={inline}>
      {iconSide === "before" ? glyph : null}
      <span {...richText(label)} />
      {iconSide === "after" ? glyph : null}
    </a>
  );
}

function Carousel({ section }: { section: CarouselSection }) {
  const images = section.images.length ? section.images : [emptyImage()];
  const [i, setI] = useState(0);
  const n = images.length;

  const isThumb = useIsThumbnail();
  useEffect(() => {
    if (n < 2 || isThumb) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, isThumb]);

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
              style={textInlineStyle(section.captionStyle)}
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
  const imgTextEditing = useContext(SectionEditing);
  const blockAlign: SectionAlign = section.captionAlign ?? "left";
  const align = alignTextOnly[image.captionAlign ?? blockAlign];
  const baseColor: TextColor = onDark ? "cream" : "stone";
  const texts = image.texts ?? [];
  const bordered = !!section.imageBorder;

  return (
    <div
      className={bordered ? "overflow-hidden" : ""}
      style={{ ...(bordered ? imageBorderStyleOf(section) : {}), ...(imageWidthStyle(section) ?? {}) }}
    >
      <div data-part={`image:${index}`} style={imageBoxStyle(section)}>
        <Pic
          image={image}
          className={`w-full rounded-lg ${imageBoxClass(section)} ${section.imageHeightPx ? "h-full" : ""}`}
          scrim={section.imageScrim}
          scrimStrength={section.imageScrimStrength}
          shadow={section.imageShadow}
        />
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
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className="mt-3 flex w-full flex-col" style={imageTextPadStyle(t)}>
              <DividerBar
                divider={{ id: t.id, ...(t.divider ?? {}) }}
                align={t.align ?? image.captionAlign ?? blockAlign}
                onDark={onDark}
              />
            </div>
          );
        }
        if (t.kind === "icon") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className={`mt-3 ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]}`} style={imageTextPadStyle(t)}>
              <SectionIcon name={t.text} style={t.style} label={t.iconLabel} labelSide={t.iconLabelSide} labelAlign={t.iconLabelAlign} fallbackColor={onDark ? "cream" : "ink"} />
            </div>
          );
        }
        if (t.kind === "button") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className={`mt-3 ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]}`} style={imageTextPadStyle(t)}>
              <SectionButton
                label={t.text || "Button"}
                href={t.button?.href || "#"}
                variant={t.button?.variant ?? (onDark ? "outline" : "solid")}
                style={t.style}
                bg={t.button?.bg}
                icon={t.button?.icon}
                iconSide={t.button?.iconSide}
              />
            </div>
          );
        }
        return (
          <TextWithIcon key={t.id} item={{ ...t, style: ts }} align={t.align ?? image.captionAlign ?? blockAlign} fallbackColor={onDark ? "cream" : d.color} part={`imagetext:${index}:${ti}`}>
            <p
              data-part={`imagetext:${index}:${ti}`}
              data-text-body=""
              className={`${t.kind === "subheading" ? "mt-0" : "mt-3"} leading-relaxed ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]} ${t.kind === "eyebrow" ? "uppercase tracking-[0.24em]" : ""} ${cls}`}
              style={{ ...textInlineStyle(ts), ...imageTextPadStyle(t) }}
              {...richTextOrPlaceholder(t.text, imgTextEditing)}
            />
          </TextWithIcon>
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

  const [playing, setPlaying] = useState(true);

  const isThumb = useIsThumbnail();
  useEffect(() => {
    if (steps < 2 || !playing || isThumb) return;
    const t = setInterval(() => { nextRef.current(); }, 5000);
    return () => clearInterval(t);
  }, [steps, playing, isThumb]);

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
      {steps > 1 && section.carouselControls !== false && (
        <div
          className="mt-4 flex items-center justify-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            {Array.from({ length: n }).map((_, d) => (
              <button
                key={d}
                type="button"
                aria-label={`Go to item ${d + 1}`}
                onClick={(e) => { e.stopPropagation(); setAnim(true); setI(d); }}
                className={`h-1.5 rounded-full transition-all ${d === ((i % n) + n) % n ? "w-6 bg-ink" : "w-1.5 bg-stone/60 hover:bg-stone"}`}
              />
            ))}
          </div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-stone">
            {(((i % n) + n) % n) + 1} of {n}
          </span>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={(e) => { e.stopPropagation(); setPlaying((v) => !v); }}
            className="rounded-full border border-sand p-1.5 text-ink hover:bg-sand/50"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>
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

const dividerBg: Record<TextColorToken, string> = {
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
/** A group of items in a block, drawn together inside a bordered/filled box. */
export interface FreeBox {
  id: string;
  /** the parts (eyebrow, heading, text:0, ...) that sit inside this box */
  parts: string[];
  /** fill behind the box */
  bg?: TextColor;
  /** outline colour; leave unset for no outline */
  border?: TextColor;
  /** outline thickness in px */
  borderWidth?: number;
  /** corner rounding in px */
  radius?: number;
  /** inner spacing in px */
  padY?: number;
  padX?: number;
}

export function boxStyle(box: FreeBox): React.CSSProperties {
  const style: React.CSSProperties = {
    paddingTop: box.padY ?? 24,
    paddingBottom: box.padY ?? 24,
    paddingLeft: box.padX ?? 24,
    paddingRight: box.padX ?? 24,
    borderRadius: box.radius ?? 8,
  };
  if (box.bg) style.backgroundColor = textColorCss(box.bg);
  if (box.border) {
    style.borderStyle = "solid";
    style.borderWidth = box.borderWidth ?? 1;
    style.borderColor = textColorCss(box.border);
  }
  return style;
}

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
  const custom = isCustomColor(color);
  const cls = custom ? "" : dividerBg[color as TextColorToken];
  const pct = divider.widthPct;
  const sized = typeof pct === "number"
    ? `${dividerSelf[align]}`
    : divider.width === "full" ? "w-full" : `w-24 ${dividerSelf[align]}`;
  return (
    <div
      className={`${cls} ${sized} my-2 rounded-full`}
      style={{
        height: `${divider.thickness ?? 1}px`,
        ...(custom ? { backgroundColor: color as string } : null),
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
  const editing = useContext(SectionEditing);
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
        <TextWithIcon item={t} align={section.align} fallbackColor={base} part={part}>
          <h2
            data-part={part}
            data-text-body=""
            className={`max-w-2xl ${boxSelf(part)} ${headingClasses(t.style, { color: base, size: "xl" })}`}
            style={textInlineStyle(t.style)}
            {...richTextOrPlaceholder(t.text, editing)}
          />
        </TextWithIcon>
      ) });
      return;
    }
    if (kind === "icon") {
      items.push({ part, node: (
        <div data-part={part}>
          <SectionIcon name={t.text} style={t.style} label={t.iconLabel} labelSide={t.iconLabelSide} labelAlign={t.iconLabelAlign} fallbackColor={onDark ? "cream" : "ink"} />
        </div>
      ) });
      return;
    }
    if (kind === "eyebrow") {
      const es = withEyebrowDefaults(t.style);
      items.push({ part, node: (
        <TextWithIcon item={{ ...t, style: es }} align={section.align} fallbackColor={onDark ? "cream" : "stone"} part={part}>
          <p
            data-part={part}
            data-text-body=""
            className={`uppercase tracking-[0.24em] ${bodyClasses(es, { color: onDark ? "cream" : "stone", size: "sm" })}`}
            style={textInlineStyle(es)}
            {...richTextOrPlaceholder(t.text, editing)}
          />
        </TextWithIcon>
      ) });
      return;
    }
    items.push({ part, node: (
      <TextWithIcon item={t} align={section.align} fallbackColor={onDark ? "cream" : "stone"} part={part}>
        <p
          data-part={part}
          data-text-body=""
          className={`max-w-xl ${boxSelf(part)} leading-relaxed whitespace-pre-wrap ${bodyClasses(t.style, { color: onDark ? "cream" : "stone", size: "md" })}`}
          style={textInlineStyle(t.style)}
          {...richTextOrPlaceholder(t.text, editing)}
        />
      </TextWithIcon>
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
        icon={section.buttonIcon}
        iconSide={section.buttonIconSide}
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

  const boxes = section.boxes ?? [];
  const boxOf = (part: string) => boxes.find((b) => b.parts?.includes(part));
  const chunks: { box?: FreeBox; groups: typeof groups }[] = [];
  groups.forEach((g) => {
    const b = boxOf(g[0].part);
    const last = chunks[chunks.length - 1];
    if (b && last && last.box?.id === b.id) last.groups.push(g);
    else chunks.push({ box: b, groups: [g] });
  });

  const renderGroup = (group: (typeof groups)[number]) => {
    // Items sharing a stack id occupy one column of the row, stacked vertically.
    const columns: { key: string; items: typeof group }[] = [];
    group.forEach((it) => {
      const sid = section.stacks?.[it.part];
      const last = columns[columns.length - 1];
      if (sid && last && section.stacks?.[last.items[0].part] === sid) last.items.push(it);
      else columns.push({ key: it.part, items: [it] });
    });
    return columns.length > 1 ? (
          // Side-by-side items share one row height: media stretches to it, text centres within it.
          <div key={group[0].part} className={`-mx-3 flex w-full flex-wrap items-stretch ${alignRow[section.align]}`}>
            {columns.map((col) => {
              const it = col.items[0];
              const w = section.flowWidths?.[it.part];
              const a = section.flowAligns?.[it.part] ?? section.align;
              const isMedia = col.items.length === 1 && (it.part.startsWith("image") || it.part.startsWith("media") || it.part.startsWith("video"));
              const valign = section.rowVAlign ?? "middle";
              const justify = valign === "top" ? "justify-start" : valign === "bottom" ? "justify-end" : "justify-center";
              return (
                <div
                  key={col.key}
                  className={`flex flex-col gap-4 px-3 ${isMedia ? "justify-stretch [&_img]:h-full [&>*]:h-full" : justify} ${alignText[a]} ${w ? "" : "min-w-[10rem] flex-1 basis-0"}`}
                  style={flowWidthStyle(w)}
                >
                  {col.items.map((ci) => (
                    <div
                      key={ci.part}
                      data-part-box={ci.part}
                      className={`flex w-full flex-col ${partVAlignClass(section, ci.part)} ${partAlignClass(section.flowAligns?.[ci.part] ?? a, partRotation(section, ci.part))} ${sizedPartClass(section, ci.part)}`}
                      style={{ ...partPadStyle(section, ci.part), ...(partRotation(section, ci.part) ? {} : partSizeStyle(section, ci.part)) }}
                    >
                      <RotatedPart deg={partRotation(section, ci.part)} size={partSizeStyle(section, ci.part)} vAlignClass={partVAlignClass(section, ci.part)}>{ci.node}</RotatedPart>
                    </div>
                  ))}
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
                  className={`flex flex-col gap-4 ${alignText[a]} ${w ? "" : "w-full"}`}
                  style={flowWidthStyle(w)}
                >
                  {columns[0].items.map((ci) => (
                    <div
                      key={ci.part}
                      data-part-box={ci.part}
                      className={`flex w-full flex-col ${partVAlignClass(section, ci.part)} ${partAlignClass(section.flowAligns?.[ci.part] ?? a, partRotation(section, ci.part))} ${sizedPartClass(section, ci.part)}`}
                      style={{ ...partPadStyle(section, ci.part), ...(partRotation(section, ci.part) ? {} : partSizeStyle(section, ci.part)) }}
                    >
                      <RotatedPart deg={partRotation(section, ci.part)} size={partSizeStyle(section, ci.part)} vAlignClass={partVAlignClass(section, ci.part)}>{ci.node}</RotatedPart>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        );
  };

  return (
    <div className={`flex flex-col gap-4 ${alignText[section.align]}`}>
      {chunks.map((chunk, ci) =>
        chunk.box ? (
          <div key={chunk.box.id} className={`flex w-full flex-col gap-4 ${alignText[section.align]}`} style={boxStyle(chunk.box)}>
            {chunk.groups.map(renderGroup)}
          </div>
        ) : (
          <Fragment key={`chunk-${ci}`}>{chunk.groups.map(renderGroup)}</Fragment>
        )
      )}
    </div>
  );
}

/** Text boxes attached to an image, rendered in front of it for the "behind" layout. */
function OverlayImageTexts({
  section, image, index,
}: { section: FreeSection; image: SectionImage; index: number }) {
  const ovlTextEditing = useContext(SectionEditing);
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
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className="mt-3 flex w-full flex-col" style={imageTextPadStyle(t)}>
              <DividerBar
                divider={{ id: t.id, ...(t.divider ?? {}) }}
                align={t.align ?? image.captionAlign ?? blockAlign}
                onDark
              />
            </div>
          );
        }
        if (t.kind === "icon") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className={`mt-3 ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]}`} style={imageTextPadStyle(t)}>
              <SectionIcon name={t.text} style={t.style} label={t.iconLabel} labelSide={t.iconLabelSide} labelAlign={t.iconLabelAlign} fallbackColor="cream" />
            </div>
          );
        }
        if (t.kind === "button") {
          return (
            <div key={t.id} data-part={`imagetext:${index}:${ti}`} className={`mt-3 ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]}`} style={imageTextPadStyle(t)}>
              <SectionButton
                label={t.text || "Button"}
                href={t.button?.href || "#"}
                variant={t.button?.variant ?? "outline"}
                style={t.style}
                bg={t.button?.bg}
                icon={t.button?.icon}
                iconSide={t.button?.iconSide}
              />
            </div>
          );
        }
        return (
          <TextWithIcon key={t.id} item={{ ...t, style: ts }} align={t.align ?? image.captionAlign ?? blockAlign} fallbackColor="cream" part={`imagetext:${index}:${ti}`}>
            <p
              data-part={`imagetext:${index}:${ti}`}
              data-text-body=""
              className={`${t.kind === "subheading" ? "mt-0" : "mt-3"} leading-relaxed ${alignTextOnly[t.align ?? image.captionAlign ?? blockAlign]} ${t.kind === "eyebrow" ? "uppercase tracking-[0.24em]" : ""} ${cls}`}
              style={{ ...textInlineStyle(ts), ...imageTextPadStyle(t) }}
              {...richTextOrPlaceholder(t.text, ovlTextEditing)}
            />
          </TextWithIcon>
        );
      })}
    </>
  );
}

function FreeView({ section }: { section: FreeSection }) {
  const hasImages = section.images.length > 0;

  if (section.layout === "behind" && hasImages) {
    return (
      <section style={sectionPadStyle(section)} className="py-12">
      <SectionBg section={section} />
        <div className={`flex flex-nowrap gap-6 ${alignRow[section.imageAlign ?? "left"]}`}>
          {section.images.map((img, i) => (
            <div
              key={i}
              className={`group/pic relative basis-0 grow min-w-0 overflow-hidden rounded-lg ${overlayHeight[section.height]}`}
            >
              <div data-part={`image:${i}`} className="absolute inset-0">
                <Pic
                  image={img}
                  className="absolute inset-0 h-full w-full"
                  scrim={section.imageScrim}
                  scrimStrength={section.imageScrimStrength}
                />
              </div>
              {(section.imageScrim ?? "none") === "none" ? <div className="absolute inset-0 bg-ink/35" /> : null}
              <div className={`relative flex h-full flex-col ${OVERLAY_VALIGN_CLASS[section.overlayVAlign ?? "middle"]} px-8 sm:px-14 py-16 ${overlayHeight[section.height]}`}>
                <OverlayImageTexts section={section} image={img} index={i} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8"><FreeText section={section} /></div>
        <div className="mt-8"><FreeVideos section={section} /></div>
      </section>
    );
  }


  if (section.layout === "beside" && hasImages) {
    return (
      <section style={sectionPadStyle(section)} className="py-12 space-y-8">
      <SectionBg section={section} />
        <div className="grid gap-8 sm:gap-12 md:grid-cols-2 items-center">
          <div className={`space-y-6 ${section.imageSide === "right" ? "md:order-2" : ""}`}>
            {imageGroups(section.images).map((g) => {
              const part = imageGroupPart(g.key);
              const gs = groupSection(section, g.key);
              return (
                <div key={g.key} data-part={part} className="w-full">
                  <FreeGallery
                    section={{ ...gs, columns: g.items.length > 1 ? 2 : 1 }}
                    items={g.items}
                  />
                </div>
              );
            })}
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
    <section style={sectionPadStyle(section)} className="py-12 space-y-8">
      <SectionBg section={section} />
      <FreeText section={section} media={media} />
    </section>
  );
}

export function SectionView({ section }: { section: Section }) {
  const heading = (text?: string, style?: TextStyle) =>
    text ? (
      <h2 style={textInlineStyle(style)} className={`mb-8 ${headingClasses(style, { color: "ink", size: "md" })}`}>{text}</h2>
    ) : null;

  switch (section.type) {
    case "free":
      return <FreeView section={section} />;

    case "locked":
      return (
        <div
          {...({ inert: "" } as object)}
          className="pointer-events-none select-none [&_*]:!opacity-100"
          dangerouslySetInnerHTML={{ __html: section.html }}
        />
      );

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
                  <figcaption style={textInlineStyle(section.captionStyle)} className={`mt-3 leading-relaxed ${bodyClasses(section.captionStyle, { color: "stone", size: "sm" })}`}>{img.caption}</figcaption>
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
              <h2 style={textInlineStyle(section.textStyle)} className={`max-w-2xl ${headingClasses(section.textStyle, { color: "cream", size: "xl" })}`}>
                {section.heading}
              </h2>
              {section.body ? (
                <p style={textInlineStyle(section.bodyStyle)} className={`max-w-xl leading-relaxed whitespace-pre-wrap ${bodyClasses(section.bodyStyle, { color: "cream", size: "md" })}`}>{section.body}</p>
              ) : null}
              {section.buttonLabel ? (
                <a
                  href={section.buttonHref || "#"}
                  style={textInlineStyle(section.labelStyle)}
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
              <h2 style={textInlineStyle(section.textStyle)} className={`mb-4 ${headingClasses(section.textStyle, { color: "ink", size: "xl" })}`}>{section.heading}</h2>
              {section.body ? (
                <p style={textInlineStyle(section.bodyStyle)} className={`leading-relaxed whitespace-pre-wrap ${bodyClasses(section.bodyStyle, { color: "stone", size: "md" })}`}>{section.body}</p>
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
