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
export interface HeldObjectData { status: string; name: string; component_key: string | null; content: unknown }
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
