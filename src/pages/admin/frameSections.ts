export interface FrameSection {
  key: string;
  name: string;
  kind: "site" | "page" | "object" | "held";
  objectId?: string;
  collapsed: boolean;
  movable: boolean;
  deletable: boolean;
}
/** Bounded, inert data from the trusted edit frame; never persisted as page content. */
export function parseFrameSections(value: unknown): FrameSection[] | null {
  if (!Array.isArray(value) || value.length > 500) return null;
  const keys = new Set<string>();
  const out: FrameSection[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object" || typeof row.key !== "string" || !row.key || row.key.length > 1000 || keys.has(row.key) ||
      typeof row.name !== "string" || row.name.length > 300 || !["site", "page", "object", "held"].includes(row.kind) ||
      [row.collapsed, row.movable, row.deletable].some(v => typeof v !== "boolean") ||
      (row.objectId !== undefined && typeof row.objectId !== "string")) return null;
    keys.add(row.key);
    // Object names may arrive with shared-object or brand metadata prepended.
    // Keep that metadata out of the label; the list already renders a Shared tag.
    const plainName = row.name.replace(/^[\s⠇⠿⋮☰]+/, "");
    const name = row.kind === "object" || row.objectId
      ? plainName.replace(/^(?:.*?\s·\s)?Shared object(?:: | · )/i, "")
      : plainName;
    out.push({ key: row.key, name, kind: row.kind, ...(row.objectId ? { objectId: row.objectId } : {}),
      collapsed: row.collapsed, movable: row.kind !== "site" && row.movable, deletable: row.kind !== "site" && row.deletable });
  }
  const header = out.filter(r => r.kind === "site" && r.key === "site-header");
  const footer = out.filter(r => r.kind === "site" && r.key === "site-footer");
  return [...header, ...out.filter(r => !header.includes(r) && !footer.includes(r)), ...footer];
}