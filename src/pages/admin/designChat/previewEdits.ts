import { useEffect, useState, type RefObject } from "react";
import { supabase } from "@/prototype/client";
import { editMap } from "../framedPageProtocol";
import { CONTENT_SAVED } from "./contentSync";
import { homeAliases } from "./registerPage";
import type { InlineEdits } from "@/lib/inlineEditCore";
import { loadPreviewContent, type PreviewContent } from "./previewContent";
export const PREVIEW_CONTENT_RETRY = "nova:preview-content-retry";
const PREVIEW_LOADED = "nova:preview-content-loaded";
export function previewContentLoaded(frame: HTMLIFrameElement, reason = "iframe-load") {
  window.dispatchEvent(new CustomEvent(PREVIEW_LOADED, { detail: { frame, reason } }));
}

export interface PreviewTarget { win: Window; origin: string; path: string }

/** The preview frame inside `root` that sent this message, if its origin is the exact origin of that frame's address. */
export function previewSender(event: MessageEvent, root: ParentNode | null): PreviewTarget | null {
  const data = event.data;
  if (!root || !data || (data.source !== undefined && data.source !== "nova-site") || data.type !== "preview-ready" || (data.path !== undefined && (typeof data.path !== "string" || !/^\/(?!\/)/.test(data.path)))) return null;
  for (const frame of root.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview]")) {
    if (!frame.contentWindow || frame.contentWindow !== event.source) continue;
    let origin: string;
    try { origin = new URL(frame.src).origin; } catch { return null; }
    if (origin === "null" || origin !== event.origin || origin === window.location.origin) return null;
    return { win: frame.contentWindow, origin, path: data.path ?? new URL(frame.src).pathname };
  }
  return null;
}

export async function loadPreviewEdits(path: string): Promise<{ edits: InlineEdits; objectEdits: Record<string, InlineEdits> }> {
  const db = supabase as any;
  const [pages, objects] = await Promise.all([
    db.from("pages").select("path,inline_edits").in("path", homeAliases(path)),
    db.from("object_registry").select("component_key,inline_edits"),
  ]);
  const row = (pages.data ?? []).find((p: any) => p.path === "/") ?? (pages.data ?? [])[0];
  const objectEdits: Record<string, InlineEdits> = {};
  for (const o of objects.data ?? []) {
    const map = o.component_key && o.inline_edits ? editMap(o.inline_edits) : null;
    if (map) objectEdits[o.component_key] = map;
  }
  return { edits: (row?.inline_edits && editMap(row.inline_edits)) || {}, objectEdits };
}

export function postPreviewEdits(target: PreviewTarget, payload: { edits: InlineEdits; objectEdits: Record<string, InlineEdits> }) {
  target.win.postMessage({ source: "nova-manager", type: "preview-edits", path: target.path, ...payload }, target.origin);
}

/**
 * Chat Mode preview: the public draft reads edits from its package, not the live database, so send it the current
 * saved edits when it says it is ready and after every successful save or restore. Never reloads the frame.
 */
export function usePreviewEdits(root: RefObject<HTMLElement>, load = loadPreviewEdits, loadContent: () => Promise<PreviewContent> = loadPreviewContent) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let target: PreviewTarget | null = null;
    let seq = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const send = async (reason: string) => {
      const t = target; if (!t) return;
      const id = ++seq;
      clearTimeout(timer);
      try {
        const content = await loadContent();
        if (cancelled || id !== seq || target !== t) return;
        // A frame removed/swapped while reading must never receive saved content.
        const current = [...(root.current?.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview]") ?? [])].find(f => f.contentWindow === t.win && new URL(f.src).origin === t.origin);
        if (!current) return;
        t.win.postMessage({ source: "nova-manager", type: "preview-content", ...content }, t.origin);
        console.debug('[preview] sent snapshot', content.pages.length, content.objects.length, reason);
        setFailed(false);
        // Older frames retain the existing inline-only bridge as a compatibility message.
        try { const payload = await load(t.path); if (!cancelled && id === seq && target === t) postPreviewEdits(t, payload); } catch { /* Full saved content already arrived. */ }
      } catch {
        if (cancelled || id !== seq) return;
        setFailed(true); timer = setTimeout(() => void send("retry"), 20_000);
      }
    };
    const onMessage = (event: MessageEvent) => {
      const sender = previewSender(event, root.current);
      if (sender) { target = sender; void send("preview-ready"); }
    };
    const onSaved = (event: Event) => { if (target) void send(event.type === CONTENT_SAVED ? "content-saved" : "retry"); };
    const onLoaded = (event: Event) => {
      const { frame, reason } = (event as CustomEvent<{ frame: HTMLIFrameElement; reason: string }>).detail ?? {};
      if (!(frame instanceof HTMLIFrameElement) || !root.current?.contains(frame) || !frame.matches("iframe[data-site-preview]") || !frame.contentWindow) return;
      try {
        const url = new URL(frame.src);
        if (url.protocol !== "https:" || url.origin === window.location.origin || url.searchParams.has("nova-edit")) return;
        target = { win: frame.contentWindow, origin: url.origin, path: url.pathname };
        void send(reason);
      } catch { /* Invalid targets never receive data. */ }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener(PREVIEW_LOADED, onLoaded);
    window.addEventListener(CONTENT_SAVED, onSaved);
    window.addEventListener(PREVIEW_CONTENT_RETRY, onSaved);
    return () => { cancelled = true; ++seq; clearTimeout(timer); window.removeEventListener("message", onMessage); window.removeEventListener(PREVIEW_LOADED, onLoaded); window.removeEventListener(CONTENT_SAVED, onSaved); window.removeEventListener(PREVIEW_CONTENT_RETRY, onSaved); };
  }, [root, load, loadContent]);
  return failed;
}
