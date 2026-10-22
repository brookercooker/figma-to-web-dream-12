import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import { loadSiteManifest } from "../siteManifest";
import DbPage from "@/pages/DbPage";

// Resolve new public routes from the same manifest that the Site Manager already uses.
const modules = import.meta.glob<{ default: ComponentType; [name: string]: unknown }>("/src/pages/**/*.tsx");

export default function LivePreviewPage({ path }: { path: string }) {
  const [Page, setPage] = useState<ComponentType | null>(null);
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    let active = true;
    setPage(null);
    setResolved(false);
    loadSiteManifest().then((manifest) => {
      const entry = manifest.pages.find((page) => page.path === path);
      const load = entry ? modules[entry.file] : undefined;
      if (load && active) {
        const Component = lazy(async () => {
          const module = await load();
          return { default: (entry?.exportName ? module[entry.exportName] : module.default) as ComponentType };
        });
        setPage(() => Component);
      }
    }).catch(() => {}).finally(() => { if (active) setResolved(true); });
    return () => { active = false; };
  }, [path]);
  if (!resolved) return <div className="min-h-[60vh]" aria-hidden="true" />;
  return <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
      <Routes location={path}><Route path="/:slug" element={Page ? <Page /> : <DbPage />} /><Route path="*" element={Page ? <Page /> : <DbPage />} /></Routes>
    </Suspense>;
}