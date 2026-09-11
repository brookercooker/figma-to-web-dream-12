/**
 * Universal label color palette. 16 visually distinct hues spanning the
 * spectrum. Each entry has a muted background + solid text style so the
 * chips stay legible at small sizes.
 *
 * Stored as an integer index (0..15) on `tags.color_index`. Legacy labels
 * with no assigned color fall back to a deterministic hash of the label
 * name so they render consistently until an assignment is made.
 */

export interface LabelColor {
  /** Palette index (0..PALETTE.length - 1). */
  idx: number;
  /** Human-readable name (for a11y and picker tooltips). */
  name: string;
  /** Background hue - stays pale for pill fills. */
  bg: string;
  /** Border hue - a touch darker than bg for definition. */
  border: string;
  /** Text hue - dark enough for AA contrast on `bg`. */
  text: string;
  /** Icon fill on the Tag glyph. */
  iconFill: string;
  /** Icon stroke on the Tag glyph. */
  iconStroke: string;
  /** Solid swatch color for the color-picker chip. */
  swatch: string;
}

/**
 * 16-slot palette. Ordered so consecutive slots are visually distant
 * (e.g. red → teal → yellow → indigo) so the auto-assign "least used"
 * strategy tends to hand out unrelated colors first.
 */
export const PALETTE: LabelColor[] = [
  { idx: 0,  name: "Red",       bg: "hsl(0 70% 94%)",    border: "hsl(0 55% 72%)",   text: "hsl(0 55% 30%)",    iconFill: "hsl(0 70% 82%)",   iconStroke: "hsl(0 55% 40%)",   swatch: "hsl(0 65% 55%)" },
  { idx: 1,  name: "Teal",      bg: "hsl(175 55% 92%)",  border: "hsl(175 45% 65%)", text: "hsl(175 55% 22%)",  iconFill: "hsl(175 55% 78%)", iconStroke: "hsl(175 55% 32%)", swatch: "hsl(175 55% 42%)" },
  { idx: 2,  name: "Amber",     bg: "hsl(38 80% 90%)",   border: "hsl(38 60% 60%)",  text: "hsl(28 55% 28%)",   iconFill: "hsl(38 80% 75%)",  iconStroke: "hsl(28 65% 40%)",  swatch: "hsl(38 85% 52%)" },
  { idx: 3,  name: "Indigo",    bg: "hsl(235 65% 94%)",  border: "hsl(235 50% 70%)", text: "hsl(235 55% 32%)",  iconFill: "hsl(235 65% 82%)", iconStroke: "hsl(235 55% 45%)", swatch: "hsl(235 60% 55%)" },
  { idx: 4,  name: "Green",     bg: "hsl(140 55% 92%)",  border: "hsl(140 40% 62%)", text: "hsl(140 50% 24%)",  iconFill: "hsl(140 55% 78%)", iconStroke: "hsl(140 50% 34%)", swatch: "hsl(140 55% 40%)" },
  { idx: 5,  name: "Pink",      bg: "hsl(335 75% 94%)",  border: "hsl(335 60% 72%)", text: "hsl(335 55% 32%)",  iconFill: "hsl(335 75% 84%)", iconStroke: "hsl(335 60% 45%)", swatch: "hsl(335 70% 58%)" },
  { idx: 6,  name: "Orange",    bg: "hsl(20 80% 92%)",   border: "hsl(20 65% 65%)",  text: "hsl(18 60% 30%)",   iconFill: "hsl(20 80% 78%)",  iconStroke: "hsl(18 65% 42%)",  swatch: "hsl(20 80% 52%)" },
  { idx: 7,  name: "Blue",      bg: "hsl(210 70% 93%)",  border: "hsl(210 55% 68%)", text: "hsl(210 60% 30%)",  iconFill: "hsl(210 70% 80%)", iconStroke: "hsl(210 60% 42%)", swatch: "hsl(210 65% 50%)" },
  { idx: 8,  name: "Yellow",    bg: "hsl(50 85% 88%)",   border: "hsl(45 60% 55%)",  text: "hsl(38 55% 26%)",   iconFill: "hsl(50 85% 72%)",  iconStroke: "hsl(42 65% 38%)",  swatch: "hsl(48 85% 52%)" },
  { idx: 9,  name: "Purple",    bg: "hsl(275 60% 93%)",  border: "hsl(275 45% 72%)", text: "hsl(275 45% 32%)",  iconFill: "hsl(275 60% 82%)", iconStroke: "hsl(275 50% 45%)", swatch: "hsl(275 55% 55%)" },
  { idx: 10, name: "Lime",      bg: "hsl(85 60% 90%)",   border: "hsl(85 45% 55%)",  text: "hsl(85 55% 22%)",   iconFill: "hsl(85 60% 74%)",  iconStroke: "hsl(85 55% 32%)",  swatch: "hsl(85 60% 42%)" },
  { idx: 11, name: "Magenta",   bg: "hsl(310 70% 93%)",  border: "hsl(310 55% 70%)", text: "hsl(310 55% 32%)",  iconFill: "hsl(310 70% 82%)", iconStroke: "hsl(310 55% 42%)", swatch: "hsl(310 65% 52%)" },
  { idx: 12, name: "Sky",       bg: "hsl(195 75% 92%)",  border: "hsl(195 60% 62%)", text: "hsl(195 60% 26%)",  iconFill: "hsl(195 75% 78%)", iconStroke: "hsl(195 60% 38%)", swatch: "hsl(195 70% 45%)" },
  { idx: 13, name: "Brown",     bg: "hsl(25 35% 88%)",   border: "hsl(25 30% 55%)",  text: "hsl(25 40% 26%)",   iconFill: "hsl(25 40% 72%)",  iconStroke: "hsl(25 40% 36%)",  swatch: "hsl(25 45% 42%)" },
  { idx: 14, name: "Rose",      bg: "hsl(355 70% 93%)",  border: "hsl(355 55% 72%)", text: "hsl(355 55% 32%)",  iconFill: "hsl(355 70% 82%)", iconStroke: "hsl(355 55% 45%)", swatch: "hsl(355 65% 55%)" },
  { idx: 15, name: "Slate",     bg: "hsl(215 20% 90%)",  border: "hsl(215 15% 60%)", text: "hsl(215 25% 28%)",  iconFill: "hsl(215 22% 76%)", iconStroke: "hsl(215 20% 40%)", swatch: "hsl(215 22% 48%)" },
];

/** Deterministic hash → palette index for legacy labels missing a color. */
function hashIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

/**
 * Resolve a palette entry for a label.
 * - `colorIndex` from the DB wins.
 * - Otherwise deterministic hash of the name (legacy fallback).
 */
export function colorFor(name: string, colorIndex?: number | null): LabelColor {
  if (colorIndex != null && colorIndex >= 0 && colorIndex < PALETTE.length) {
    return PALETTE[colorIndex];
  }
  return PALETTE[hashIndex(name)];
}

/**
 * Pick the least-used palette index across the given assigned indexes.
 * Ties break in palette order so early slots fill first once we wrap.
 */
export function pickLeastUsedColor(assigned: Array<number | null | undefined>): number {
  const counts = new Array(PALETTE.length).fill(0);
  for (const c of assigned) {
    if (c != null && c >= 0 && c < PALETTE.length) counts[c]++;
  }
  let best = 0;
  let bestCount = counts[0];
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] < bestCount) { best = i; bestCount = counts[i]; }
  }
  return best;
}
