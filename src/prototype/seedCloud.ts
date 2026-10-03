import { supabase } from "@/integrations/supabase/client";
import { db } from "./engine";
import { seedPrototypeData } from "./seed";

/**
 * One-time starter content: if the database has no pages yet, copy the demo
 * pages, objects, pictures, videos and labels into it. Runs at most once per
 * browser session and never touches a database that already has pages.
 */
const ORDER = ["tags", "pages", "object_registry", "objects", "images", "videos",
  "object_page_usages", "image_page_usages", "page_redirects"];

let started = false;
export async function seedCloudIfEmpty() {
  if (started) return;
  started = true;
  const sb = supabase as any;
  const { count, error } = await sb.from("pages").select("id", { count: "exact", head: true });
  if (error || (count ?? 0) > 0) return;
  seedPrototypeData();
  const ids: Record<string, Set<string>> = {};
  for (const t of ORDER) {
    const rows = (db[t] ?? []).map((r) => {
      const c: any = { ...r };
      if (t === "pages") {
        c.page_type = c.page_type === "Landing page" || String(c.path).startsWith("/landing/") ? "landing" : "static";
        c.status = c.page_type === "landing" ? "published" : "draft";
        c.slug_id = null;
      }
      if (t === "videos") c.source_type = "youtube";
      return c;
    }).filter((r: any) => {
      if (t === "images") return !String(r.web_url).startsWith("/src/");
      if (t === "object_page_usages") return ids.pages?.has(r.page_id) && ids.object_registry?.has(r.object_registry_id);
      if (t === "image_page_usages") return ids.pages?.has(r.page_id) && ids.images?.has(r.image_id);
      return true;
    });
    if (!rows.length) continue;
    const { count: existing } = await sb.from(t).select("*", { count: "exact", head: true });
    if ((existing ?? 0) > 0 && !t.endsWith("usages")) {
      const { data } = await sb.from(t).select("id");
      ids[t] = new Set((data ?? []).map((r: any) => r.id));
      continue;
    }
    const { error: e } = await sb.from(t).insert(rows);
    if (e) console.warn(`[seed] ${t}:`, e.message);
    else ids[t] = new Set(rows.map((r: any) => r.id));
  }
  if (ids.pages?.size) window.location.reload();
}
