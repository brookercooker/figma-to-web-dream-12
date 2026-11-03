import { parseKey, type InlineEdits } from "@/lib/inlineEditCore";

export const iconPositionKey = (path: string) => `icon-position:${path}`;
export function validTextLink(href: string): boolean {
  if (!href || /[\s\u0000-\u001f\u007f\\]/.test(href)) return false;
  if (/^https:\/\//i.test(href)) {
    try { const url = new URL(href); return url.protocol === "https:" && !!url.hostname; } catch { return false; }
  }
  return /^mailto:[^?]+(?:\?.*)?$/i.test(href) || /^tel:[+\d][\d().+-]*$/i.test(href) || /^\/(?!\/)/.test(href);
}
/** Manager-side extension until the public verbatim replay core supports icon placement. */
export function splitIconPositions(value: Record<string, unknown>): { base: Record<string, unknown>; positions: InlineEdits } | null {
  const base: Record<string, unknown> = {}, positions: InlineEdits = {};
  for (const [key, position] of Object.entries(value)) {
    if (!key.startsWith("icon-position:")) { base[key] = position; continue; }
    const path = key.slice("icon-position:".length);
    if (!parseKey(`icon:${path}`) || (position !== "before" && position !== "after")) return null;
    positions[key] = position;
  }
  return { base, positions };
}