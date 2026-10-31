export const SELECTION_PALETTE = ["ink", "stone", "garnet", "brass", "sand", "cream", "white"] as const;
export const paletteColour = (token: typeof SELECTION_PALETTE[number]) => `hsl(var(--nova-${token === "white" ? "cream" : token}))`;

/** Display-only conversion: never replace the colour sent by the frame or written by the user. */
export function colourRgb(value: string): number[] | null {
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
  if (hex) { const full = hex.length === 3 ? [...hex].map(c => c + c).join("") : hex; return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)); }
  const variable = value.match(/var\((--[\w-]+)\)/)?.[1];
  const resolved = variable ? value.replace(/var\(--[\w-]+\)/, getComputedStyle(document.documentElement).getPropertyValue(variable).trim()) : value;
  const rgb = resolved.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return rgb.slice(1, 4).map(Number);
  const hsl = resolved.match(/^hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
  if (!hsl) return null;
  const h = Number(hsl[1]) / 360, s = Number(hsl[2]) / 100, l = Number(hsl[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map(n => { const k = (n + h * 12) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); });
}
export function selectionColourDisplay(value?: string) {
  if (!value) return { name: "Default", hex: "", token: undefined };
  const rgb = colourRgb(value);
  const token = SELECTION_PALETTE.find(t => paletteColour(t) === value) ?? (rgb ? SELECTION_PALETTE
    .map(t => ({ token: t, rgb: colourRgb(paletteColour(t)) }))
    .filter((c): c is { token: typeof SELECTION_PALETTE[number]; rgb: number[] } => c.rgb !== null)
    .sort((a, b) => a.rgb.reduce((sum, v, i) => sum + (v - rgb[i]) ** 2, 0) - b.rgb.reduce((sum, v, i) => sum + (v - rgb[i]) ** 2, 0))[0]?.token : undefined);
  return { token, name: token ? token[0].toUpperCase() + token.slice(1) : value,
    hex: rgb ? `#${rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}` : "" };
}