import { Suspense, useEffect } from "react";
import { lazyRetry } from "@/lib/lazyRetry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InlineEditsLayer from "@/components/InlineEditsLayer";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SandboxBanner from "@/components/SandboxBanner";
import ScrollToTop from "@/components/ScrollToTop";
import PageSaveReminderButton from "@/components/PageSaveReminderButton";
import { LandingHeader, LandingFooter } from "@/components/LandingChrome";
import { CartProvider } from "@/contexts/CartContext";
import { isPublicLandingHost } from "@/lib/publicHost";
import PublicLandingApp from "@/pages/PublicLandingApp";

// Lazy-loaded routes.
const Home = lazyRetry(() => import("./pages/Index.tsx"));
const LocationsPage = lazyRetry(() => import("./pages/LocationsPage.tsx"));
const FullVendorListPage = lazyRetry(() => import("./pages/FullVendorListPage.tsx"));
const NewAndNowPage = lazyRetry(() => import("./pages/NewAndNowPage.tsx"));
const OutdoorEditPage = lazyRetry(() => import("./pages/OutdoorEditPage.tsx"));
const TeamPage = lazyRetry(() => import("./pages/TeamPage.tsx"));
const InspirationGalleryPage = lazyRetry(() => import("./pages/InspirationGalleryPage.tsx"));
const LightingTipsPage = lazyRetry(() => import("./pages/ObjectsLightingTips.tsx"));
const NotFound = lazyRetry(() => import("./pages/NotFound.tsx"));
const ObjectRoute = lazyRetry(() => import("./pages/ObjectRoute.tsx"));
const ObjectsFlyer = lazyRetry(() => import("./pages/ObjectsFlyer.tsx"));
const AdminGate = lazyRetry(() => import("./pages/admin/AdminGate.tsx"));
const AdminIndex = lazyRetry(() => import("./pages/admin/AdminIndex.tsx"));
const AdminUsersPage = lazyRetry(() => import("./pages/admin/UsersPage.tsx"));
const ObjectPreview = lazyRetry(() => import("./pages/admin/ObjectPreview.tsx"));
const ObjectWorkspace = lazyRetry(() => import("./pages/admin/ObjectWorkspace.tsx"));
const PageDesignPage = lazyRetry(() => import("./pages/admin/PageDesignPage.tsx"));
const ObjectDesignPage = lazyRetry(() => import("./pages/admin/ObjectDesignPage.tsx"));
const CapturePage = lazyRetry(() => import("./pages/admin/CapturePage.tsx"));

const ComingSoonPage = lazyRetry(() => import("./pages/ComingSoonPage.tsx"));
const DbPage = lazyRetry(() => import("./pages/DbPage.tsx"));
const TestPage = lazyRetry(() => import("./pages/TestPage.tsx"));
const RaceTestPage = lazyRetry(() => import("./pages/RaceTestPage.tsx"));
const LandingPage = lazyRetry(() => import("./pages/LandingPage.tsx"));
import { customLandingPages } from "./pages/landing/customLandingPages";

