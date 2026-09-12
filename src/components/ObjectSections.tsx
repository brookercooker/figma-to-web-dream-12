/**
 * Shared section model + renderer for Objects built in the Object Design page.
 * Sections are stored as JSON on `object_registry.content`.
 */

export type SectionAlign = "left" | "center" | "right";

export type TextFont = "serif" | "sans";
export type TextColor = "ink" | "stone" | "brass" | "garnet" | "cream";
export type TextSize = "sm" | "md" | "lg" | "xl";

export interface TextStyle {
  font?: TextFont;
  color?: TextColor;
  size?: TextSize;
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
const colorClass: Record<TextColor, string> = {
  ink: "text-ink",
  stone: "text-stone",
  brass: "text-brass",
  garnet: "text-garnet",
  cream: "text-cream",
};
const headingSizeClass: Record<TextSize, string> = {
  sm: "text-xl sm:text-2xl",
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
  xl: "text-4xl sm:text-5xl",
};
const bodySizeClass: Record<TextSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function headingClasses(style: TextStyle | undefined, fallback: { color: TextColor; size: TextSize }) {
  return [
    fontClass[style?.font ?? "serif"],
    colorClass[style?.color ?? fallback.color],
    headingSizeClass[style?.size ?? fallback.size],
  ].join(" ");
}

export function bodyClasses(style: TextStyle | undefined, fallback: { color: TextColor; size: TextSize }) {
  return [
    fontClass[style?.font ?? "sans"],
    colorClass[style?.color ?? fallback.color],
    bodySizeClass[style?.size ?? fallback.size],
  ].join(" ");
}

export interface SectionImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface CarouselSection {
  id: string;
  type: "carousel";
  heading?: string;
  textStyle?: TextStyle;
  captionStyle?: TextStyle;
  images: SectionImage[];
}

export interface ImageRowSection {
  id: string;
  type: "imageRow";
  heading?: string;
  textStyle?: TextStyle;
  columns: 2 | 3 | 4;
  images: SectionImage[];
}

export interface CaptionedImagesSection {
  id: string;
  type: "captionedImages";
  heading?: string;
  textStyle?: TextStyle;
  captionStyle?: TextStyle;
  columns: 1 | 2 | 3;
  images: SectionImage[];
}

export interface OverlaySection {
  id: string;
  type: "overlay";
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
  label: string;
  href: string;
  align: SectionAlign;
  variant: "solid" | "outline" | "link";
  labelStyle?: TextStyle;
}

/** Freeform block: a blank space you add text and images to. */
export interface FreeSection {
  id: string;
  type: "free";
  eyebrow?: string;
  heading?: string;
  body?: string;
  eyebrowStyle?: TextStyle;
  textStyle?: TextStyle;
  bodyStyle?: TextStyle;
  captionStyle?: TextStyle;
  labelStyle?: TextStyle;
  images: SectionImage[];
  /** how images sit relative to the text */
  layout: "stacked" | "beside" | "behind";
  imageSide: "left" | "right";
  gallery: "grid" | "carousel";
  columns: 1 | 2 | 3 | 4;
  align: SectionAlign;
  height: "sm" | "md" | "lg";
  buttonLabel?: string;
  buttonHref?: string;
  buttonVariant?: "solid" | "outline" | "link";
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

import { useEffect, useState } from "react";
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
  return (
    <img src={image.url} alt={image.alt || ""} loading="lazy" className={`${className} object-cover`} />
  );
}

function SectionButton({
  label, href, variant = "solid", style,
}: { label: string; href: string; variant?: ButtonSection["variant"]; style?: TextStyle }) {
  const base = "inline-flex items-center justify-center uppercase tracking-[0.18em] transition-colors";
  const styles =
    variant === "outline"
      ? "border border-ink px-7 py-3 hover:bg-ink hover:text-cream"
      : variant === "link"
        ? "underline underline-offset-4 hover:text-brass"
        : "bg-ink px-7 py-3 hover:bg-ink/90";
  const text = bodyClasses(style, { color: variant === "solid" ? "cream" : "ink", size: "sm" });
  return (
    <a href={href || "#"} className={`${base} ${styles} ${text}`}>
      {label}
    </a>
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
            onClick={() => setI((v) => (v - 1 + n) % n)}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-cream/85 hover:bg-cream p-2 shadow"
          >
            <ChevronLeft className="h-5 w-5 text-ink" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setI((v) => (v + 1) % n)}
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
                onClick={() => setI(idx)}
                className={`h-2 w-2 rounded-full transition ${idx === i ? "bg-cream" : "bg-cream/50 hover:bg-cream/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FreeGallery({ section, onDark }: { section: FreeSection; onDark?: boolean }) {
  if (!section.images.length) return null;
  if (section.gallery === "carousel") {
    return (
      <Carousel
        section={{
          id: section.id, type: "carousel", images: section.images,
          captionStyle: section.captionStyle,
        }}
      />
    );
  }
  return (
    <div className={`grid gap-6 ${colClass[section.columns]}`}>
      {section.images.map((img, i) => (
        <figure key={i}>
          <Pic image={img} className="w-full aspect-[4/3] rounded-lg" />
          {img.caption ? (
            <figcaption
              className={`mt-3 leading-relaxed ${bodyClasses(section.captionStyle, {
                color: onDark ? "cream" : "stone",
                size: "sm",
              })}`}
            >
              {img.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function FreeText({ section, onDark }: { section: FreeSection; onDark?: boolean }) {
  const hasText = section.eyebrow || section.heading || section.body || section.buttonLabel;
  if (!hasText) return null;
  const base: TextColor = onDark ? "cream" : "ink";
  return (
    <div className={`flex flex-col gap-4 ${alignText[section.align]}`}>
      {section.eyebrow ? (
        <p className={`uppercase tracking-[0.24em] ${bodyClasses(section.eyebrowStyle, { color: onDark ? "cream" : "stone", size: "sm" })}`}>
          {section.eyebrow}
        </p>
      ) : null}
      {section.heading ? (
        <h2 className={`max-w-2xl ${headingClasses(section.textStyle, { color: base, size: "lg" })}`}>
          {section.heading}
        </h2>
      ) : null}
      {section.body ? (
        <p className={`max-w-xl leading-relaxed whitespace-pre-wrap ${bodyClasses(section.bodyStyle, { color: onDark ? "cream" : "stone", size: "md" })}`}>
          {section.body}
        </p>
      ) : null}
      {section.buttonLabel ? (
        <div className="mt-2">
          <SectionButton
            label={section.buttonLabel}
            href={section.buttonHref || "#"}
            variant={section.buttonVariant ?? (onDark ? "outline" : "solid")}
            style={section.labelStyle}
          />
        </div>
      ) : null}
    </div>
  );
}

function FreeView({ section }: { section: FreeSection }) {
  const hasImages = section.images.length > 0;

  if (section.layout === "behind" && hasImages) {
    return (
      <section className="py-12">
        <div className={`relative overflow-hidden rounded-lg ${overlayHeight[section.height]}`}>
          <Pic image={section.images[0]} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-ink/35" />
          <div className={`relative flex h-full flex-col justify-center px-8 sm:px-14 py-16 ${overlayHeight[section.height]}`}>
            <FreeText section={section} onDark />
          </div>
        </div>
      </section>
    );
  }

  if (section.layout === "beside" && hasImages) {
    return (
      <section className="py-12">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-2 items-center">
          <div className={section.imageSide === "right" ? "md:order-2" : ""}>
            <FreeGallery section={{ ...section, columns: section.images.length > 1 ? 2 : 1 }} />
          </div>
          <div className="max-w-xl w-full">
            <FreeText section={section} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 space-y-8">
      <FreeText section={section} />
      <FreeGallery section={section} />
    </section>
  );
}

export function SectionView({ section }: { section: Section }) {
  const heading = (text?: string, style?: TextStyle) =>
    text ? (
      <h2 className={`mb-8 ${headingClasses(style, { color: "ink", size: "md" })}`}>{text}</h2>
    ) : null;

  switch (section.type) {
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
                <p className={`uppercase tracking-[0.24em] ${bodyClasses(section.eyebrowStyle, { color: "cream", size: "sm" })}`}>{section.eyebrow}</p>
              ) : null}
              <h2 className={`max-w-2xl ${headingClasses(section.textStyle, { color: "cream", size: "lg" })}`}>
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
                <p className={`uppercase tracking-[0.24em] mb-3 ${bodyClasses(section.eyebrowStyle, { color: "stone", size: "sm" })}`}>{section.eyebrow}</p>
              ) : null}
              <h2 className={`mb-4 ${headingClasses(section.textStyle, { color: "ink", size: "lg" })}`}>{section.heading}</h2>
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

export default function ObjectSections({ sections }: { sections: Section[] }) {
  if (!sections.length) return null;
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
      {sections.map((s) => (
        <SectionView key={s.id} section={s} />
      ))}
    </div>
  );
}
