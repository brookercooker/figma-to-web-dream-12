import { useEffect, type RefObject } from "react";
import { supabase } from "@/prototype/client";
import { editMap } from "../framedPageProtocol";
import { CONTENT_SAVED } from "./contentSync";
import { homeAliases } from "./registerPage";
import type { InlineEdits } from "@/lib/inlineEditCore";

export interface PreviewTarget { win: Window; origin: string; path: string }

/** The preview frame inside `root` that sent this message, if its origin is the exact origin of that frame's address. */
export function previewSender(event: MessageEvent, root: ParentNode | null): PreviewTarget | null {
  const data = event.data;
  if (!root || !data || data.source !== "nova-site" || data.type !== "preview-ready" || typeof data.path !== "string" || !/^\/(?!\/)/.test(data.path)) return null;
  for (const frame of root.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview]")) {
    if (!frame.contentWindow || frame.contentWindow !== event.source) continue;
    let origin: string;
    try { origin = new URL(frame.src).origin; } catch { return null; }
    if (origin === "null" || origin !== event.origin || origin === window.location.origin) return null;
    return { win: frame.contentWindow, origin, path: data.path };
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
export function usePreviewEdits(root: RefObject<HTMLElement>, load = loadPreviewEdits) {
  useEffect(() => {
    let target: PreviewTarget | null = null;
    let seq = 0;
    const send = async () => {
      const t = target; if (!t) return;
      const id = ++seq;
      try {
        const payload = await load(t.path);
        if (id === seq && target === t) postPreviewEdits(t, payload);
      } catch { /* The preview keeps its packaged edits. */ }
    };
    const onMessage = (event: MessageEvent) => {
      const sender = previewSender(event, root.current);
      if (sender) { target = sender; void send(); }
    };
    const onSaved = () => { if (target) void send(); };
    window.addEventListener("message", onMessage);
    window.addEventListener(CONTENT_SAVED, onSaved);
    return () => { window.removeEventListener("message", onMessage); window.removeEventListener(CONTENT_SAVED, onSaved); };
  }, [root, load]);
}
