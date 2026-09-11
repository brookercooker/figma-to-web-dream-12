/**
 * Slug/name normalization helpers for Pages and Objects "guided add" flows.
 * Rules mirror the DB `generate_slug_id` function so client and server agree.
 */

export function toRouteSlug(input: string): string {
  const base = (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return base.slice(0, 60);
}

export function toRoutePath(input: string): string {
  const s = toRouteSlug(input);
  return s ? `/${s}` : "";
}

export function toComponentName(input: string): string {
  const cleaned = (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s\-_]+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned
    .split(/[\s\-_]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

export function isValidComponentName(s: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(s);
}
