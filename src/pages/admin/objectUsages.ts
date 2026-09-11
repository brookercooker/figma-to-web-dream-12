// Reliable, build-time detection of which pages render a given Object.
//
// Approach:
//   1) Eager-load the raw source of every project .tsx via Vite's `?raw` glob.
//   2) For a given object `component_key`, find every source file whose text
//      references either the registry lookup ("objectRegistry.<Key>" / bracket
//      form) or a direct import of the underlying module.
//   3) Multi-export page modules (e.g. SimplePage.tsx exports AboutPage,
//      ContactPage, …) are analysed per-export block so we don't over-report.
//   4) Parse App.tsx to map (page file + export name) → route path(s).
//   5) Cross-check DB `pages` rows to distinguish static vs. landing.

import { supabase } from "@/integrations/supabase/client";
import appRaw from "@/App.tsx?raw";

// Eager raw import of every source file in the project.
export const rawFiles = import.meta.glob("/src/**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Module path (relative to /src, without extension) that each registry entry
// resolves to. Keep in sync with src/components/objects/registry.tsx.
const REGISTRY_MODULES: Record<string, string> = {
  AboutUs: "components/objects/AboutUs",
  DesignServices: "components/objects/DesignServices",
  FeaturedBrandQuorum: "components/objects/FeaturedBrandQuorum",
  GoogleReviews: "components/GoogleReviews",
  HinkleyNewArrivals: "components/objects/HinkleyNewArrivals",
  QuorumNewArrivals: "components/objects/QuorumNewArrivals",
  TeamPreview: "components/TeamPreview",
  MailchimpForm: "components/objects/MailchimpForm",
};

/** True if the given source text references the object (registry or direct import). */
function sourceReferencesObject(src: string, componentKey: string): boolean {
  if (
    src.includes(`objectRegistry.${componentKey}`) ||
    src.includes(`objectRegistry["${componentKey}"]`) ||
    src.includes(`objectRegistry['${componentKey}']`)
  ) {
    return true;
  }
  const mod = REGISTRY_MODULES[componentKey];
  if (!mod) return false;
  // Match `from "…/components/objects/AboutUs"` (with or without extension)
  const escaped = mod.replace(/\//g, "\\/");
  const importRe = new RegExp(`from\\s+["'][^"']*${escaped}(?:\\.tsx)?["']`);
  return importRe.test(src);
}

/** Split a multi-export page module into per-export blocks. */
function splitExports(src: string): Array<{ name: string; body: string }> {
  const out: Array<{ name: string; body: string }> = [];
  // Preamble (imports + top-level consts) is included in every export block so
  // aliases like `const AboutObject = objectRegistry.AboutUs.component` remain
  // visible to the reference test.
  const re = /export\s+const\s+([A-Za-z0-9_]+)\s*=/g;
  const matches = [...src.matchAll(re)];
  if (matches.length === 0) return [];
  const preamble = src.slice(0, matches[0].index ?? 0);
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? src.length) : src.length;
    out.push({ name: matches[i][1], body: preamble + "\n" + src.slice(start, end) });
  }
  return out;
}

// ─── Parse App.tsx once ──────────────────────────────────────────────────────

export interface RouteEntry {
  path: string;
  file: string;                 // "/src/pages/…" absolute (glob) key
  exportName?: string;          // when the lazy() targets a named export
}

let cachedRoutes: RouteEntry[] | null = null;

function resolveAppImport(rel: string): string | null {
  // rel like "./pages/Index.tsx" or "@/components/objects/AboutUs"
  let p = rel;
  if (p.startsWith("@/")) p = "/src/" + p.slice(2);
  else if (p.startsWith("./")) p = "/src/" + p.slice(2);
  if (!p.startsWith("/src/")) return null;
  if (!/\.tsx$/i.test(p)) p += ".tsx";
  return rawFiles[p] ? p : null;
}

export function parseAppRoutes(): RouteEntry[] {
  if (cachedRoutes) return cachedRoutes;
  const src = appRaw as string;
  // Locals: symbol → { file, exportName? }
  const locals: Record<string, { file: string; exportName?: string }> = {};

  // (a) const Foo = lazy(() => import("<path>"));
  const lazyRe = /const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(["']([^"']+)["']\)\s*\)/g;
  for (const m of src.matchAll(lazyRe)) {
    const file = resolveAppImport(m[2]);
    if (file) locals[m[1]] = { file };
  }
  // (b) const Foo = lazy(() => SimplePages().then((m) => ({ default: m.Bar })));
  const simpleRe = /const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\s*\(\)\s*=>\s*SimplePages\(\)[^;]*?m\.([A-Za-z0-9_]+)/g;
  for (const m of src.matchAll(simpleRe)) {
    locals[m[1]] = { file: "/src/pages/SimplePage.tsx", exportName: m[2] };
  }
  // Also handle plain "const Foo = ComponentName" (non-lazy) — none currently, but future-proof.

  // <Route path="…" element={<Foo …/>} />
  const routes: RouteEntry[] = [];
  const routeRe = /<Route\s+[^>]*?path=(?:"([^"]+)"|\{"([^"]+)"\})[^>]*?element=\{\s*<([A-Za-z0-9_]+)/g;
  for (const m of src.matchAll(routeRe)) {
    const path = m[1] ?? m[2];
    const sym = m[3];
    const local = locals[sym];
    if (!local) continue;
    routes.push({ path, file: local.file, exportName: local.exportName });
  }
  cachedRoutes = routes;
  return routes;
}

