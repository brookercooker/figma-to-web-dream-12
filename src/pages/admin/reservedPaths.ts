// Route paths reserved by the app itself. Storefront pages must not collide.
export const RESERVED_PATH_PREFIXES = ["/manage", "/admin", "/landing", "/objects"] as const;

export function reservedPrefixFor(path: string): string | null {
  const p = (path || "").toLowerCase();
  for (const prefix of RESERVED_PATH_PREFIXES) {
    if (p === prefix || p.startsWith(`${prefix}/`)) return prefix;
  }
  return null;
}

export function isReservedAppPath(path: string): boolean {
  return reservedPrefixFor(path) !== null;
}
