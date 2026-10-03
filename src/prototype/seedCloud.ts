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
  for (const t of ORDER) {
    const rows = (db[t] ?? []).map((r) => {
      const { ...copy } = r;
      return copy;
    });
    if (!rows.length) continue;
    const { error: e } = await sb.from(t).insert(rows);
    if (e) console.warn(`[seed] ${t}:`, e.message);
  }
  window.location.reload();
}
