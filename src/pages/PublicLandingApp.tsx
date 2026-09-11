import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { customLandingPages } from "./landing/customLandingPages";
import { LandingHeader, LandingFooter } from "@/components/LandingChrome";

const LandingPage = lazy(() => import("./LandingPage"));
const NotFound = lazy(() => import("./NotFound"));

/**
 * Router used ONLY when the browser is on the public landing subdomain
 * (landing.novalightingcompany.com).
 *
 * Custom React-component landing pages are registered in
 * `./landing/customLandingPages.ts` and are automatically exposed here at
 * both `/:slug` and `/landing/:slug`. Everything else falls through to the
 * DB-backed `LandingPage` renderer, which enforces visibility via RLS.
 *
 * All landing pages render inside the minimal LandingChrome (logo-only
 * header + copyright-only footer). No search, nav, cart, mega-menu.
 */
export default function PublicLandingApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen" aria-hidden />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<PublicLandingShell />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PublicLandingShell() {
  return (
    <>
      <LandingHeader homeHref="https://novalightingcompany.com/" />
      <main>
        <Suspense fallback={<div className="min-h-[60vh]" aria-hidden />}>
          <Routes>
            {customLandingPages.map(({ slug, component: Component }) => (
              <Route key={`root-${slug}`} path={`/${slug}`} element={<Component />} />
            ))}
            {customLandingPages.map(({ slug, component: Component }) => (
              <Route key={`landing-${slug}`} path={`/landing/${slug}`} element={<Component />} />
            ))}
            <Route path="/:slug" element={<LandingPage />} />
            <Route path="/landing/:slug" element={<LandingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <LandingFooter />
    </>
  );
}

function RootRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("https://novalightingcompany.com/");
  }
  return <div className="min-h-screen" aria-hidden />;
}
