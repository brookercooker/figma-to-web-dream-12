import { supabase } from "@/integrations/supabase/client";
import { toRouteSlug } from "./slug";

/**
 * Shared helpers for renaming Objects and Landing Pages with cascading updates.
 *
 * Naming rules mirror the DB `generate_slug_id` function: lowercase kebab-case,
 * a–z / 0–9 / dashes only, max 60 chars.
 */

export function normalizeSlug(input: string): string {
  return toRouteSlug(input);
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) && s.length <= 60;
}

/** Validate a human-readable name. Empty and control chars are rejected. */
export function isValidName(name: string): boolean {
  const s = (name ?? "").trim();
  if (!s || s.length > 80) return false;
  // eslint-disable-next-line no-control-regex
  return !/[\u0000-\u001F<>]/.test(s);
}

// ---------- Objects ----------

export async function objectNameTaken(name: string, excludeId?: string): Promise<boolean> {
  const trimmed = name.trim();
  let q = (supabase as any)
    .from("object_registry")
    .select("id")
    .ilike("name", trimmed);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return !!(data && data.length);
}

export async function objectSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  let q = (supabase as any).from("object_registry").select("id").eq("slug_id", slug);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return !!(data && data.length);
}

export async function renameObject(params: {
  id: string;
  newName: string;
  newSlug: string;
}): Promise<void> {
  const { id, newName, newSlug } = params;
  const name = newName.trim();
  const slug = newSlug.trim();
  if (!isValidName(name)) throw new Error("Name is empty or contains invalid characters.");
  if (!isValidSlug(slug)) throw new Error("URL slug must be lowercase letters, numbers, and dashes.");
  if (await objectNameTaken(name, id)) throw new Error(`Another object is already named "${name}".`);
  if (await objectSlugTaken(slug, id)) throw new Error(`The URL "/objects/${slug}" is already in use.`);
  const { error } = await (supabase as any)
    .from("object_registry")
    .update({ name, slug_id: slug })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Landing Pages ----------

export async function landingPathTaken(path: string, excludeId?: string): Promise<boolean> {
  let q = (supabase as any).from("pages").select("id").eq("path", path);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return !!(data && data.length);
}

export async function landingNameTaken(name: string, excludeId?: string): Promise<boolean> {
  const trimmed = name.trim();
  let q = (supabase as any)
    .from("pages")
    .select("id")
    .eq("page_type", "landing")
    .ilike("name", trimmed);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.limit(1);
  return !!(data && data.length);
}

/**
 * Rename a landing page. If the slug changes, updates `path` + `slug_id` and
 * inserts a redirect from the old path to the new one so previously shared
 * links keep working. Any existing redirects that already targeted the old
 * path are updated to point at the new path (chain compression).
 */
export async function renameLanding(params: {
  id: string;
  currentPath: string;
  newName: string;
  newSlug: string;
}): Promise<{ path: string; slug: string; redirected: boolean }> {
  const { id, currentPath, newName, newSlug } = params;
  const name = newName.trim();
  const slug = newSlug.trim();
  if (!isValidName(name)) throw new Error("Name is empty or contains invalid characters.");
  if (!isValidSlug(slug)) throw new Error("URL slug must be lowercase letters, numbers, and dashes.");
  const newPath = `/landing/${slug}`;

  if (await landingNameTaken(name, id)) throw new Error(`Another landing page is already named "${name}".`);
  if (newPath !== currentPath && (await landingPathTaken(newPath, id))) {
    throw new Error(`The URL "${newPath}" is already in use.`);
  }

  const { error } = await (supabase as any)
    .from("pages")
    .update({ name, path: newPath, slug_id: slug })
    .eq("id", id);
  if (error) throw error;

  let redirected = false;
  if (newPath !== currentPath) {
    // If the new path was itself an old redirect target, remove that stale
    // self-redirect (would otherwise create an infinite loop).
    await (supabase as any).from("page_redirects").delete().eq("from_path", newPath);

    // Point any existing redirects that resolved to the old path at the new one.
    await (supabase as any)
      .from("page_redirects")
      .update({ to_path: newPath })
      .eq("to_path", currentPath);

    // Upsert the old→new redirect so repeat renames don't error.
    await (supabase as any)
      .from("page_redirects")
      .upsert(
        { from_path: currentPath, to_path: newPath, page_id: id },
        { onConflict: "from_path" },
      );
    redirected = true;
  }

  return { path: newPath, slug, redirected };
}
