import { supabase } from "@/prototype/client";
import { reservedPrefixFor } from "../reservedPaths";
import type { WorkingPage } from "./DesignChatContext";
import { syncManifestPages } from "../manifestPageSync";

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