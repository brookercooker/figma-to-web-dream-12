import { useEffect, type RefObject } from "react";
import { pageKey } from "./registerPage";

const positions = new Map<string, number>();
const framePaths = new WeakMap<HTMLIFrameElement, string>();
export function scrollPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300 || !/^\/(?!\/)/.test(value) || /[\\?#]/.test(value) || value.split("/").some(part => part === "." || part === "..") || /^\/manage(?:\/|$)/.test(value)) return null;
  return pageKey(value);
}
export function rememberScroll(path: unknown, y: unknown): boolean {
  const key = scrollPath(path);
  if (!key || typeof y !== "number" || !Number.isFinite(y) || y < 0) return false;
  positions.set(key, Math.min(30_000_000, y));
  return true;
}
export function restoreFrameScroll(frame: HTMLIFrameElement | null, path: unknown): boolean {
  const key = scrollPath(path);
  const y = key ? positions.get(key) : undefined;
  if (!frame?.contentWindow || !key || y === undefined) return false;
  let url: URL;
  try { url = new URL(frame.src); } catch { return false; }
  if (url.protocol !== "https:" || url.origin === window.location.origin) return false;
  frame.contentWindow.postMessage({ source: "nova-manager", type: "restore-scroll", path: key, y }, url.origin);
  return true;
}
export function acceptFrameScroll(event: MessageEvent, frame: HTMLIFrameElement | null, expectedPath: string): boolean {
  if (!frame?.contentWindow || frame.contentWindow !== event.source) return false;
  let origin: string;
  try { origin = new URL(frame.src).origin; } catch { return false; }
  if (origin !== event.origin || origin === window.location.origin) return false;
  const d = event.data;
  return d?.source === "nova-site" && d.type === "page-scroll" && scrollPath(d.path) === scrollPath(expectedPath) && rememberScroll(d.path, d.y);
}
/** Hidden preview frames never overwrite the current editor's position. */
export function usePreviewScroll(root: RefObject<HTMLElement>, editing: boolean, shownId?: number) {
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const frame = Array.from(root.current?.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview]") ?? []).find(f => f.contentWindow === event.source);
      if (!frame) return;
      let origin: string;
      try { origin = new URL(frame.src).origin; } catch { return; }
      if (origin !== event.origin || origin === window.location.origin) return;
      const d = event.data;
      if (d?.source !== "nova-site") return;
      const path = scrollPath(d.path);
      if (!path) return;
      if (d.type === "preview-ready" || d.type === "location") {
        framePaths.set(frame, path);
        if (!editing) restoreFrameScroll(frame, path);
      } else if (!editing && frame.dataset.previewShown === "true" && d.type === "page-scroll" && framePaths.get(frame) === path) {
        acceptFrameScroll(event, frame, path);
      }
    };
    window.addEventListener("message", receive);
    if (!editing) {
      const frame = root.current?.querySelector<HTMLIFrameElement>('iframe[data-site-preview][data-preview-shown="true"]');
      if (frame) restoreFrameScroll(frame, framePaths.get(frame));
    }
    return () => window.removeEventListener("message", receive);
  }, [root, editing, shownId]);
}