export interface ObjectUsage {
  path: string;
  name: string;
  type: "static" | "landing";
  pageId?: string;
  updated_at?: string;
  thumbnail_updated_at?: string | null;
  thumbnail_build_version?: string | null;
  thumbnail_url?: string | null;
}

/** Code-scan (no DB) usages for a single componentKey. */
function scanUsagesForKey(componentKey: string, routes: RouteEntry[]): ObjectUsage[] {
  const matchedFiles = new Set<string>();
  const matchedExports = new Set<string>();
  for (const [file, src] of Object.entries(rawFiles)) {
    if (file.includes("/pages/admin/") || file.endsWith("/App.tsx") ||
        file.endsWith("/pages/ObjectRoute.tsx") || file.endsWith("/pages/admin/ObjectPreview.tsx") ||
        file.endsWith("/components/objects/registry.tsx")) continue;
    const mod = REGISTRY_MODULES[componentKey];
    if (mod && file.endsWith(`/${mod}.tsx`)) continue;
    const blocks = splitExports(src);
    if (blocks.length > 1) {
      let anyMatch = false;
      for (const b of blocks) {
        if (sourceReferencesObject(b.body, componentKey)) {
          matchedExports.add(`${file}::${b.name}`);
          anyMatch = true;
        }
      }
      if (anyMatch) continue;
    }
    if (sourceReferencesObject(src, componentKey)) matchedFiles.add(file);
  }
  const usages: ObjectUsage[] = [];
  const seen = new Set<string>();
  for (const r of routes) {
    const wholeFile = matchedFiles.has(r.file);
    const perExport = r.exportName ? matchedExports.has(`${r.file}::${r.exportName}`) : false;
    if (!wholeFile && !perExport) continue;
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    const type: "static" | "landing" = r.path.startsWith("/landing/") ? "landing" : "static";
    usages.push({ path: r.path, name: r.path, type });
  }
  return usages;
}

async function enrichUsages(usages: ObjectUsage[]): Promise<ObjectUsage[]> {
  if (usages.length === 0) return usages;
  const paths = usages.map((u) => u.path);
  const { data } = await (supabase as any)
    .from("pages")
    .select("id,name,path,page_type,updated_at,thumbnail_updated_at,thumbnail_build_version,thumbnail_url,archived_at")
    .in("path", paths);
  const byPath = new Map<string, any>();
  for (const row of (data ?? [])) {
    if (row.archived_at) continue;
    byPath.set(row.path, row);
  }
  for (const u of usages) {
    const row = byPath.get(u.path);
    if (!row) continue;
    u.name = row.name || u.name;
    u.pageId = row.id;
    u.updated_at = row.updated_at;
    u.thumbnail_updated_at = row.thumbnail_updated_at ?? null;
    u.thumbnail_build_version = row.thumbnail_build_version ?? null;
    u.thumbnail_url = row.thumbnail_url ?? null;
    if (row.page_type === "landing" || row.page_type === "static") u.type = row.page_type;
  }
  return usages.sort((a, b) => {
    if (a.type !== b.type) return a.type === "static" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Return the list of pages that render the given object. */
export async function findObjectUsages(componentKey: string): Promise<ObjectUsage[]> {
  const routes = parseAppRoutes();
  const usages = scanUsagesForKey(componentKey, routes);
  return enrichUsages(usages);
}

/** Return usage rows for many component keys with a single DB round-trip. */
export async function findAllObjectUsages(
  componentKeys: string[],
): Promise<Map<string, ObjectUsage[]>> {
  const routes = parseAppRoutes();
  const perKey = new Map<string, ObjectUsage[]>();
  const allPaths = new Set<string>();
  for (const key of componentKeys) {
    const usages = scanUsagesForKey(key, routes);
    perKey.set(key, usages);
    usages.forEach((u) => allPaths.add(u.path));
  }
  if (allPaths.size === 0) return perKey;
  // Enrich in one query
  const flat: ObjectUsage[] = [];
  for (const list of perKey.values()) flat.push(...list);
  await enrichUsages(flat);
  // Re-sort per key
  for (const [k, list] of perKey) {
    perKey.set(k, [...list].sort((a, b) =>
      a.type !== b.type ? (a.type === "static" ? -1 : 1) : a.name.localeCompare(b.name)));
  }
  return perKey;
}
