/**
 * Convert a possibly-relative asset URL into an absolute https URL
 * that resolves in a browser address bar.
 *
 * - Absolute URLs (http:, https:, data:, blob:) are returned as-is.
 * - Protocol-relative URLs (//host/...) get the current protocol.
 * - Anything else (including "/__l5e/..." and bare storage paths) is
 *   resolved against window.location.origin.
 */
export function toAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (typeof window === "undefined") return trimmed;
  if (trimmed.startsWith("//")) return `${window.location.protocol}${trimmed}`;
  const origin = window.location.origin.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
