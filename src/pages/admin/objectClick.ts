// Shared-object clicks from the public edit frame: message validation, which dialog to show, copy naming and swaps.
import type { InlineEdits } from "@/components/InlineEditSurface";

export interface ObjectClick { objectId: string; componentKey: string | null; name: string; slot: string; siteWide: boolean }
export type ObjectClickKind = "site" | "copy" | "shared";

const SITE_WIDE_KEYS = new Set(["Header", "Footer"]);
const SWAP_PREFIX = "objectSwap:";

/** Accepts the frame's `edit-object-click` payload; anything malformed is ignored (null). */
export function parseObjectClick(data: unknown): ObjectClick | null {
  const d = data as Record<string, unknown> | null;
  if (!d || typeof d.objectId !== "string" || !d.objectId || typeof d.slot !== "string" || !d.slot) return null;
  if (d.componentKey != null && typeof d.componentKey !== "string") return null;
  const componentKey = (d.componentKey as string | null | undefined) || null;
  const name = typeof d.name === "string" && d.name.trim() ? d.name.trim().slice(0, 120) : componentKey ?? "This object";
  return { objectId: d.objectId, componentKey, name, slot: d.slot, siteWide: d.siteWide === true };
}

/** The swaps recorded in a page's inline edits: slot → copied object id. */
export function objectSwaps(edits: InlineEdits): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(edits)) if (key.startsWith(SWAP_PREFIX) && value) out[key.slice(SWAP_PREFIX.length)] = value;
  return out;
}
export const swapKey = (slot: string) => `${SWAP_PREFIX}${slot}`;

export function objectClickKind(click: ObjectClick, edits: InlineEdits, rowSiteWide = false): ObjectClickKind {
  if (click.siteWide || rowSiteWide || (click.componentKey && SITE_WIDE_KEYS.has(click.componentKey))) return "site";
  if (Object.values(objectSwaps(edits)).includes(click.objectId)) return "copy";
  return "shared";
}

export const siteWideLabel = (componentKey: string | null) => (componentKey === "Footer" ? "Footer" : "Header");

/** "<name> (<page>)", trimmed to what object names allow (letters, digits, spaces, _ - and brackets, 80 characters). */
export function copyName(name: string, page: string): string {
  const clean = (s: string) => s.replace(/[^A-Za-z0-9 _()\-]/g, "").replace(/\s+/g, " ").trim();
  const base = clean(name) || "Object";
  const suffix = ` (${clean(page) || "Page"})`;
  const out = `${base.slice(0, Math.max(1, 80 - suffix.length))}${suffix}`.slice(0, 80);
  return /^[A-Za-z0-9]/.test(out) ? out : `Copy ${out}`.slice(0, 80);
}

/** Records a swap: the inline edit key, and the object id on the page-content block whose id is the slot. */
export function applySwap<B extends { id: string; type: string; objectId?: string }>(blocks: B[], edits: InlineEdits, slot: string, copyId: string) {
  const nextBlocks = blocks.map((b) => (b.id === slot && b.type === "object" ? { ...b, objectId: copyId } : b));
  const changedBlocks = nextBlocks.some((b, i) => b !== blocks[i]);
  return { blocks: changedBlocks ? nextBlocks : blocks, edits: { ...edits, [swapKey(slot)]: copyId }, changedBlocks };
}

/** Copies created this session that the given state no longer refers to (safe to delete). */
export function unusedCopies(copies: Iterable<string>, state: { blocks: { objectId?: string }[]; inlineEdits: InlineEdits }): string[] {
  const used = new Set([...Object.values(objectSwaps(state.inlineEdits)), ...state.blocks.map((b) => b.objectId).filter(Boolean) as string[]]);
  return [...copies].filter((id) => !used.has(id));
}
