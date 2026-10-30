import { supabase } from "@/prototype/client";

/** Update one page or object row and confirm the database actually stored it.
 * An update the database silently skips (no permission, row missing) comes back as an error, never as success. */
export async function saveRow(table: "pages" | "object_registry", patch: Record<string, unknown>, id: string): Promise<{ error: { message: string } | null }> {
  try {
    const { data, error } = await (supabase as any).from(table).update(patch).eq("id", id).select("id");
    if (error) return { error: { message: error.message ?? "Couldn't save your changes." } };
    if (!Array.isArray(data) || data.length === 0) return { error: { message: "Your changes weren't saved: the database didn't accept them. Please try again or sign in again." } };
    return { error: null };
  } catch (e) {
    return { error: { message: e instanceof Error ? `Your changes weren't saved: ${e.message}` : "Your changes weren't saved. Please try again." } };
  }
}

/** Names of objects in `blocks` whose saved status isn't Ready (they don't show in the preview yet). */
export async function notReadyObjectNames(blocks: unknown[]): Promise<string[]> {
  const ids = [...new Set(blocks.flatMap((b: any) => (b?.type === "object" && b.objectId ? [b.objectId as string] : [])))];
  if (!ids.length) return [];
  const { data } = await (supabase as any).from("object_registry").select("id,name,status").in("id", ids);
  return ((data ?? []) as { name: string; status: string }[]).filter((o) => o.status !== "Ready").map((o) => o.name);
}
