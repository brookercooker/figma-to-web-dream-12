// Build-time code scan for image/video usage across app pages.
//
// Model (mirrors objectUsages.ts):
//   1) Eagerly load raw source of every project .tsx (shared with objectUsages).
//   2) For each asset, determine a set of "needles" (distinctive strings) that
//      would appear in source when the asset is embedded on a page.
//      - Images: web_path, original_path, and (as a last resort) filename.
//      - Videos (upload): storage_path.
//      - Videos (external): external_video_id, external_url.
//   3) Use the same App.tsx route table as objects to map matched source files
//      → route paths, then enrich with DB `pages` rows.
//
// The DB tables `image_page_usages` and `video_page_usages` are reconciled to
// the scan on the client so counts stay fresh without a rebuild — same pattern
// as `object_page_usages`.

import { supabase } from "@/prototype/client";
import { parseAppRoutes, rawFiles, type ObjectUsage } from "./objectUsages";

export type AssetUsage = ObjectUsage;

// Files that shouldn't be scanned: admin UI, route shell, self.
function isScannable(file: string): boolean {
  if (file.includes("/pages/admin/")) return false;
  if (file.endsWith("/App.tsx")) return false;
  if (file.endsWith("/pages/ObjectRoute.tsx")) return false;
  return true;
}

// Build a stable list of scannable [file, text] tuples once.
const scannableFiles: Array<[string, string]> = Object.entries(rawFiles)
  .filter(([f]) => isScannable(f));

// Also precompute lowercase for filename fallback matching (basename search
// is only used when other, more distinctive needles are absent).
const scannableFilesLower: Array<[string, string]> = scannableFiles.map(
  ([f, s]) => [f, s.toLowerCase()],
);

export interface ImageAssetLike {
  id: string;
  slug_id?: string | null;
  filename?: string | null;
  web_path?: string | null;
  original_path?: string | null;
}

export interface VideoAssetLike {
  id: string;
  slug_id?: string | null;
  name?: string | null;
  source_type?: string | null;
  storage_path?: string | null;
  external_video_id?: string | null;
  external_url?: string | null;
}

/** Distinctive strings whose presence in a source file means the asset is used. */
function imageNeedles(a: ImageAssetLike): string[] {
  const out = new Set<string>();
  if (a.web_path) {
    out.add(a.web_path);
    // Just the basename (after last "/")
    const base = a.web_path.split("/").pop();
    if (base) out.add(base);
  }
  if (a.original_path) {
    out.add(a.original_path);
    const base = a.original_path.split("/").pop();
    if (base) out.add(base);
  }
  return [...out].filter((n) => n.length >= 8);
}

function videoNeedles(a: VideoAssetLike): string[] {
  const out = new Set<string>();
  if (a.storage_path) {
    out.add(a.storage_path);
    const base = a.storage_path.split("/").pop();
    if (base) out.add(base);
  }
  if (a.external_video_id) out.add(a.external_video_id);
  if (a.external_url) out.add(a.external_url);
  return [...out].filter((n) => n.length >= 6);
}

function matchedFilesFor(needles: string[]): Set<string> {
  const hit = new Set<string>();
  if (needles.length === 0) return hit;
  const lc = needles.map((n) => n.toLowerCase());
  for (const [file, srcLower] of scannableFilesLower) {
    for (const n of lc) {
      if (srcLower.includes(n)) { hit.add(file); break; }
    }
  }
  return hit;
}

function usagesFromMatchedFiles(matched: Set<string>): AssetUsage[] {
  if (matched.size === 0) return [];
  const routes = parseAppRoutes();
  const seen = new Set<string>();
  const out: AssetUsage[] = [];
  for (const r of routes) {
    if (!matched.has(r.file)) continue;
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    const type: "static" | "landing" = r.path.startsWith("/landing/") ? "landing" : "static";
    out.push({ path: r.path, name: r.path, type });
  }
  return out;
}

async function enrichUsages(all: AssetUsage[]): Promise<void> {
  if (all.length === 0) return;
  const paths = Array.from(new Set(all.map((u) => u.path)));
  const { data } = await (supabase as any)
    .from("pages")
    .select("id,name,path,page_type,updated_at,thumbnail_updated_at,thumbnail_build_version,thumbnail_url,archived_at")
    .in("path", paths);
  const byPath = new Map<string, any>();
  for (const row of (data ?? [])) {
    if (row.archived_at) continue;
    byPath.set(row.path, row);
  }
  for (const u of all) {
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
}

function sortUsages(list: AssetUsage[]): AssetUsage[] {
  return [...list].sort((a, b) =>
    a.type !== b.type ? (a.type === "static" ? -1 : 1) : a.name.localeCompare(b.name));
}

export async function findAllImageUsages(
  images: ImageAssetLike[],
): Promise<Map<string, AssetUsage[]>> {
  const perId = new Map<string, AssetUsage[]>();
  for (const img of images) {
    const needles = imageNeedles(img);
    const matched = matchedFilesFor(needles);
    perId.set(img.id, usagesFromMatchedFiles(matched));
  }
  const flat: AssetUsage[] = [];
  for (const list of perId.values()) flat.push(...list);
  await enrichUsages(flat);
  for (const [k, v] of perId) perId.set(k, sortUsages(v));
  return perId;
}

export async function findAllVideoUsages(
  videos: VideoAssetLike[],
): Promise<Map<string, AssetUsage[]>> {
  const perId = new Map<string, AssetUsage[]>();
  for (const vid of videos) {
    const needles = videoNeedles(vid);
    const matched = matchedFilesFor(needles);
    perId.set(vid.id, usagesFromMatchedFiles(matched));
  }
  const flat: AssetUsage[] = [];
  for (const list of perId.values()) flat.push(...list);
  await enrichUsages(flat);
  for (const [k, v] of perId) perId.set(k, sortUsages(v));
  return perId;
}
