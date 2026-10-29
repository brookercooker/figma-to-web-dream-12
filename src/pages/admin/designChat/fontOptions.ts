export const EDITOR_FONTS = [
  ["Cormorant Garamond", "'Cormorant Garamond', Georgia, serif"],
  ["Figtree", "Figtree, system-ui, sans-serif"],
  ["Georgia", "Georgia, serif"],
  ["Monospace", "ui-monospace, monospace"],
] as const;
export function inheritedFont(family: string | undefined, tag: string) {
  const fallback = /^H[1-6]$/i.test(tag) ? EDITOR_FONTS[0][1] : EDITOR_FONTS[1][1];
  const value = family?.trim() || fallback;
  return { family: value, name: value.split(",")[0].trim().replace(/^['"]|['"]$/g, "") };
}
export function inheritedWeight(weight: string | undefined): string {
  const value = weight?.trim().toLowerCase();
  if (!value || value === "normal") return "Regular";
  if (value === "bold") return "Bold";
  const names: Record<string, string> = { "100": "Thin", "200": "Extra Light", "300": "Light", "400": "Regular", "500": "Medium", "600": "Semibold", "700": "Bold", "800": "Extra Bold", "900": "Black" };
  return names[value] ?? value;
}