// Which pages render a given Object, from the public site's manifest (see siteManifest.ts), enriched with the page rows
// from the database (name, thumbnail, type).
//
// The manifest is written by the public site's build. If it can't be read, these functions throw
// SiteManifestUnavailable: callers must treat that as "unknown", never as "not used anywhere".

import { supabase } from "@/prototype/client";
import { loadSiteManifest, pagesUsingObject, type SiteManifest } from "./siteManifest";
import { homeAliases, pageKey } from "./designChat/registerPage";

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

export function usagesFromManifest(m: SiteManifest, componentKey: string): ObjectUsage[] {
  return pagesUsingObject(m, componentKey).map((p) => ({ path: p.path, name: p.path, type: p.type }));
}

const byTypeThenName = (a: ObjectUsage, b: ObjectUsage) =>
  a.type !== b.type ? (a.type === "static" ? -1 : 1) : a.name.localeCompare(b.name);

/** Fill in name / thumbnail / id from the `pages` table. Mutates and returns the list. */
export async function enrichUsages<T extends ObjectUsage>(usages: T[]): Promise<T[]> {
  if (usages.length === 0) return usages;
  const paths = Array.from(new Set(usages.flatMap((u) => homeAliases(u.path))));
  const { data } = await (supabase as any)
    .from("pages")
    .select("id,name,path,page_type,updated_at,thumbnail_updated_at,thumbnail_build_version,thumbnail_url,archived_at")
    .in("path", paths);
  const byPath = new Map<string, any>();
  for (const row of data ?? []) {
    if (row.archived_at) continue;
    byPath.set(pageKey(row.path), row);
  }
  for (const u of usages) {
    const row = byPath.get(pageKey(u.path));
    if (!row) continue;
    u.name = row.name || u.name;
    u.pageId = row.id;
    u.updated_at = row.updated_at;
    u.thumbnail_updated_at = row.thumbnail_updated_at ?? null;
    u.thumbnail_build_version = row.thumbnail_build_version ?? null;
    u.thumbnail_url = row.thumbnail_url ?? null;
    if (row.page_type === "landing" || row.page_type === "static") u.type = row.page_type;
  }
  return usages;
}

/** The pages that render the given object. */
export async function findObjectUsages(componentKey: string): Promise<ObjectUsage[]> {
  const m = await loadSiteManifest();
  const usages = usagesFromManifest(m, componentKey);
  await enrichUsages(usages);
  return uniquePageUsages(usages).sort(byTypeThenName);
}

export function uniquePageUsages<T extends { path: string; name: string }>(usages: T[]): T[] {
  const unique = new Map<string, T>();
  for (const usage of usages) {
    const key = pageKey(usage.path);
    const previous = unique.get(key);
    if (!previous || previous.name.startsWith("/")) unique.set(key, usage);
  }
  return [...unique.values()];
}

/** Usage rows for many component keys with a single database round-trip. */
export async function findAllObjectUsages(componentKeys: string[]): Promise<Map<string, ObjectUsage[]>> {
  const m = await loadSiteManifest();
  const perKey = new Map<string, ObjectUsage[]>();
  const flat: ObjectUsage[] = [];
  for (const key of componentKeys) {
    const usages = usagesFromManifest(m, key);
    perKey.set(key, usages);
    flat.push(...usages);
  }
  await enrichUsages(flat);
  for (const [k, list] of perKey) perKey.set(k, [...list].sort(byTypeThenName));
  return perKey;
}
