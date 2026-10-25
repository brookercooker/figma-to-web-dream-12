import { Suspense, useEffect, useRef } from "react";
import { MemoryRouter, Route, Routes, UNSAFE_LocationContext, UNSAFE_RouteContext } from "react-router-dom";
import { codedPages } from "@/pages/admin/codedPages";
import LivePreviewPage from "@/pages/admin/designChat/LivePreviewPage";
import InlineEditSurface, { type InlineEditController, type InlineSelection, type InlineReports } from "./InlineEditSurface";
import { fingerprintMatches, fingerprintOf, resolvePath, type InlineEdits, type Fingerprint } from "@/lib/inlineEditCore";

export function PageRoute({ path, children }: { path: string; children: React.ReactNode }) {
  return <UNSAFE_LocationContext.Provider value={null}><UNSAFE_RouteContext.Provider value={{ outlet: null, matches: [], isDataRoute: false }}>
    <MemoryRouter initialEntries={[path]}><Routes><Route path={path.startsWith("/landing/") ? "/landing/:slug" : "*"} element={children} /></Routes></MemoryRouter>
  </UNSAFE_RouteContext.Provider></UNSAFE_LocationContext.Provider>;
}

/** Keep the original React tree; isolate a section without flattening forms, maps or carousels. */
export default function PageCodeSection({ path, chunk, fingerprint, edits = {}, objectEdits, editing = false, onChange, onSelect, onReport, apiRef }: {
  path: string; chunk: string; fingerprint?: Fingerprint; edits?: InlineEdits; objectEdits?: Record<string, InlineEdits>;
  editing?: boolean; onChange?: (scope: string, next: InlineEdits) => void; onSelect?: (s: InlineSelection | null) => void;
  onReport?: (r: InlineReports) => void; apiRef?: React.MutableRefObject<InlineEditController | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const C = codedPages[path === "/" ? "/home" : path];
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const isolate = () => {
      const root = host.querySelector<HTMLElement>("[data-inline-root]");
      if (!root || !root.children.length) return;
      const target = resolvePath(root, chunk);
      // A changed source fails closed: show the complete original rather than hide the wrong part.
      if (!target || (fingerprint && !fingerprintMatches(fingerprint, fingerprintOf(target)))) return;
      let n: Element = target;
      while (n !== root && n.parentElement) {
        for (const sibling of n.parentElement.children) if (sibling !== n) sibling.setAttribute("data-inline-isolated-out", "");
        n = n.parentElement;
      }
    };
    isolate();
    const observer = new MutationObserver(isolate);
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [chunk, fingerprint]);
  return <div ref={ref}>
    <PageRoute path={path}>
          <InlineEditSurface edits={edits} objectEdits={objectEdits} editing={editing} sections={false}
            onChange={onChange} onSelect={onSelect} onReport={onReport} apiRef={apiRef}>
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted" />}>{C ? <C /> : <LivePreviewPage path={path} />}</Suspense>
          </InlineEditSurface>
    </PageRoute>
  </div>;
}