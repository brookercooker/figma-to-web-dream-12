import { lazy, type ComponentType, type LazyExoticComponent } from "react";

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
  "/coming-soon": lazy(() => import("@/pages/ComingSoonPage.tsx")),
};

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  if (/^(script|style|noscript|template)$/i.test(el.tagName)) return false;
  return true;
};
const hasContent = (el: Element) =>
  !!(el.textContent ?? "").trim() || !!el.querySelector("img,video,iframe,svg,form");
/** Breadcrumb trails depend on where the page is shown, so they aren't kept. */
const isCrumbs = (el: Element) => {
  const n = el.matches('nav[aria-label*="readcrumb" i],ol[aria-label*="readcrumb" i]') ? el : el.querySelector('[aria-label*="readcrumb" i]');
  return !!n && (n.textContent ?? "").trim().length >= (el.textContent ?? "").trim().length - 2;
};
const isChrome = (el: Element) =>
  /^(header|footer|nav)$/i.test(el.tagName) || el.getAttribute("role") === "banner" || el.getAttribute("role") === "contentinfo";

/** Split a rendered page into logical sections (skipping site header/footer). */
export function pageChunks(root: HTMLElement): HTMLElement[] {
  let el: HTMLElement = root;
  for (;;) {
    const kids = [...el.children].filter((k) => visible(k) && !isChrome(k) && hasContent(k)) as HTMLElement[];
    if (kids.length === 1) { el = kids[0]; continue; }
    if (!kids.length) return [el];
    const out: HTMLElement[] = [];
    for (const k of kids) {
      // A plain wrapper holding several <section>s is split further.
      const inner = [...k.children].filter((c) => visible(c) && hasContent(c)) as HTMLElement[];
      if (k.tagName !== "SECTION" && inner.length > 1 && inner.filter((c) => c.tagName === "SECTION").length >= 2) {
        out.push(...inner.filter((c) => !isChrome(c)));
      } else out.push(k);
    }
    return out.filter((c) => !isCrumbs(c));
  }
}

/** Best-effort readable name for a section. */
export function chunkName(el: HTMLElement, fallback: string): string {
  const h = el.querySelector("h1,h2,h3");
  const t = ((h as HTMLElement | null)?.innerText ?? "").replace(/\s+/g, " ").trim();
  return t ? (t.length > 40 ? `${t.slice(0, 40)}…` : t) : fallback;
}
