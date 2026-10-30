import { isSafePublicFrameUrl } from "./siteManifest";
import { validateEdits, type InlineEdits } from "@/lib/inlineEditCore";
import { PAGE_CONTENT, isPageContent } from "./pageContentOrder";

export function editFrameUrl(base: string | null | undefined, path: string): string | null {
  if (window.self !== window.top || !isSafePublicFrameUrl(base) || !/^\/(?!\/)/.test(path) || /[\\\u0000-\u001f]/.test(path)) return null;
  const url = new URL(base);
  url.pathname = path === "/home" ? "/" : path;
  url.hash = "";
  url.searchParams.set("nova-edit", "1");
  return url.toString();
}
export function trustedEditMessage(event: MessageEvent, frame: HTMLIFrameElement | null, origin: string): boolean {
  return !!frame?.contentWindow && event.origin === origin && event.source === frame.contentWindow &&
    !!event.data && event.data.source === "nova-site" && typeof event.data.type === "string";
}
export function editMap(value: unknown): InlineEdits | null {
  const { ok, rejected } = validateEdits(value);
  return rejected.length ? null : ok;
}
export const HELD_BLOCKS_MAX = 50;
export const HELD_BLOCKS_MAX_BYTES = 500_000;
export interface HeldObjectData { status: string; name: string; component_key: string | null; content: unknown; inline_edits?: InlineEdits }
export type ObjectSwapData = HeldObjectData & { id: string; inline_edits: InlineEdits };
/** Swap snapshots only travel to the frame; stored inline edits remain slot → id. */
export function objectSwapPayload(swaps: Record<string, string>, objects?: Record<string, HeldObjectData>): Record<string, ObjectSwapData> {
  const out: Record<string, ObjectSwapData> = {};
  for (const [slot, id] of Object.entries(swaps)) {
    const object = objects?.[id];
    if (!object) continue;
    const snapshot = { id, ...object, inline_edits: object.inline_edits ?? {} };
    try {
      if (new Blob([JSON.stringify({ ...out, [slot]: snapshot })]).size <= HELD_BLOCKS_MAX_BYTES) out[slot] = snapshot;
    } catch { /* Omit a snapshot that cannot be transported safely. */ }
  }
  return out;
}
/** Object snapshots are transport-only; never let them reach pages.content. */
export function stripHeldObjects<T>(blocks: readonly T[]): T[] {
  return blocks.map(block => {
    if (!block || typeof block !== "object" || (block as { type?: unknown }).type !== "object") return block;
    const { object: _snapshot, ...saved } = block as T & { object?: unknown };
    return saved as T;
  });
}
/** Ordered held blocks for the public frame, or null when too large (caller keeps the local list). */
export function heldBlocksPayload<T>(blocks: readonly T[], blockMove = false, objects?: Record<string, HeldObjectData>): (T | typeof PAGE_CONTENT)[] | null {
  blocks = stripHeldObjects(blocks);
  const supported = blockMove
    ? blocks.some(isPageContent) ? [...blocks] : [PAGE_CONTENT, ...blocks]
    : blocks.filter(b => !isPageContent(b));
  if (supported.length > HELD_BLOCKS_MAX) return null;
  try { if (new Blob([JSON.stringify(supported)]).size > HELD_BLOCKS_MAX_BYTES) return null; } catch { return null; }
  if (!objects) return supported;
  // Keep the base list usable: omit individual snapshots that would exceed the total cap.
  return supported.reduce<(T | typeof PAGE_CONTENT)[]>((out, block, index) => {
    const ref = block as { type?: unknown; objectId?: string };
    if (ref.type !== "object") { out.push(block); return out; }
    const enriched = { ...block as object, object: ref.objectId ? objects[ref.objectId] ?? null : null } as T;
    try {
      const candidate = [...out, enriched, ...supported.slice(index + 1)];
      out.push(new Blob([JSON.stringify(candidate)]).size <= HELD_BLOCKS_MAX_BYTES ? enriched : block);
    } catch { out.push(block); }
    return out;
  }, []);
}
export const clampEditSize = (h: number) => Math.max(400, Math.min(20000, h));

/** The object being edited on its own in the public edit frame (shapes agreed with the public site). */
export interface ObjectEditTarget { objectId: string; name: string; status: string; component_key: string | null; siteWide: boolean; content?: unknown; inline_edits?: InlineEdits }
/** Public route that renders one object alone; the frame gates it with ?nova-edit=1 like pages. Header/Footer open by row id too. */
export const objectFramePath = (id: string) => `/__object/${encodeURIComponent(id)}`;
/** Edit scope in object scope: always `object:<id>` (page copies share their original's component_key, so only the id is safe). */
export const objectEditScope = (o: { objectId?: string; id?: string }) => `object:${o.objectId ?? o.id}`;
/** Extra edit-init / edit-update fields for object scope; `edits` (the unsaved map) overrides object.inline_edits. */
export function objectScopePayload(target: ObjectEditTarget, objectEdits: Record<string, InlineEdits>) {
  const { objectId, name, component_key, status, siteWide, content, inline_edits } = target;
  return { scope: "object" as const, object: { id: objectId, name, component_key, status, content: content ?? null, inline_edits: inline_edits ?? {}, siteWide }, edits: objectEdits[objectEditScope(target)] ?? inline_edits ?? {} };
}
/** What the header note under "Editing <name>" says. */
export function objectEditorNote(o: { name: string; component_key: string | null; siteWide: boolean }, usedOn: string[], copyOf?: string | null): string {
  if (o.siteWide) return "Site-wide object · shown on every page";
  if (copyOf) return `This copy is only used on ${copyOf}`;
  if (usedOn.length === 1) return `Used only on ${usedOn[0]}`;
  return usedOn.length ? `Shared object · used on ${usedOn.join(", ")}` : "Shared object · not used on any page yet";
}