// Simple placeholder pages awaiting content.
const SimplePages = () => import("./pages/SimplePage.tsx");
const AboutPage = lazyRetry(() => SimplePages().then((m) => ({ default: m.AboutPage })));
const ContactPage = lazyRetry(() => import("./pages/ContactPage.tsx"));
const ShippingPolicyPage = lazyRetry(() => import("./pages/ShippingPolicyPage"));
const ReturnPolicyPage = lazyRetry(() => import("./pages/ReturnPolicyPage.tsx"));
const PrivacyPolicyPage = lazyRetry(() => import("./pages/PrivacyPolicyPage.tsx"));
const TermsConditionsPage = lazyRetry(() => import("./pages/TermsConditionsPage.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => <div className="min-h-[60vh]" aria-hidden="true" />;

const AppShell = () => {
  const location = useLocation();
  // Persist the last-visited manager route (including query string) so the
  // SandboxBanner's "Site Manager" link returns the user to the exact tool/tab
  // they were on. We track it here because the banner isn't mounted on
  // /manage/* routes (it's hidden on admin surfaces).
  useEffect(() => {
    if (location.pathname.startsWith("/manage")) {
      try {
        window.sessionStorage.setItem(
          "sandbox:lastManagerRoute",
          location.pathname + location.search,
        );
      } catch { /* ignore */ }
    }
  }, [location.pathname, location.search]);
  // Site Manager surfaces suppress the public chrome.
  const isAdmin =
    location.pathname === "/" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/manage") ||
    location.pathname.startsWith("/preview/");
  // Object routes render the object bare: keep the SandboxBanner, but drop
  // the public Header / Footer so the object shows in isolation.
  const isObjectRoute = location.pathname.startsWith("/objects/");
  // Landing pages get minimal chrome: logo-only header and copyright-only footer.
  const isLandingRoute = location.pathname.startsWith("/landing/");
  return (
    <>
      <ScrollToTop />
      {!isAdmin && <SandboxBanner />}
      {!isAdmin && !isObjectRoute && !isLandingRoute && <Header />}
      {!isAdmin && isLandingRoute && <LandingHeader />}
      <main id="main-content">
        <InlineEditsLayer path={location.pathname}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Root redirects to the Site Manager default view. */}
            <Route path="/" element={<Navigate to="/manage/pages" replace />} />

            {/* Site Manager routes — each tab has its own URL. */}
            <Route path="/manage" element={<Navigate to="/manage/pages" replace />} />
            <Route path="/manage/pages" element={<AdminIndex />} />
            <Route path="/manage/design" element={<PageDesignPage />} />
            <Route path="/manage/objects" element={<AdminIndex />} />
            <Route path="/manage/objects/design" element={<ObjectDesignPage />} />
            <Route path="/manage/objects/workspace/:slugId" element={<ObjectWorkspace />} />
            <Route path="/manage/images" element={<AdminIndex />} />
            <Route path="/manage/videos" element={<AdminIndex />} />
            <Route path="/manage/design-chat" element={<AdminIndex />} />
            <Route path="/manage/capture" element={<CapturePage />} />
            <Route path="/manage/*" element={<Navigate to="/manage/pages" replace />} />

            {/* Public site */}
            <Route path="/home" element={<Home />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/full-vendor-list" element={<FullVendorListPage />} />
            <Route path="/new-and-now" element={<NewAndNowPage />} />
            <Route path="/outdoor-oasis" element={<OutdoorEditPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/inspiration-gallery" element={<InspirationGalleryPage />} />
            <Route path="/lighting-tips" element={<LightingTipsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/contact-us-trade-account" element={<ContactPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/return-policy" element={<ReturnPolicyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-conditions" element={<TermsConditionsPage />} />
            <Route path="/objects-flyer" element={<ObjectsFlyer />} />

            {/* Coming Soon — Supernova CC placeholder + redirects for retired catalog/brand/product routes. */}
            <Route path="/coming-soon" element={<ComingSoonPage />} />
            {[
              "/brands",
              "/catalog",
              "/catalog/:id",
              "/product/:id",
              "/ceiling-lighting",
              "/ceiling-lighting/pendants/hicks-antique-brass",
              "/wall-lighting",
              "/lamps",
              "/outdoor",
              "/fans",
              "/fans/roto-52-coal",
              "/fans/spitfire-brushed-bronze",
              "/architectural",
              "/home-decor",
              "/room",
              "/cart",
              "/checkout",
            ].map((p) => (
              <Route key={p} path={p} element={<Navigate to="/coming-soon" replace />} />
            ))}

            {/* Admin */}
            <Route path="/admin" element={<Navigate to="/manage/pages" replace />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />

            {/* Iframe-only preview surface for generating Object thumbnails. */}
            <Route path="/preview/object/:key" element={<ObjectPreview />} />

            {/* Landing pages (DB-backed, scheduled). */}
            {customLandingPages.map(({ slug, component: Component }) => (
              <Route key={slug} path={`/landing/${slug}`} element={<Component />} />
            ))}
            <Route path="/landing/:slug" element={<LandingPage />} />

            {/* Objects — each curated marketing section rendered in isolation. */}
            <Route path="/objects/:slug" element={<ObjectRoute />} />

            {/* Static test page that embeds the Team object. */}
            <Route path="/test-page" element={<TestPage />} />
            <Route path="/race-test-page" element={<RaceTestPage />} />

            {/* Dynamic pages created from the Site Manager (DB-backed). */}
            <Route path="/:slug" element={<DbPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </InlineEditsLayer>
      </main>
      {!isAdmin && !isObjectRoute && !isLandingRoute && <Footer />}
      {!isAdmin && isLandingRoute && <LandingFooter />}
      <PageSaveReminderButton />
    </>
  );
};

const App = () => {
  // Public landing subdomain: bypass auth gate, site chrome, and admin routes.
  // Only Ready + Live + in-window landing pages are reachable (enforced by RLS).
  if (isPublicLandingHost()) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PublicLandingApp />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
              <AdminGate>
                <AppShell />
              </AdminGate>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
};

export default App;
