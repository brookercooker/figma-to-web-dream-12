// Which pages use an image or a video, from the public site's manifest (see siteManifest.ts).
//
// For each asset we work out a few distinctive strings that appear wherever it is used (its storage path, its file name,
// an external video id) and ask the manifest which pages' files contain one of them. A page's files include the objects
// it renders, so an image inside an object counts for every page that shows that object.
//
// The tables `image_page_usages` and `video_page_usages` are reconciled to this on the client so counts stay fresh
// without a rebuild (see useAssetPageUsages.ts). If the manifest can't be read these functions throw
// SiteManifestUnavailable and callers must treat usage as unknown.

import { loadSiteManifest, pagesReferencing, type SiteManifest } from "./siteManifest";
import { enrichUsages, type ObjectUsage } from "./objectUsages";

export type AssetUsage = ObjectUsage;

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

/** Distinctive strings whose presence in a page's files means the asset is used. */
export function imageNeedles(a: ImageAssetLike): string[] {
  const out = new Set<string>();
  if (a.web_path) {
    out.add(a.web_path);
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

export function videoNeedles(a: VideoAssetLike): string[] {
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

function usagesFor(m: SiteManifest, needles: string[]): AssetUsage[] {
  return pagesReferencing(m, needles).map((p) => ({ path: p.path, name: p.path, type: p.type }));
}

const sortUsages = (list: AssetUsage[]) =>
  [...list].sort((a, b) => (a.type !== b.type ? (a.type === "static" ? -1 : 1) : a.name.localeCompare(b.name)));

async function findAll<T extends { id: string }>(assets: T[], needlesOf: (a: T) => string[]): Promise<Map<string, AssetUsage[]>> {
  const m = await loadSiteManifest();
  const perId = new Map<string, AssetUsage[]>();
  const flat: AssetUsage[] = [];
  for (const a of assets) {
    const list = usagesFor(m, needlesOf(a));
    perId.set(a.id, list);
    flat.push(...list);
  }
  await enrichUsages(flat);
  for (const [k, v] of perId) perId.set(k, sortUsages(v));
  return perId;
}

export const findAllImageUsages = (images: ImageAssetLike[]) => findAll(images, imageNeedles);
export const findAllVideoUsages = (videos: VideoAssetLike[]) => findAll(videos, videoNeedles);
