import { supabase } from "@/prototype/client";
import { reservedPrefixFor } from "../reservedPaths";
import type { WorkingPage } from "./DesignChatContext";
import { syncManifestPages } from "../manifestPageSync";
import { orderedManualPages, type ManualPage } from "./manualPageNavigation";

export function workingPageFrom(page: WorkingPage): WorkingPage {
  return { id: page.id, name: page.name, path: page.path.startsWith("/") ? page.path : `/${page.path}` };
}

/** The same live page rows used by Pages, without thumbnails or editing side effects. */
export async function loadModePages(): Promise<WorkingPage[]> {
  await syncManifestPages();
  const { data, error } = await supabase.from("pages").select("id,name,path,archived_at").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter((page) => !page.archived_at && page.path && page.path !== "*" && !reservedPrefixFor(page.path)).map(workingPageFrom);
}

/** Includes draft landing pages; unlike the initial mode chooser, /landing is allowed. */
export async function loadManualPages(): Promise<ManualPage[]> {
  await syncManifestPages();
  const { data, error } = await supabase.from("pages").select("id,name,path,page_type,build_status,archived_at").order("name", { ascending: true });
  if (error) throw error;
  return orderedManualPages((data ?? []).filter(page => {
    const reserved = reservedPrefixFor(page.path);
    return !page.archived_at && page.path && page.path !== "*" &&
      (page.page_type === "static" || page.page_type === "landing" || !page.page_type) &&
      (!reserved || (reserved === "/landing" && page.page_type === "landing"));
  }).map(page => ({ ...workingPageFrom(page), id: page.id, page_type: page.page_type ?? "static", build_status: page.build_status })));
}