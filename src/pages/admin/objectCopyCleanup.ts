import { supabase } from "@/prototype/client";

/** Await the query: an unconsumed PostgREST delete builder never sends a request. */
export async function cleanupObjectCopies(ids: readonly string[]): Promise<string[]> {
  if (!ids.length) return [];
  const { data: pages, error } = await supabase.from("pages").select("content,inline_edits");
  if (error) throw new Error("Couldn't check whether the copies are still used.");
  const unused = ids.filter(id => !(pages ?? []).some((page: { content: unknown; inline_edits: unknown }) =>
    JSON.stringify([page.content, page.inline_edits]).includes(id)));
  if (unused.length) {
    const { error: deleteError } = await supabase.from("object_registry").delete().in("id", unused);
    if (deleteError) throw new Error("Couldn't remove the unused copies. Try again.");
  }
  return unused;
}