import { supabase } from "@/prototype/client";
import { toast } from "sonner";
import { loadSiteManifest, type SiteManifestPage } from "./siteManifest";
import { normalizePreviewPath, pageToRegister, pageRow, pageSlugSuffix } from "./designChat/registerPage";

export const PAGES_SYNCED = "nova-pages-synced";
const alias = (path: string) => normalizePreviewPath(path) === "/home" ? "/" : normalizePreviewPath(path);

/** Pure row planning: archived records are deliberately included in existingRows. */
export function missingPageRows(manifestPages: Pick<SiteManifestPage, "path" | "type">[], existingRows: { path: string }[]) {
  const existing = new Set(existingRows.map((row) => alias(row.path)));
  return manifestPages.flatMap((page) => {
    const path = normalizePreviewPath(page.path);
    if (path.includes(":")) return [];
    if (existing.has(alias(path))) return [];
    const candidate = pageToRegister(page.type === "landing" ? path.replace(/^\/landing\//, "/") : path);
    if (!candidate) return [];
    existing.add(alias(path));
    // Deterministic planning; actual random suffixes are assigned immediately before insertion.
    let hash = 0;
    for (const char of path) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return [pageRow({ name: candidate.name, path }, page.type, (hash & 0xffffff).toString(16).padStart(6, "0"))];
  });
}

export function buildOnce() {
  const done = new Set<string>();
  const pending = new Map<string, Promise<void>>();
  return (id: string, run: () => Promise<void>) => {
    if (done.has(id)) return Promise.resolve();
    const active = pending.get(id);
    if (active) return active;
    const request = run().then(() => { done.add(id); }).finally(() => pending.delete(id));
    pending.set(id, request);
    return request;
  };
}
const once = buildOnce();

export async function syncManifestPages() {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;
    const manifest = await loadSiteManifest();
    await once(manifest.buildId || manifest.generatedAt, async () => {
      const { data: existing, error } = await (supabase as any).from("pages").select("path");
      if (error) throw error;
      const planned = missingPageRows(manifest.pages, existing ?? []);
      if (!planned.length) return;
      const rows = planned.map((row) => pageRow({ name: row.name, path: row.path }, row.page_type, pageSlugSuffix()));
      const result = await (supabase as any).from("pages").upsert(rows, { onConflict: "path", ignoreDuplicates: true }).select("id,name,path");
      if (result.error && result.error.code !== "23505") throw result.error;
      const added = result.data ?? [];
      if (!added.length) return;
      window.dispatchEvent(new Event(PAGES_SYNCED));
      const names = added.slice(0, 3).map((row: { name: string }) => row.name).join(", ");
      toast.success(`Added ${added.length} new pages to the Pages list: ${names}${added.length > 3 ? ` and ${added.length - 3} more` : ""}`);
    });
  } catch { /* Quiet failure: a later load, tab opening or rebuild retries. */ }
}