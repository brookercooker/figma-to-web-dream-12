/** Whole-border editing on top of the per-side longhands the shared edit core already accepts. */
export const SIDES = ["top", "right", "bottom", "left"] as const;
export type Side = (typeof SIDES)[number];
export type BorderPart = "width" | "style" | "color";
export type StyleMap = Record<string, string>;

const prop = (side: Side, part: BorderPart) => `border-${side}-${part}`;

/** Current value of one part on each side: saved edit first, then the element's computed value. */
export function sideValues(style: StyleMap, read: (p: string) => string, part: BorderPart): Record<Side, string> {
  return Object.fromEntries(SIDES.map((s) => [s, style[prop(s, part)] ?? read(prop(s, part)) ?? ""])) as Record<Side, string>;
}
/** One shared value, or null when sides differ ("Mixed"). */
export function commonValue(values: Record<Side, string>): string | null {
  const first = values.top;
  return SIDES.every((s) => values[s] === first) ? first : null;
}
export function isMixed(style: StyleMap, read: (p: string) => string): boolean {
  return (["width", "style", "color"] as const).some((part) => commonValue(sideValues(style, read, part)) === null);
}
/** Writes one part to the given sides (all four by default). Empty value clears the override. */
export function setBorderPart(style: StyleMap, part: BorderPart, value: string, sides: readonly Side[] = SIDES): StyleMap {
  const next = { ...style };
  for (const s of sides) { if (value) next[prop(s, part)] = value; else delete next[prop(s, part)]; }
  return next;
}
/**
 * All-sides change: the edited part goes to every side, and when sides were mixed the
 * other parts are equalised too (from the side that has a visible border) so no side is left behind.
 */
export function setAllSides(style: StyleMap, read: (p: string) => string, part: BorderPart, value: string): StyleMap {
  let next = setBorderPart(style, part, value);
  if (!value || !isMixed(style, read)) return next;
  const visible = SIDES.find((s) => {
    const st = style[prop(s, "style")] ?? read(prop(s, "style"));
    return st && st !== "none" && st !== "hidden";
  }) ?? "top";
  for (const other of (["width", "style", "color"] as const).filter((p) => p !== part)) {
    const v = style[prop(visible, other)] ?? read(prop(visible, other));
    if (v) next = setBorderPart(next, other, v);
  }
  if (part !== "style" && value !== "0px") {
    const st = next[prop("top", "style")];
    if (!st || st === "none" || st === "hidden") next = setBorderPart(next, "style", "solid");
  }
  return next;
}
