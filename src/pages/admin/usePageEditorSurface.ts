import { useEffect, useState } from "react";
import { draftEmbedUrl } from "./siteManifest";

/** Every page edits in the public frame; "loading" only until the draft embed address is known. */
export type PageEditorSurface = "loading" | "framed";
export const EDITOR_DECISION_TIMEOUT_MS = 8000;
const POLL_MS = 200;

/** Latched per page opening: later address/manifest/cache events never remount an open canvas. */
export function usePageEditorSurface(page: { id: string; path: string } | null): PageEditorSurface {
  const [openedId, setOpenedId] = useState<string | null>(null);
  const id = page?.id;
  useEffect(() => {
    if (!id) return;
    if (draftEmbedUrl()) { setOpenedId(id); return; }
    const started = Date.now();
    // Bounded: after the limit the frame opens anyway and shows its own Retry, never a local substitute.
    const timer = setInterval(() => {
      if (draftEmbedUrl() || Date.now() - started >= EDITOR_DECISION_TIMEOUT_MS) { clearInterval(timer); setOpenedId(id); }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [id]);
  return id && openedId === id ? "framed" : "loading";
}
