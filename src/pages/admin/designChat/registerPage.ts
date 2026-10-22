/** "/about/" → "/about"; "/" stays. */
export function normalizePreviewPath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

export type RegistrablePage = { name: string; path: string };

/** Only visitor pages can be automatically added for hand editing. */
export function pageToRegister(path: string, notFound = false): RegistrablePage | null {
  const key = normalizePreviewPath(path);
  if (notFound || !key.startsWith("/") || key === "/" || key === "/home" || key === "*" ||
      key.startsWith("/preview/") || key.startsWith("/manage") || key.startsWith("/admin") || key.startsWith("/landing/")) return null;
  const name = (key.split("/").pop() ?? "").replace(/[-_]+/g, " ").split(/\s+/).filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  return name ? { name, path: key } : null;
}