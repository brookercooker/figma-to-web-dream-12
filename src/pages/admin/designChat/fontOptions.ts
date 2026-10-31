export const EDITOR_FONTS = [
  ["Cormorant Garamond", "'Cormorant Garamond', Georgia, serif"],
  ["Figtree", "Figtree, system-ui, sans-serif"],
  ["Georgia", "Georgia, serif"],
  ["Monospace", "ui-monospace, monospace"],
] as const;
export function inheritedFont(family: string | undefined, tag: string) {
  const fallback = /^H[1-6]$/i.test(tag) ? EDITOR_FONTS[0][1] : EDITOR_FONTS[1][1];
  const value = family?.trim() || fallback;
  const first = value.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
  const known = EDITOR_FONTS.find(([name, stack]) => name.toLowerCase() === first.toLowerCase() || stack.split(",")[0].replace(/^['"]|['"]$/g, "").toLowerCase() === first.toLowerCase());
  return { family: value, name: known?.[0] ?? first };
}
export function inheritedWeight(weight: string | undefined): string {
  const value = weight?.trim().toLowerCase();
  if (!value || value === "normal") return "Regular";
  if (value === "bold") return "Bold";
  const names: Record<string, string> = { "100": "Thin", "200": "Extra Light", "300": "Light", "400": "Regular", "500": "Medium", "600": "Semibold", "700": "Bold", "800": "Extra Bold", "900": "Black" };
  return names[value] ?? value;
}
/** Font menu entries: the inherited font first (named plainly), then the editor fonts that differ from it, so no font is listed twice. */
export function fontMenu(inheritedName: string) {
  const same = (name: string) => name.toLowerCase() === inheritedName.toLowerCase();
  return { inheritedLabel: inheritedName, others: EDITOR_FONTS.filter(([name]) => !same(name)) };
}
