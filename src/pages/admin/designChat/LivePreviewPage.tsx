import { Suspense, useEffect, useState, type ComponentType } from "react";
import { MemoryRouter, Route, Routes, UNSAFE_LocationContext, UNSAFE_RouteContext } from "react-router-dom";
import { draftManifestReachable, loadSiteManifest } from "../siteManifest";
import { codedPages } from "../codedPages";

// Resolve new public routes from the same manifest that the Site Manager already uses.
const modules = import.meta.glob<{ default: ComponentType; [name: string]: unknown }>("/src/pages/**/*.tsx");

/** found: the page's code is shown · missing: the manifest loaded but has no such page · unreachable: manifest or code failed to load. */
export type LiveStatus = "found" | "missing" | "unreachable";

/** One spelling per page: no query/hash, no trailing slash, and "/" written as "/home" (as the manifest does). */
export function normalisePagePath(path: string): string {
  let p = (path || "/").split(/[?#]/)[0] || "/";
  if (p.length > 1) p = p.replace(/\/+$/, "") || "/";
  return p === "/" ? "/home" : p;
}

export async function resolveLivePage(path: string, force = false): Promise<{ status: LiveStatus; Page?: ComponentType }> {
  const key = normalisePagePath(path);
  let manifestLoaded = false, entryFound = false, importOk = false, draftOk = true;
  const report = (status: LiveStatus) => {
    if (status !== "found") console.warn(`[Edit manually] ${key}: ${status} (manifest loaded: ${manifestLoaded ? "yes" : "no"}, draft manifest reachable: ${draftOk ? "yes" : "no"}, entry found: ${entryFound ? "yes" : "no"}, import ok: ${importOk ? "yes" : "no"})`);
    return status;
  };
  let manifestFailed = false;
  try {
    const manifest = await loadSiteManifest(force);
    manifestLoaded = true;
    draftOk = draftManifestReachable(); // true when there is no draft (the public list is the authority)
    const entry = manifest.pages.find((p) => normalisePagePath(p.path) === key);
    const load = entry ? modules[entry.file] : undefined;
    if (entry && load) {
      entryFound = true;
      const module = await load();
      const Page = (entry.exportName ? module[entry.exportName] : module.default) as ComponentType | undefined;
      if (!Page) return { status: report("unreachable") };
      importOk = true;
      return { status: "found", Page };
    }
    if (entry) entryFound = true;
  } catch {
    manifestFailed = !manifestLoaded;
    if (manifestLoaded) return { status: report("unreachable") }; // the page's code failed to load
  }
  // Backup: pages the Site Manager knows are written in code.
  const backup = codedPages[key];
  if (backup) { entryFound = true; importOk = true; return { status: "found", Page: backup }; }
  // Only call a page "missing" when the list that would contain it was actually read.
  return { status: report(manifestFailed || entryFound || !draftOk ? "unreachable" : "missing") };
}

export default function LivePreviewPage({ path, onStatus, reloadKey = 0 }: { path: string; onStatus?: (s: LiveStatus) => void; reloadKey?: number }) {
  const [Page, setPage] = useState<ComponentType | null>(null);
  useEffect(() => {
    let active = true;
    setPage(null);
    resolveLivePage(path, reloadKey > 0).then(({ status, Page: P }) => {
      if (!active) return;
      if (P) setPage(() => P);
      onStatus?.(status);
    });
    return () => { active = false; };
  }, [path, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!Page) return <div className="min-h-[60vh]" aria-hidden="true" />;
  return <UNSAFE_LocationContext.Provider value={null}>
    <UNSAFE_RouteContext.Provider value={{ outlet: null, matches: [], isDataRoute: false }}>
      <MemoryRouter key={path} initialEntries={[path]}>
        <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
          <Routes><Route path="*" element={<Page />} /></Routes>
        </Suspense>
      </MemoryRouter>
    </UNSAFE_RouteContext.Provider>
  </UNSAFE_LocationContext.Provider>;
}
