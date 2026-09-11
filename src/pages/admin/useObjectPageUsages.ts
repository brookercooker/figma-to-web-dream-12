/**
 * Live "Used On" data for Objects.
 *
 * Truth model:
 *   - The `object_page_usages` table (object_registry_id ↔ page_id) is the
 *     runtime source of truth.
 *   - The build-time code scan (objectUsages.ts) is used only to *seed and
 *     reconcile* that table so it converges without manual data entry.
 *
 * The Objects tab reads from the DB via `useObjectPageUsages` (which mirrors
 * the shape returned by `findAllObjectUsages`) and fires a background
 * reconcile on mount / window focus / manual refresh so the counts refresh
 * quickly — without waiting for a full rebuild + deploy cycle.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/prototype/client";
import { findAllObjectUsages, type ObjectUsage } from "./objectUsages";

const QUERY_KEY = ["admin", "object_page_usages"] as const;

type UsageMap = Map<string, ObjectUsage[]>;

/**
 * Fetch the current object → page mappings from the DB and shape them the
 * same way the legacy code-scan helper did (keyed by component_key).
 */
async function fetchLiveUsages(): Promise<UsageMap> {
  const { data, error } = await (supabase as any)
    .from("object_page_usages")
    .select(`
      object_registry_id,
      page_id,
      object_registry:object_registry_id ( id, component_key ),
      pages:page_id (
        id, name, path, page_type, updated_at,
        thumbnail_updated_at, thumbnail_build_version, thumbnail_url, archived_at
      )
    `);
  if (error) throw error;

  const map: UsageMap = new Map();
  for (const row of (data ?? [])) {
    const key = row.object_registry?.component_key;
    const page = row.pages;
    if (!key || !page || page.archived_at) continue;
    const usage: ObjectUsage = {
      path: page.path,
      name: page.name || page.path,
      type: page.page_type === "landing" ? "landing" : "static",
      pageId: page.id,
      updated_at: page.updated_at,
      thumbnail_updated_at: page.thumbnail_updated_at,
      thumbnail_build_version: page.thumbnail_build_version,
      thumbnail_url: page.thumbnail_url,
    };
    const list = map.get(key) ?? [];
    list.push(usage);
    map.set(key, list);
  }
  for (const [k, list] of map) {
    map.set(k, [...list].sort((a, b) =>
      a.type !== b.type ? (a.type === "static" ? -1 : 1) : a.name.localeCompare(b.name)));
  }
  return map;
}

/**
 * Diff the current DB mappings against what the code scan says should exist
 * for the given set of (id, component_key) objects, then apply inserts /
 * deletes. Silent on failure — reconciliation is best-effort.
 */
export async function reconcileObjectPageUsages(
  objects: Array<{ id: string; component_key: string | null | undefined }>,
): Promise<{ inserted: number; deleted: number }> {
  const withKeys = objects.filter((o) => !!o.component_key) as Array<{ id: string; component_key: string }>;
  if (withKeys.length === 0) return { inserted: 0, deleted: 0 };

  const keys = Array.from(new Set(withKeys.map((o) => o.component_key)));
  const scanned = await findAllObjectUsages(keys);

  // Map component_key → object_registry.id (there can be multiple objects
  // sharing a component_key when a user has cloned; every one gets linked).
  const idsByKey = new Map<string, string[]>();
  for (const o of withKeys) {
    const arr = idsByKey.get(o.component_key) ?? [];
    arr.push(o.id);
    idsByKey.set(o.component_key, arr);
  }

  // Desired: Set<`${object_registry_id}::${page_id}`>
  const desired = new Set<string>();
  for (const [key, usages] of scanned) {
    const objIds = idsByKey.get(key) ?? [];
    for (const u of usages) {
      if (!u.pageId) continue;
      for (const oid of objIds) desired.add(`${oid}::${u.pageId}`);
    }
  }

  // Current rows for those object_registry ids only, so we never touch rows
  // that belong to unrelated objects.
  const { data: currentRows, error: readErr } = await (supabase as any)
    .from("object_page_usages")
    .select("object_registry_id,page_id")
    .in("object_registry_id", withKeys.map((o) => o.id));
  if (readErr) return { inserted: 0, deleted: 0 };

  const current = new Set<string>(
    (currentRows ?? []).map((r: any) => `${r.object_registry_id}::${r.page_id}`),
  );

  const toInsert: Array<{ object_registry_id: string; page_id: string }> = [];
  for (const k of desired) {
    if (current.has(k)) continue;
    const [object_registry_id, page_id] = k.split("::");
    toInsert.push({ object_registry_id, page_id });
  }
  const toDelete: Array<{ object_registry_id: string; page_id: string }> = [];
  for (const k of current) {
    if (desired.has(k)) continue;
    const [object_registry_id, page_id] = k.split("::");
    toDelete.push({ object_registry_id, page_id });
  }

  if (toInsert.length > 0) {
    await (supabase as any).from("object_page_usages").insert(toInsert);
  }
  for (const row of toDelete) {
    await (supabase as any)
      .from("object_page_usages")
      .delete()
      .eq("object_registry_id", row.object_registry_id)
      .eq("page_id", row.page_id);
  }
  return { inserted: toInsert.length, deleted: toDelete.length };
}

/**
 * Hook: returns Map<component_key, ObjectUsage[]> from live DB data, and
 * kicks off a background reconcile against the code scan whenever the list
 * of objects changes so the DB catches up without a rebuild.
 */
export function useObjectPageUsages(
  objects: Array<{ id: string; component_key: string | null | undefined }>,
) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchLiveUsages,
    // Short staleTime + refetch triggers so "Used On" updates promptly after
    // content changes without a hard page reload.
    staleTime: 15_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Reconcile whenever the set of objects/component_keys changes. Fire and
  // forget — invalidate on completion so the UI picks up any diffs.
  const signature = objects
    .filter((o) => !!o.component_key)
    .map((o) => `${o.id}:${o.component_key}`)
    .sort()
    .join("|");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await reconcileObjectPageUsages(objects);
        if (cancelled) return;
        if (res.inserted > 0 || res.deleted > 0) {
          qc.invalidateQueries({ queryKey: QUERY_KEY });
        }
      } catch {
        /* best-effort */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return query;
}

export const OBJECT_PAGE_USAGES_QUERY_KEY = QUERY_KEY;
