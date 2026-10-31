import { supabase } from "@/prototype/client";
import { isInternalPath, pageKey } from "./registerPage";

export interface PreviewContent {
  pages: { path: string; content: unknown; inline_edits: unknown }[];
  objects: { id: string; name: string; component_key: string | null; content: unknown; inline_edits: unknown; site_wide: boolean }[];
}
/** Same inclusion rules as the public package: Ready pages and every unarchived object. */
export function previewContentPayload(pages: any[], objects: any[]): PreviewContent {
  const byPath = new Map<string, PreviewContent["pages"][number]>();
  for (const p of [...pages].sort((a, b) => a.path === "/" ? 1 : b.path === "/" ? -1 : 0)) {
    if (p.archived_at || p.build_status !== "ready" || typeof p.path !== "string" || isInternalPath(p.path)) continue;
    const path = pageKey(p.path);
    byPath.set(path, { path, content: p.content ?? [], inline_edits: p.inline_edits ?? {} });
  }
  return {
    pages: [...byPath.values()],
    objects: objects.filter(o => !o.archived_at).map(o => ({ id: o.id, name: o.name, component_key: o.component_key ?? null, content: o.content ?? [], inline_edits: o.inline_edits ?? {}, site_wide: !!o.site_wide })),
  };
}
export async function loadPreviewContent(): Promise<PreviewContent> {
  const [pages, objects] = await Promise.all([
    supabase.from("pages").select("path,content,inline_edits,build_status,archived_at").is("archived_at", null).eq("build_status", "ready"),
    supabase.from("object_registry").select("id,name,component_key,content,inline_edits,site_wide,archived_at").is("archived_at", null),
  ]);
  if (pages.error || objects.error) throw new Error("Saved preview content could not be read.");
  return previewContentPayload(pages.data ?? [], objects.data ?? []);
}