import { useEffect, useState } from "react";
import { codePagePaths, loadSiteManifest, retainEditingManifestPaths } from "./siteManifest";

export type PageEditorSurface = "loading" | "framed" | "local";
export const EDITOR_DECISION_TIMEOUT_MS = 8000;

/** One manifest snapshot per page opening; cache/build events cannot replace an active canvas. */
export function usePageEditorSurface(page: { id: string; path: string } | null): PageEditorSurface {
  const [choice, setChoice] = useState<{ id: string; surface: PageEditorSurface } | null>(null);
  const id = page?.id;
  const path = page?.path;
  useEffect(() => {
    if (!id || !path) return;
    const release = retainEditingManifestPaths();
    let settled = false;
    const choose = (surface: PageEditorSurface) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      setChoice({ id, surface });
    };
    const timeout = setTimeout(() => choose("framed"), EDITOR_DECISION_TIMEOUT_MS);
    void loadSiteManifest().then(
      manifest => choose(codePagePaths(manifest).has(path === "/" ? "/home" : path.replace(/\/+$/, "")) ? "framed" : "local"),
      () => choose("framed"),
    );
    return () => { settled = true; clearTimeout(timeout); release(); };
  }, [id]); // A path or manifest change applies only on the next page opening.
  return choice?.id === id ? choice.surface : "loading";
}