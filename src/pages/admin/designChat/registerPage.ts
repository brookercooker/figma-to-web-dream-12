import { toRouteSlug } from "../slug";

/** "/about/" → "/about"; "/" stays. */
export function normalizePreviewPath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

/** The front page answers at both "/" and "/home". */
export const isHomePath = (path: string) => { const k = normalizePreviewPath(path); return k === "/" || k === "/home"; };
/** Every stored path that can mean this address: ["/", "/home"] for the front page, otherwise just the path. */
export const homeAliases = (path: string): string[] => (isHomePath(path) ? ["/", "/home"] : [normalizePreviewPath(path)]);
/** One key per page for caches: the front page is always "/". */
export const pageKey = (path: string) => (isHomePath(path) ? "/" : normalizePreviewPath(path));

export type RegistrablePage = { name: string; path: string };

export function pageRow(candidate: RegistrablePage, type: "static" | "landing" = "static", suffix = "") {
  return { name: candidate.name, path: candidate.path, page_type: type, status: "draft", build_status: type === "landing" ? "draft" : "ready",
    content: null, inline_edits: {}, slug_id: `${toRouteSlug(candidate.name)}-${suffix}` };
}

export function pageSlugSuffix() {
  return Array.from(crypto.getRandomValues(new Uint8Array(3)), (n) => n.toString(16).padStart(2, "0")).join("");
}

/** Only visitor pages can be automatically added for hand editing. */
export function pageToRegister(path: string, notFound = false): RegistrablePage | null {
  const key = normalizePreviewPath(path);
  if (notFound || !key.startsWith("/") || key === "/" || key === "/home" || key === "*" ||
      key.startsWith("/preview/") || key.startsWith("/manage") || key.startsWith("/admin") || key.startsWith("/landing/")) return null;
  const name = (key.split("/").pop() ?? "").replace(/[-_]+/g, " ").split(/\s+/).filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  return name ? { name, path: key } : null;
}