import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/prototype/client";
import { pickLeastUsedColor } from "./labelColors";
import { LABEL_SEP, MAX_DEPTH, joinPath, rewritePath, validateLeafName } from "./labelPath";

/**
 * Labels are scoped PER TOOL. A label created for Images does not appear
 * in Static Pages, Landing Pages, Objects, or Videos. Static Pages and
 * Landing Pages are separate scopes even though they share a table.
 */
export type LabelScope =
  | "static"
  | "landing"
  | "objects"
  | "images"
  | "videos"
  | "links";

export interface LabelRow {
  id: string;
  name: string;               // leaf name
  parent_id: string | null;
  depth: number;              // 0-based (root=0)
  color_index: number | null;
  /** Fully qualified path, e.g. "photos/interior/kitchen". */
  path: string;
}

/**
 * Map of items table + array column per scope.  Used by the cascade
 * helpers when we rename/reparent/delete a label so item strings stay
 * in sync.
 */
const SCOPE_TABLES: Record<LabelScope, { table: string; col: string; extraEq?: [string, string] }> = {
  static:  { table: "pages",             col: "tags",   extraEq: ["page_type", "static"] },
  landing: { table: "pages",             col: "tags",   extraEq: ["page_type", "landing"] },
  objects: { table: "object_registry",   col: "labels" },
  images:  { table: "images",            col: "tags" },
  videos:  { table: "videos",            col: "tags" },
  links:   { table: "link_audit_rows",   col: "tags" },
};

