/**
 * Nested-label path utilities.
 *
 * Items store labels as canonical PATH STRINGS joined by "/".
 *   Top-level: "photos"
 *   Nested:    "photos/interior/kitchen"
 *
 * Names may not contain "/". Max depth is 4 (paths with 1..4 segments).
 */

export const LABEL_SEP = "/";
export const MAX_DEPTH = 4;

/** Split a path into segments. */
export function splitPath(path: string): string[] {
  return path.split(LABEL_SEP).filter(Boolean);
}

/** Join segments into a canonical path. */
export function joinPath(segments: string[]): string {
  return segments.join(LABEL_SEP);
}

/** Leaf (last) name of a path — the label's own name. */
export function leafOf(path: string): string {
  const s = splitPath(path);
  return s[s.length - 1] ?? path;
}

/** Parent path or "" for root labels. */
export function parentPath(path: string): string {
  const s = splitPath(path);
  s.pop();
  return joinPath(s);
}

/** Depth of a path (root = 1, max = 4). */
export function depthOf(path: string): number {
  return splitPath(path).length;
}

/** Returns true if `path` is `ancestor` or a descendant of `ancestor`. */
export function isDescendantOrSelf(path: string, ancestor: string): boolean {
  if (!ancestor) return true;
  return path === ancestor || path.startsWith(ancestor + LABEL_SEP);
}

/**
 * Filter rollup: an item matches a label filter if it is tagged with that
 * label OR any descendant path.
 */
export function matchesLabelFilter(itemTags: string[] | null | undefined, filter: string): boolean {
  const tags = itemTags ?? [];
  return tags.some((t) => isDescendantOrSelf(t, filter));
}

/** Validate a label leaf name. Returns null if OK or an error message. */
export function validateLeafName(name: string): string | null {
  const n = name.trim();
  if (!n) return "Name is required.";
  if (n.includes(LABEL_SEP)) return `Name cannot contain "${LABEL_SEP}".`;
  if (n.length > 60) return "Name is too long (60 char max).";
  return null;
}

/**
 * Rewrite an existing item path when a label at `oldPath` moves/renames
 * to `newPath`. Returns null if the tag is unrelated to this change.
 */
export function rewritePath(tag: string, oldPath: string, newPath: string): string | null {
  if (tag === oldPath) return newPath;
  const prefix = oldPath + LABEL_SEP;
  if (tag.startsWith(prefix)) return newPath + LABEL_SEP + tag.slice(prefix.length);
  return null;
}
