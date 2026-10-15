import { useEffect, useState } from "react";
import { supabase } from "@/prototype/client";

/** The Site Manager page shown at an address of the public site (looked up by path, cached for the session). */
export type PreviewPage = { id: string; name: string; path: string };

const cache = new Map<string, PreviewPage | null>();

/** "/about/" → "/about"; "/" stays. */
export function normalizePreviewPath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

export function usePreviewPage(path: string | null): { page: PreviewPage | null; loading: boolean } {
  const key = path === null ? null : normalizePreviewPath(path);
  const [state, setState] = useState<{ key: string | null; page: PreviewPage | null; loading: boolean }>(() => ({
    key, page: key !== null ? cache.get(key) ?? null : null, loading: key !== null && !cache.has(key),
  }));

  useEffect(() => {
    if (key === null) { setState({ key, page: null, loading: false }); return; }
    if (cache.has(key)) { setState({ key, page: cache.get(key) ?? null, loading: false }); return; }
    let stale = false;
    setState({ key, page: null, loading: true });
    const candidates = key === "/" ? ["/", "/home"] : [key];
    (supabase as any).from("pages").select("id,name,path").is("archived_at", null).in("path", candidates)
      .then(({ data, error }: any) => {
        if (stale) return;
        const rows = (data ?? []) as PreviewPage[];
        const page = rows.find((r) => r.path === key) ?? rows[0] ?? null;
        if (!error) cache.set(key, page);
        setState({ key, page, loading: false });
      });
    return () => { stale = true; };
  }, [key]);

  return state.key === key ? { page: state.page, loading: state.loading } : { page: null, loading: key !== null };
}
