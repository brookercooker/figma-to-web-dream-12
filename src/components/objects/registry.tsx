import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export interface RegistryEntry {
  component: LazyExoticComponent<ComponentType<unknown>> | ComponentType<unknown>;
  baseWidth?: number;
  baseHeight?: number;
}

const lazyEntry = (
  loader: () => Promise<{ default: ComponentType<unknown> }>,
  baseWidth = 1280,
  baseHeight = 800,
): RegistryEntry => ({ component: lazy(loader), baseWidth, baseHeight });

/**
 * Curated marketing sections that count as "Objects" in the Site Manager.
 *
 * IMPORTANT: this map is the ONLY component surface exposed through the Objects
 * tool and the /objects/<slug> route. Low-level components (ProductCard,
 * Header, cards, etc.) and utilities are intentionally excluded — they must
 * never appear in the Objects list.
 */
export const objectRegistry: Record<string, RegistryEntry> = {
  AboutUs:              lazyEntry(() => import("./AboutUs")),
  BrandRepresentation:  lazyEntry(() => import("./BrandRepresentation")),
  Categories:           lazyEntry(() => import("./Categories")),
  CurrentEvents:        lazyEntry(() => import("./CurrentEvents")),
  DesignServices:       lazyEntry(() => import("./DesignServices")),
  FeaturedBrandQuorum:  lazyEntry(() => import("./FeaturedBrandQuorum")),
  GoogleReviews:        lazyEntry(() => import("@/components/GoogleReviews")),
  HinkleyNewArrivals:   lazyEntry(() => import("./HinkleyNewArrivals")),
  InTheNews:            lazyEntry(() => import("./InTheNews")),
  LightingTipsTeaser:   lazyEntry(() => import("./LightingTipsTeaser")),
  LocationsTeaser:      lazyEntry(() => import("./LocationsTeaser")),
  QuorumNewArrivals:    lazyEntry(() => import("./QuorumNewArrivals")),
  RecentProjects:       lazyEntry(() => import("./RecentProjects")),
  TeamPreview:          lazyEntry(() => import("@/components/TeamPreview")),
  MailchimpForm:        lazyEntry(() => import("./MailchimpForm")),
  TestObject1:          lazyEntry(() => import("./TestObject1")),
  ShowroomFloor:        lazyEntry(() => import("./ShowroomFloor")),
  SteveObject:          lazyEntry(() => import("./SteveObject")),
  RaceSecondTest:       lazyEntry(() => import("./RaceSecondTest")),
  YouMayLike:           lazyEntry(() => import("./YouMayLike")),
  ExampleFixtureSpotlight: lazyEntry(() => import("./ExampleFixtureSpotlight")),
  ExampleServiceTiers:  lazyEntry(() => import("./ExampleServiceTiers")),
  ExampleQuoteBanner:   lazyEntry(() => import("./ExampleQuoteBanner")),
  ExampleCareGuide:     lazyEntry(() => import("./ExampleCareGuide")),
  ExampleVisitStrip:    lazyEntry(() => import("./ExampleVisitStrip")),
  ExampleTimeline:      lazyEntry(() => import("./ExampleTimeline")),
  ExampleSplitNewsletter: lazyEntry(() => import("./ExampleSplitNewsletter")),
  ExampleStatsRow:      lazyEntry(() => import("./ExampleStatsRow")),
  ExampleFaqList:       lazyEntry(() => import("./ExampleFaqList")),
};
