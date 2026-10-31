/** Staff enter pixels, even when a built style uses font-relative units. */
export function spacingPixels(value: string | undefined, fontSize: string, rootSize = "16px") {
  if (!value || value === "normal") return "";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "";
  const factor = value.endsWith("rem") ? parseFloat(rootSize) : value.endsWith("em") ? parseFloat(fontSize) : 1;
  return String(Math.round(n * (factor || 16) * 1000) / 1000);
}
export function lineHeightMultiplier(value: string | undefined, fontSize: string) {
  if (!value || value === "normal") return "";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "";
  const ratio = value.endsWith("px") ? n / parseFloat(fontSize) : value.endsWith("%") ? n / 100 : n;
  return Number.isFinite(ratio) ? String(Math.round(ratio * 100) / 100) : "";
}