export function normalizeOrigin(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let u: URL;
  try { u = new URL(value.trim()); } catch { return null; }
  if (u.protocol !== "https:" || u.port) return null;
  return `https://${u.hostname.toLowerCase()}`;
}
export function parseAllowedOrigins(list: string | undefined | null): string[] {
  return String(list ?? "").split(",").map((x) => normalizeOrigin(x)).filter((x): x is string => !!x);
}
export function isAllowedOrigin(origin: string | null, allowed: string[]): boolean {
  return !!origin && allowed.includes(origin);
}
