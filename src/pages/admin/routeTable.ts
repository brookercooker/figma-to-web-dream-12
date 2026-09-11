// Real route resolution against src/App.tsx.
// Parses the file at build time (Vite ?raw import) and classifies href destinations.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite raw import
import appSource from "@/App.tsx?raw";

export interface StaticRoute {
  path: string;
  element: string; // the raw element string (e.g. `<Home />`)
  isRedirectToComingSoon: boolean;
}

let cache: StaticRoute[] | null = null;

/** Parse <Route path="..." element={...} /> occurrences. */
export function getStaticRoutes(): StaticRoute[] {
  if (cache) return cache;
  const src = appSource as string;
  const routes: StaticRoute[] = [];
  const re = /<Route\s+[^>]*?path=(?:"([^"]+)"|\{"([^"]+)"\})[^>]*?element=\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const path = m[1] ?? m[2];
    const element = (m[3] ?? "").trim();
    const isRedirectToComingSoon = /Navigate\s+to=["']\/coming-soon["']/.test(element);
    routes.push({ path, element, isRedirectToComingSoon });
  }
  // The Navigate-array map in App.tsx isn't captured by the regex above.
  // Grab the array literal so we also learn about the /coming-soon redirects.
  const arrayMatch = src.match(/\[\s*((?:"[^"]+",?\s*)+)\]\.map\(\(p\)\s*=>\s*\([^)]*Navigate\s+to=["']\/coming-soon["']/);
  if (arrayMatch) {
    const items = arrayMatch[1].match(/"([^"]+)"/g) ?? [];
    for (const raw of items) {
      const p = raw.slice(1, -1);
      routes.push({ path: p, element: "<Navigate to=\"/coming-soon\" />", isRedirectToComingSoon: true });
    }
  }
  cache = routes;
  return routes;
}

/** Match /a/:id style paths against a concrete request path. */
function pathMatches(pattern: string, requested: string): boolean {
  if (pattern === "*") return false;
  const p = pattern.replace(/\/+$/g, "") || "/";
  const r = requested.replace(/\/+$/g, "") || "/";
  if (!p.includes(":")) return p === r;
  const pp = p.split("/"); const rp = r.split("/");
  if (pp.length !== rp.length) return false;
  return pp.every((seg, i) => seg.startsWith(":") || seg === rp[i]);
}

export type LinkStatus = "Registered" | "Pending" | "Broken" | "External" | "Self-Referencing";
export type LinkType = "Static page" | "Supernova CC" | "External" | "Unknown";

export interface Classification {
  status: LinkStatus;
  type: LinkType;
  normalized: string; // canonical destination for grouping
}

export function normalizeHref(href: string): { kind: "external" | "internal" | "hash" | "mailto"; value: string } {
  const h = (href ?? "").trim();
  if (!h) return { kind: "hash", value: "" };
  if (h.startsWith("#")) return { kind: "hash", value: h };
  if (/^(mailto:|tel:)/i.test(h)) return { kind: "mailto", value: h };
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (u.origin === window.location.origin) {
        return { kind: "internal", value: u.pathname + u.search + u.hash };
      }
    } catch { /* noop */ }
    return { kind: "external", value: h };
  }
  if (h.startsWith("/")) return { kind: "internal", value: h };
  return { kind: "external", value: h };
}

/**
 * Classify a link destination.
 * `foundOn` is the current page's route (used for self-reference detection).
 * `dbPageSlugs` is the set of DB-registered page paths (they resolve via /:slug).
 */
export function classifyDestination(
  href: string,
  foundOn: string,
  dbPagePaths: Set<string>,
): Classification {
  const n = normalizeHref(href);
  if (n.kind === "external" || n.kind === "mailto") {
    return { status: "External", type: "External", normalized: n.value };
  }
  if (n.kind === "hash" || !n.value) {
    // Treat pure hashes as self-referencing to the current page.
    return { status: "Self-Referencing", type: "Static page", normalized: foundOn };
  }
  const cleanPath = n.value.split(/[?#]/)[0];
  const routes = getStaticRoutes();
  const match = routes.find((r) => pathMatches(r.path, cleanPath));

  if (cleanPath === foundOn) {
    return { status: "Self-Referencing", type: match?.isRedirectToComingSoon ? "Supernova CC" : "Static page", normalized: cleanPath };
  }
  if (match) {
    if (match.isRedirectToComingSoon || cleanPath === "/coming-soon") {
      return { status: "Pending", type: "Supernova CC", normalized: cleanPath };
    }
    return { status: "Registered", type: "Static page", normalized: cleanPath };
  }
  if (dbPagePaths.has(cleanPath)) {
    return { status: "Registered", type: "Static page", normalized: cleanPath };
  }
  return { status: "Broken", type: "Unknown", normalized: cleanPath };
}

/** True if a DB page's `path` resolves to the /coming-soon redirect table. */
export function isComingSoonPath(path: string): boolean {
  if (!path) return false;
  const routes = getStaticRoutes();
  const m = routes.find((r) => pathMatches(r.path, path));
  return !!m?.isRedirectToComingSoon || path === "/coming-soon";
}

export type PageType = "System" | "Supernova CC" | "Static page";

/** Classify a DB page's path into a high-level page type. */
export function getPageType(path: string, name?: string): PageType {
  const p = (path ?? "").trim();
  const n = (name ?? "").trim().toLowerCase();
  if (p.startsWith("/admin") || p === "*" || p === "/404" || p === "/not-found") return "System";
  if (n === "admin" || n === "not found" || n === "notfound") return "System";
  if (isComingSoonPath(p)) return "Supernova CC";
  return "Static page";
}

export const PAGE_TYPES: PageType[] = ["Static page", "Supernova CC", "System"];

