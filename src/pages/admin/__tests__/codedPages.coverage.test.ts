import { describe, expect, it } from "vitest";
import { codedPages } from "../codedPages";
import { customLandingPages } from "@/pages/landing/customLandingPages";

describe("editable page coverage", () => {
  it.each(["/contact", "/about", "/team", "/locations", "/full-vendor-list", "/inspiration-gallery", "/home", "/test-page", "/race-test-page"])("exposes the original component for %s", (path) => {
    expect(codedPages[path]).toBeDefined();
  });
  it("exposes every custom landing page", () => {
    expect(customLandingPages.length).toBeGreaterThan(0);
    for (const { slug, component } of customLandingPages) expect(codedPages[`/landing/${slug}`]).toBe(component);
  });
});