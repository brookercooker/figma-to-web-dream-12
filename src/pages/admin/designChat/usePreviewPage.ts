import { useEffect, useState } from "react";
import { supabase } from "@/prototype/client";
import { notifyContentEdited } from "./contentSync";
import { normalizePreviewPath, pageToRegister, pageRow, pageSlugSuffix, type RegistrablePage } from "./registerPage";
export { normalizePreviewPath } from "./registerPage";

/** The Site Manager page shown at an address of the public site (looked up by path, cached for the session). */
export type PreviewPage = { id: string; name: string; path: string };

const cache = new Map<string, PreviewPage | null>();
const listeners = new Set<() => void>();
const registering = new Map<string, Promise<PreviewPage>>();

/** Register once even when more than one click or editor requests the same page. */
export function registerPreviewPage(candidate: RegistrablePage): Promise<PreviewPage> {
  const key = normalizePreviewPath(candidate.path);
  const existing = cache.get(key);
  if (existing) return Promise.resolve(existing);
  const pending = registering.get(key);
  if (pending) return pending;
  const request = (async () => {
    const fields = pageRow({ ...candidate, path: key }, "static", pageSlugSuffix());
    let { data, error } = await (supabase as any).from("pages").insert(fields).select("id,name,path").single();
    if (error?.code === "23505") {
      const found = await (supabase as any).from("pages").select("id,name,path,archived_at").eq("path", key).maybeSingle();
      data = found.data;
      error = found.error;
      if (data?.archived_at) {
        const restored = await (supabase as any).from("pages").update({ archived_at: null, build_status: "ready" })
          .eq("id", data.id).select("id,name,path").single();
        data = restored.data;
        error = restored.error;
      }
    }
    if (error || !data?.id) throw error ?? new Error("Page registration failed");
    const page: PreviewPage = { id: data.id, name: data.name, path: data.path };
    cache.set(key, page);
    listeners.forEach((notify) => notify());
    notifyContentEdited();
    return page;
  })();
  registering.set(key, request);
  void request.finally(() => registering.delete(key)).catch(() => {});
  return request;
}

export function usePreviewPage(path: string | null, notFound = false): { page: PreviewPage | null; loading: boolean; registrable: RegistrablePage | null } {
  const key = path === null ? null : normalizePreviewPath(path);
  const [state, setState] = useState<{ key: string | null; page: PreviewPage | null; loading: boolean }>(() => ({
    key, page: key !== null ? cache.get(key) ?? null : null, loading: key !== null && !cache.has(key),
  }));

  useEffect(() => {
    const update = () => { if (key !== null && cache.has(key)) setState({ key, page: cache.get(key) ?? null, loading: false }); };
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, [key]);

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
        const page = cache.get(key) ?? rows.find((r) => r.path === key) ?? rows[0] ?? null;
        if (!error) cache.set(key, page);
        setState({ key, page, loading: false });
      });
    return () => { stale = true; };
  }, [key]);

  const current = state.key === key ? { page: state.page, loading: state.loading } : { page: null, loading: key !== null };
  return { ...current, page: notFound ? null : current.page,
    registrable: key !== null && !current.loading && !current.page ? pageToRegister(key, notFound) : null };
}
