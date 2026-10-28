import { isSafePublicFrameUrl } from "./siteManifest";
import { validateEdits, type InlineEdits } from "@/lib/inlineEditCore";

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
/** Ordered held blocks for the public frame, or null when too large (caller keeps the local list). */
export function heldBlocksPayload<T>(blocks: readonly T[], blockMove = false): T[] | null {
  const supported = blockMove ? [...blocks] : blocks.filter(b => (b as { type?: unknown })?.type !== "page");
  if (supported.length > HELD_BLOCKS_MAX) return null;
  try { if (new Blob([JSON.stringify(supported)]).size > HELD_BLOCKS_MAX_BYTES) return null; } catch { return null; }
  return supported;
}
export const clampEditSize = (h: number) => Math.max(400, Math.min(20000, h));
