import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { customLandingPages } from "@/pages/landing/customLandingPages";

/** Page components that can be broken into editable blocks, keyed by path. */
const SimplePages = () => import("@/pages/SimplePage.tsx");
export const codedPages: Record<string, LazyExoticComponent<ComponentType>> = {
  "/home": lazy(() => import("@/pages/Index.tsx")),
  "/locations": lazy(() => import("@/pages/LocationsPage.tsx")),
  "/full-vendor-list": lazy(() => import("@/pages/FullVendorListPage.tsx")),
  "/new-and-now": lazy(() => import("@/pages/NewAndNowPage.tsx")),
  "/outdoor-oasis": lazy(() => import("@/pages/OutdoorEditPage.tsx")),
  "/team": lazy(() => import("@/pages/TeamPage.tsx")),
  "/inspiration-gallery": lazy(() => import("@/pages/InspirationGalleryPage.tsx")),
  "/lighting-tips": lazy(() => import("@/pages/ObjectsLightingTips.tsx")),
  "/about": lazy(() => SimplePages().then((m) => ({ default: m.AboutPage }))),
  "/contact": lazy(() => import("@/pages/ContactPage.tsx")),
  "/contact-us-trade-account": lazy(() => import("@/pages/ContactPage.tsx")),
  "/shipping-policy": lazy(() => import("@/pages/ShippingPolicyPage")),
  "/return-policy": lazy(() => import("@/pages/ReturnPolicyPage.tsx")),
  "/privacy-policy": lazy(() => import("@/pages/PrivacyPolicyPage.tsx")),
  "/terms-conditions": lazy(() => import("@/pages/TermsConditionsPage.tsx")),
  "/objects-flyer": lazy(() => import("@/pages/ObjectsFlyer.tsx")),
  "/brand-highlight": lazy(() => import("@/pages/BrandHighlightPage.tsx")),
  "/coming-soon": lazy(() => import("@/pages/ComingSoonPage.tsx")),
  "/test-page": lazy(() => import("@/pages/TestPage.tsx")),
  "/race-test-page": lazy(() => import("@/pages/RaceTestPage.tsx")),
  ...Object.fromEntries(customLandingPages.map(({ slug, component }) => [`/landing/${slug}`, component])),
};

export { pageChunks, chunkName } from "@/lib/pageChunks";