/** All labels registered in one tool's scope, sorted deterministically as a tree. */
export function useLabelsForScope(scope: LabelScope) {
  return useQuery({
    queryKey: ["admin", "labels", scope],
    queryFn: async (): Promise<LabelRow[]> => {
      const { data, error } = await (supabase as any)
        .from("tags")
        .select("id,name,parent_id,depth,color_index")
        .eq("scope", scope);
      if (error) throw error;
      const rows = (data ?? []) as any[];
      const byId = new Map<string, any>(rows.map((r) => [r.id, r]));
      const pathFor = (id: string): string => {
        const segs: string[] = [];
        let cur: any = byId.get(id);
        while (cur) {
          segs.unshift(cur.name);
          cur = cur.parent_id ? byId.get(cur.parent_id) : null;
        }
        return joinPath(segs);
      };
      return rows
        .map<LabelRow>((r) => ({
          id: r.id,
          name: r.name,
          parent_id: r.parent_id ?? null,
          depth: r.depth ?? 0,
          color_index: r.color_index ?? null,
          path: pathFor(r.id),
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
    },
    staleTime: 30_000,
  });
}

/**
 * Register (or resolve) a label by PATH.  Creates any missing ancestors
 * with auto-picked colors.  Returns the row id of the leaf.
 */
export async function registerLabelPath(
  path: string,
  scope: LabelScope,
  colorIndex?: number,
): Promise<string | null> {
  const client: any = supabase;
  const segments = path.split(LABEL_SEP).filter(Boolean);
  if (!segments.length || segments.length > MAX_DEPTH) return null;
  let parentId: string | null = null;
  let lastId: string | null = null;
  for (let i = 0; i < segments.length; i++) {
    const name = segments[i].toLowerCase();
    const isLeaf = i === segments.length - 1;
    // look for existing
    let existing: any = null;
    if (parentId === null) {
      const { data } = await client
        .from("tags").select("id,color_index")
        .eq("scope", scope).eq("name", name).is("parent_id", null).maybeSingle();
      existing = data;
    } else {
      const { data } = await client
        .from("tags").select("id,color_index")
        .eq("scope", scope).eq("name", name).eq("parent_id", parentId).maybeSingle();
      existing = data;
    }
    if (existing) {
      lastId = existing.id;
      if (isLeaf && colorIndex != null && existing.color_index !== colorIndex) {
        await client.from("tags").update({ color_index: colorIndex }).eq("id", existing.id);
      }
    } else {
      const idx = colorIndex != null && isLeaf ? colorIndex : await autoAssignColor(scope);
      const { data, error } = await client
        .from("tags")
        .insert([{ name, scope, color_index: idx, parent_id: parentId }])
        .select("id").single();
      if (error) throw error;
      lastId = data.id;
    }
    parentId = lastId;
  }
  return lastId;
}

/** Set the color for a label (by id). */
export async function setLabelColorById(id: string, colorIndex: number) {
  await (supabase as any).from("tags").update({ color_index: colorIndex }).eq("id", id);
}

/**
 * Rename a label's leaf name. Enforces sibling uniqueness. Cascades the
 * new path onto every item in the same scope that referenced the label
 * or any of its descendants.
 */
export async function renameLabel(
  scope: LabelScope,
  row: LabelRow,
  newName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const err = validateLeafName(newName);
  if (err) return { ok: false, error: err };
  const trimmed = newName.trim().toLowerCase();
  if (trimmed === row.name) return { ok: true };
  const client: any = supabase;
  // Sibling uniqueness check
  const dup = row.parent_id
    ? await client.from("tags").select("id").eq("scope", scope).eq("parent_id", row.parent_id).eq("name", trimmed).maybeSingle()
    : await client.from("tags").select("id").eq("scope", scope).is("parent_id", null).eq("name", trimmed).maybeSingle();
  if (dup?.data) return { ok: false, error: `A sibling label named "${trimmed}" already exists.` };
  const oldPath = row.path;
  const segs = oldPath.split(LABEL_SEP);
  segs[segs.length - 1] = trimmed;
  const newPath = segs.join(LABEL_SEP);
  const { error } = await client.from("tags").update({ name: trimmed }).eq("id", row.id);
  if (error) return { ok: false, error: error.message };
  await cascadePathChange(scope, oldPath, newPath);
  return { ok: true };
}

/**
 * Move a label to a different parent (or to root when newParentId=null).
 * Blocks cycles and violations of MAX_DEPTH.  Cascades onto items.
 */
export async function reparentLabel(
  scope: LabelScope,
  row: LabelRow,
  newParentId: string | null,
  allRows: LabelRow[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newParentId === row.parent_id) return { ok: true };
  const byId = new Map(allRows.map((r) => [r.id, r]));
  // Cycle check
  let cur: LabelRow | undefined = newParentId ? byId.get(newParentId) : undefined;
  while (cur) {
    if (cur.id === row.id) return { ok: false, error: "Cannot move a label under one of its descendants." };
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  // Depth check — need max depth in subtree
  const subtreeMax = maxSubtreeDepth(row, allRows);
  const parentDepth = newParentId ? (byId.get(newParentId)?.depth ?? 0) : -1;
  const newLeafDepth = parentDepth + 1; // 0-based
  const additionalUnder = subtreeMax - row.depth;
  if (newLeafDepth + additionalUnder > MAX_DEPTH - 1) {
    return { ok: false, error: `This move would exceed the ${MAX_DEPTH}-level nesting limit.` };
  }
  // Sibling uniqueness
  const client: any = supabase;
  const dup = newParentId
    ? await client.from("tags").select("id").eq("scope", scope).eq("parent_id", newParentId).eq("name", row.name).maybeSingle()
    : await client.from("tags").select("id").eq("scope", scope).is("parent_id", null).eq("name", row.name).maybeSingle();
  if (dup?.data) return { ok: false, error: `A sibling label named "${row.name}" already exists under the chosen parent.` };
  const newParent = newParentId ? byId.get(newParentId) : null;
  const newPath = newParent ? newParent.path + LABEL_SEP + row.name : row.name;
  const oldPath = row.path;
  // Persist new parent_id.  Depth is fixed up by the DB trigger for this
  // row; descendants need their depths recalculated too.
  const { error } = await client.from("tags").update({ parent_id: newParentId }).eq("id", row.id);
  if (error) return { ok: false, error: error.message };
  // Fix descendant depths
  await refreshDescendantDepths(scope, row.id, newLeafDepth);
  await cascadePathChange(scope, oldPath, newPath);
  return { ok: true };
}

/**
 * Delete a label and promote its immediate children up one level to the
 * deleted label's parent.  Item tags for the deleted path are stripped;
 * descendants keep their tags with the parent segment removed.
 */
export async function deleteLabelPromoteChildren(scope: LabelScope, row: LabelRow, allRows: LabelRow[]) {
  const client: any = supabase;
  const children = allRows.filter((r) => r.parent_id === row.id);
  const oldPath = row.path;
  const parentPathStr = row.parent_id ? (allRows.find((r) => r.id === row.parent_id)?.path ?? "") : "";
  // Sibling-collision check: any child whose name collides with an existing sibling under the new parent?
  for (const c of children) {
    const clash = allRows.find(
      (r) => r.id !== c.id && r.parent_id === (row.parent_id ?? null) && r.name === c.name,
    );
    if (clash) {
      throw new Error(`Cannot promote children — "${c.name}" would collide with an existing sibling. Rename first.`);
    }
  }
  // Reparent children
  for (const c of children) {
    await client.from("tags").update({ parent_id: row.parent_id }).eq("id", c.id);
    await refreshDescendantDepths(scope, c.id, row.depth); // new leaf depth = removed row's depth
    const cNew = parentPathStr ? parentPathStr + LABEL_SEP + c.name : c.name;
    await cascadePathChange(scope, c.path, cNew);
  }
  // Now delete row
  await client.from("tags").delete().eq("id", row.id);
  // Strip old path (only the exact path, since descendants moved already)
  await stripExactPath(scope, oldPath);
}

/** Delete a label and every descendant, stripping all matching item tags. */
export async function deleteLabelSubtree(scope: LabelScope, row: LabelRow, allRows: LabelRow[]) {
  const client: any = supabase;
  const toDelete = allRows.filter((r) => r.path === row.path || r.path.startsWith(row.path + LABEL_SEP));
  await client.from("tags").delete().in("id", toDelete.map((r) => r.id));
  await stripSubtreePaths(scope, row.path);
}

// -------- internals --------

function maxSubtreeDepth(root: LabelRow, all: LabelRow[]): number {
  let m = root.depth;
  for (const r of all) {
    if (r.path === root.path || r.path.startsWith(root.path + LABEL_SEP)) {
      if (r.depth > m) m = r.depth;
    }
  }
  return m;
}

async function refreshDescendantDepths(scope: LabelScope, parentId: string, parentDepth: number) {
  const client: any = supabase;
  const { data } = await client
    .from("tags").select("id").eq("scope", scope).eq("parent_id", parentId);
  for (const r of (data ?? []) as any[]) {
    const d = parentDepth + 1;
    await client.from("tags").update({ depth: d }).eq("id", r.id);
    await refreshDescendantDepths(scope, r.id, d);
  }
}

async function cascadePathChange(scope: LabelScope, oldPath: string, newPath: string) {
  if (oldPath === newPath) return;
  const cfg = SCOPE_TABLES[scope];
  const client: any = supabase;
  let q = client.from(cfg.table).select(`id,${cfg.col}`);
  if (cfg.extraEq) q = q.eq(cfg.extraEq[0], cfg.extraEq[1]);
  const { data } = await q;
  for (const r of (data ?? []) as any[]) {
    const arr: string[] = r[cfg.col] ?? [];
    let changed = false;
    const next = arr.map((t) => {
      const rw = rewritePath(t, oldPath, newPath);
      if (rw != null && rw !== t) { changed = true; return rw; }
      return t;
    });
    if (changed) {
      await client.from(cfg.table).update({ [cfg.col]: dedupe(next) }).eq("id", r.id);
    }
  }
}

async function stripExactPath(scope: LabelScope, path: string) {
  const cfg = SCOPE_TABLES[scope];
  const client: any = supabase;
  let q = client.from(cfg.table).select(`id,${cfg.col}`).contains(cfg.col, [path]);
  if (cfg.extraEq) q = q.eq(cfg.extraEq[0], cfg.extraEq[1]);
  const { data } = await q;
  for (const r of (data ?? []) as any[]) {
    const next = ((r[cfg.col] ?? []) as string[]).filter((t) => t !== path);
    await client.from(cfg.table).update({ [cfg.col]: next }).eq("id", r.id);
  }
}

async function stripSubtreePaths(scope: LabelScope, root: string) {
  const cfg = SCOPE_TABLES[scope];
  const client: any = supabase;
  let q = client.from(cfg.table).select(`id,${cfg.col}`);
  if (cfg.extraEq) q = q.eq(cfg.extraEq[0], cfg.extraEq[1]);
  const { data } = await q;
  for (const r of (data ?? []) as any[]) {
    const arr = (r[cfg.col] ?? []) as string[];
    const next = arr.filter((t) => t !== root && !t.startsWith(root + LABEL_SEP));
    if (next.length !== arr.length) {
      await client.from(cfg.table).update({ [cfg.col]: next }).eq("id", r.id);
    }
  }
}

function dedupe(a: string[]): string[] { return [...new Set(a)]; }

async function autoAssignColor(scope: LabelScope): Promise<number> {
  const { data } = await (supabase as any)
    .from("tags").select("color_index").eq("scope", scope);
  return pickLeastUsedColor(((data ?? []) as any[]).map((r) => r.color_index));
}

export function useInvalidateLabels(scope?: LabelScope) {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({
      queryKey: scope ? ["admin", "labels", scope] : ["admin", "labels"],
    });
}

// -------- legacy shims for existing callers --------

/** @deprecated use registerLabelPath */
export async function registerLabel(name: string, scope: LabelScope, colorIndex?: number) {
  return registerLabelPath(name, scope, colorIndex);
}
/** @deprecated use setLabelColorById; kept for callers keyed by name */
export async function setLabelColor(name: string, scope: LabelScope, colorIndex: number) {
  const client: any = supabase;
  await client.from("tags").update({ color_index: colorIndex })
    .eq("scope", scope).eq("name", name.toLowerCase());
}
