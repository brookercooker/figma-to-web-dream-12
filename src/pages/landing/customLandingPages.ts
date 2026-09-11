import { type LazyExoticComponent, type ComponentType } from "react";
import { lazyRetry } from "@/lib/lazyRetry";

/**
 * Registry of custom React-component landing pages.
 *
 * Any landing page implemented as a bespoke React component (rather than
 * DB-backed content rendered by `LandingPage.tsx`) MUST be registered here.
 *
 * The slug is the URL segment. Each entry is automatically wired into:
 *   - `App.tsx` (gated admin surface) at `/landing/:slug`
 *   - `PublicLandingApp.tsx` (public subdomain) at both `/:slug` and `/landing/:slug`
 *
 * To add a new custom landing page:
 *   1. Create the component under `src/pages/landing/`.
 *   2. Add a single entry below. Done — both surfaces pick it up.
 */
export type CustomLandingEntry = {
  slug: string;
  component: LazyExoticComponent<ComponentType<unknown>>;
};

export const customLandingPages: CustomLandingEntry[] = [
  {
    slug: "summer-sale",
    component: lazyRetry(() => import("./SummerSaleLandingPage")),
  },
  {
    slug: "test-landing-page",
    component: lazyRetry(() => import("./TestLandingPage")),
  },
  {
    slug: "test-of-landing-renamed",
    component: lazyRetry(() => import("./TestOfLandingRenamedPage")),
  },
  {
    slug: "jason-test",
    component: lazyRetry(() => import("./JasonTestPage")),
  },
];

export const customLandingSlugs = new Set(customLandingPages.map((e) => e.slug));
