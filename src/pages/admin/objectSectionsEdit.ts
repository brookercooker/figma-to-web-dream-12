// Designed objects' sections edited like a page's held blocks: labels, moves, picked additions and the Section Layout settings.
import { SECTION_LABEL, makeSection, newSectionId, type Section, type SectionType } from "@/components/ObjectSections";

export const sectionLabel = (s: Section): string => {
  const heading = (s as { heading?: unknown }).heading;
  const base = SECTION_LABEL[s.type as SectionType] ?? "Section";
  return typeof heading === "string" && heading.trim() ? `${base}: ${heading.trim().slice(0, 40)}` : base;
};

/** Plain move within the object's sections (no page-content marker in object scope). */
export function moveSection<T extends { id: string }>(list: readonly T[], id: string, toIndex: number): T[] {
  const from = list.findIndex((s) => s.id === id);
  if (from < 0 || !Number.isFinite(toIndex)) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, Math.trunc(toIndex))), 0, item);
  return next;
}

/** A picked image becomes a block section holding that picture. */
export function imageSection(url: string, alt = ""): Section {
  return { ...(makeSection("free") as Extract<Section, { type: "free" }>), images: [{ url, alt }] };
}
/** A picked video becomes a block section holding that video. */
export function videoSection(url: string, poster?: string | null): Section {
  return { ...(makeSection("free") as Extract<Section, { type: "free" }>), images: [], videos: [{ id: newSectionId(), url, ...(poster ? { poster } : {}) }] };
}

export type LayoutField =
  | { key: string; label: string; kind: "choice"; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: "number"; min: number; max: number; step?: number; unit?: string }
  | { key: string; label: string; kind: "toggle" };

const ALIGN = [{ value: "left", label: "Left" }, { value: "center", label: "Centre" }, { value: "right", label: "Right" }];
const SIZE3 = [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }];
const VARIANT = [{ value: "solid", label: "Solid" }, { value: "outline", label: "Outline" }, { value: "link", label: "Link" }];
const SIDE = [{ value: "left", label: "Picture Left" }, { value: "right", label: "Picture Right" }];
const COLOURS = [{ value: "", label: "None" }, { value: "sand", label: "Sand" }, { value: "brass", label: "Tan" }, { value: "stone", label: "Stone" }, { value: "ink", label: "Ink" }, { value: "garnet", label: "Garnet" }, { value: "cream", label: "White" }];
const cols = (values: number[]) => values.map((v) => ({ value: String(v), label: String(v) }));

/** The layout settings one section offers (only its own type's settings). */
export function layoutFields(s: Section): LayoutField[] {
  const flow: LayoutField[] = [
    { key: "flow", label: "Placement", kind: "choice", options: [{ value: "separate", label: "Own Row" }, { value: "inline", label: "Same Row" }] },
    ...((s as { flow?: string }).flow === "inline" ? [{ key: "flowWidth", label: "Width", kind: "number", min: 10, max: 100, step: 5, unit: "%" } as LayoutField] : []),
  ];
  switch (s.type) {
    case "imageRow": return [...flow, { key: "columns", label: "Columns", kind: "choice", options: cols([2, 3, 4]) }];
    case "captionedImages": return [...flow, { key: "columns", label: "Columns", kind: "choice", options: cols([1, 2, 3]) }];
    case "overlay": return [...flow, { key: "align", label: "Text Alignment", kind: "choice", options: ALIGN }, { key: "height", label: "Height", kind: "choice", options: SIZE3 }];
    case "split": return [...flow, { key: "imageSide", label: "Picture Side", kind: "choice", options: SIDE }];
    case "button": return [...flow, { key: "align", label: "Alignment", kind: "choice", options: ALIGN }, { key: "variant", label: "Style", kind: "choice", options: VARIANT }];
    case "free": return [...flow,
      { key: "layout", label: "Pictures and Text", kind: "choice", options: [{ value: "stacked", label: "Stacked" }, { value: "beside", label: "Side by Side" }, { value: "behind", label: "Text on Picture" }] },
      { key: "imageSide", label: "Picture Side", kind: "choice", options: SIDE },
      { key: "gallery", label: "Pictures As", kind: "choice", options: [{ value: "grid", label: "Grid" }, { value: "carousel", label: "Carousel" }] },
      { key: "columns", label: "Columns", kind: "choice", options: cols([1, 2, 3, 4]) },
      { key: "carouselControls", label: "Carousel Arrows", kind: "toggle" },
      { key: "align", label: "Text Alignment", kind: "choice", options: ALIGN },
      { key: "overlayVAlign", label: "Text Position", kind: "choice", options: [{ value: "top", label: "Top" }, { value: "middle", label: "Middle" }, { value: "bottom", label: "Bottom" }] },
      { key: "rowVAlign", label: "Row Alignment", kind: "choice", options: [{ value: "top", label: "Top" }, { value: "middle", label: "Middle" }, { value: "bottom", label: "Bottom" }, { value: "baseline", label: "Text Line" }] },
      { key: "height", label: "Height", kind: "choice", options: SIZE3 },
      { key: "imageHeight", label: "Picture Height", kind: "choice", options: [{ value: "auto", label: "Natural" }, { value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra Large" }] },
      { key: "imageAlign", label: "Picture Alignment", kind: "choice", options: ALIGN },
      { key: "captionAlign", label: "Caption Alignment", kind: "choice", options: ALIGN },
      { key: "imageScrim", label: "Shade Behind Text", kind: "choice", options: [{ value: "none", label: "None" }, { value: "bottom", label: "Bottom" }, { value: "top", label: "Top" }, { value: "full", label: "Full" }] },
      { key: "imageShadow", label: "Picture Shadow", kind: "choice", options: [{ value: "none", label: "None" }, ...SIZE3] },
      { key: "buttonVariant", label: "Button Style", kind: "choice", options: VARIANT },
      { key: "padY", label: "Space Above and Below", kind: "number", min: 0, max: 240, step: 4, unit: "px" },
      { key: "padX", label: "Space at the Sides", kind: "number", min: 0, max: 240, step: 4, unit: "px" },
      { key: "bg", label: "Background", kind: "choice", options: COLOURS },
      { key: "frame", label: "Lines", kind: "choice", options: [{ value: "", label: "None" }, { value: "y", label: "Top & Bottom" }, { value: "top", label: "Top Only" }, { value: "bottom", label: "Bottom Only" }, { value: "all", label: "All Sides" }] },
      { key: "frameColor", label: "Line Colour", kind: "choice", options: COLOURS.slice(1) },
      { key: "frameWidth", label: "Line Thickness", kind: "number", min: 1, max: 8, unit: "px" },
    ];
    default: return flow;
  }
}

/** Applies one layout value; empty values remove the setting so the renderer's default applies. */
export function setLayout(s: Section, key: string, value: string | number | boolean | null): Section {
  const next = { ...s } as Record<string, unknown>;
  if (value === "" || value === null) delete next[key];
  else next[key] = key === "columns" ? Number(value) : value;
  return next as unknown as Section;
}

/** Designer settings that have no place in the panel yet (kept in the old designer until they do). */
export const LAYOUT_GAPS = [
  "per-part placement inside a block (flows, widths, alignment, stacking)",
  "card outlines around parts",
  "per-part spacing, rotation and size",
  "free text boxes and dividers",
  "button icons, button box and button background",
  "picture borders, exact picture sizes, pictures per row and carousel pictures per view",
  "free picture group positions",
  "shade strength and background pictures",
  "separate top and bottom spacing",
  "video playback settings inside sections",
];
