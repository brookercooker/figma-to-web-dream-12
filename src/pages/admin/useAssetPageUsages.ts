/**
 * Live "Used On" data for Images and Videos.
 *
 * Same pattern as `useObjectPageUsages`:
 *   - The DB tables `image_page_usages` and `video_page_usages` are the
 *     runtime source of truth.
 *   - On mount / when the asset set changes, we reconcile them against a
 *     build-time code scan (assetUsages.ts) so counts stay fresh without
 *     waiting on a full rebuild.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  findAllImageUsages,
  findAllVideoUsages,
  type AssetUsage,
  type ImageAssetLike,
  type VideoAssetLike,
} from "./assetUsages";

const IMG_QUERY_KEY = ["admin", "image_page_usages"] as const;
const VID_QUERY_KEY = ["admin", "video_page_usages"] as const;

type UsageMap = Map<string, AssetUsage[]>;

interface UsageTable {
  assetIdCol: "image_id" | "video_id";
  table: "image_page_usages" | "video_page_usages";
}

const IMG: UsageTable = { assetIdCol: "image_id", table: "image_page_usages" };
const VID: UsageTable = { assetIdCol: "video_id", table: "video_page_usages" };

async function fetchLiveUsages(cfg: UsageTable): Promise<UsageMap> {
  // Manual join — supabase relationship embeds only work with declared FKs;
  // we do a two-step query so this works regardless of pgrst schema cache.
  const { data: rows, error } = await (supabase as any).from(cfg.table).select("*");
  if (error) throw error;
  const links = (rows ?? []) as Array<Record<string, string>>;
  if (links.length === 0) return new Map();
  const pageIds = Array.from(new Set(links.map((r) => r.page_id)));
  const { data: pages } = await (supabase as any)
    .from("pages")
    .select("id,name,path,page_type,updated_at,thumbnail_updated_at,thumbnail_build_version,thumbnail_url,archived_at")
    .in("id", pageIds);
  const byPageId = new Map<string, any>();
  for (const p of (pages ?? [])) byPageId.set(p.id, p);

  const map: UsageMap = new Map();
  for (const link of links) {
    const p = byPageId.get(link.page_id);
    if (!p || p.archived_at) continue;
    const usage: AssetUsage = {
      path: p.path,
      name: p.name || p.path,
      type: p.page_type === "landing" ? "landing" : "static",
      pageId: p.id,
      updated_at: p.updated_at,
      thumbnail_updated_at: p.thumbnail_updated_at,
      thumbnail_build_version: p.thumbnail_build_version,
      thumbnail_url: p.thumbnail_url,
    };
    const assetId = link[cfg.assetIdCol];
    const list = map.get(assetId) ?? [];
    list.push(usage);
    map.set(assetId, list);
  }
  for (const [k, list] of map) {
    map.set(k, [...list].sort((a, b) =>
      a.type !== b.type ? (a.type === "static" ? -1 : 1) : a.name.localeCompare(b.name)));
  }
  return map;
}

async function reconcile(
  cfg: UsageTable,
  assets: Array<{ id: string }>,
  scanned: UsageMap,
): Promise<{ inserted: number; deleted: number }> {
  if (assets.length === 0) return { inserted: 0, deleted: 0 };

  const desired = new Set<string>();
  for (const [assetId, list] of scanned) {
    for (const u of list) if (u.pageId) desired.add(`${assetId}::${u.pageId}`);
  }

  const { data: current, error } = await (supabase as any)
    .from(cfg.table)
    .select(`${cfg.assetIdCol},page_id`)
    .in(cfg.assetIdCol, assets.map((a) => a.id));
  if (error) return { inserted: 0, deleted: 0 };

  const existing = new Set<string>(
    (current ?? []).map((r: any) => `${r[cfg.assetIdCol]}::${r.page_id}`),
  );

  const toInsert: any[] = [];
  for (const k of desired) {
    if (existing.has(k)) continue;
    const [assetId, pageId] = k.split("::");
    toInsert.push({ [cfg.assetIdCol]: assetId, page_id: pageId });
  }
  const toDelete: Array<{ a: string; p: string }> = [];
  for (const k of existing) {
    if (desired.has(k)) continue;
    const [a, p] = k.split("::");
    toDelete.push({ a, p });
  }

  if (toInsert.length > 0) {
    await (supabase as any).from(cfg.table).insert(toInsert);
  }
  for (const row of toDelete) {
    await (supabase as any).from(cfg.table).delete()
      .eq(cfg.assetIdCol, row.a).eq("page_id", row.p);
  }
  return { inserted: toInsert.length, deleted: toDelete.length };
}

export function useImagePageUsages(images: ImageAssetLike[]) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: IMG_QUERY_KEY,
    queryFn: () => fetchLiveUsages(IMG),
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const sig = images.map((i) => i.id).sort().join("|");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const scanned = await findAllImageUsages(images);
        if (cancelled) return;
        const res = await reconcile(IMG, images, scanned);
        if (cancelled) return;
        if (res.inserted > 0 || res.deleted > 0) {
          qc.invalidateQueries({ queryKey: IMG_QUERY_KEY });
        }
      } catch { /* best-effort */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return query;
}

export function useVideoPageUsages(videos: VideoAssetLike[]) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: VID_QUERY_KEY,
    queryFn: () => fetchLiveUsages(VID),
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const sig = videos.map((v) => v.id).sort().join("|");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const scanned = await findAllVideoUsages(videos);
        if (cancelled) return;
        const res = await reconcile(VID, videos, scanned);
        if (cancelled) return;
        if (res.inserted > 0 || res.deleted > 0) {
          qc.invalidateQueries({ queryKey: VID_QUERY_KEY });
        }
      } catch { /* best-effort */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return query;
}

export const IMAGE_PAGE_USAGES_QUERY_KEY = IMG_QUERY_KEY;
export const VIDEO_PAGE_USAGES_QUERY_KEY = VID_QUERY_KEY;
