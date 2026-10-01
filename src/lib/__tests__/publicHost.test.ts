import { describe, it, expect, vi, afterEach } from "vitest";
import { isPublicLandingHost, PUBLIC_LANDING_HOST } from "../publicHost";

// Covers the hostname switch that decides whether the app shows the gated
// Site Manager / public storefront, or the ungated public landing subdomain.

function setHostname(hostname: string) {
  vi.stubGlobal("window", { location: { hostname } });
}

describe("isPublicLandingHost", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is true on the exact public landing hostname", () => {
    setHostname(PUBLIC_LANDING_HOST);
    expect(isPublicLandingHost()).toBe(true);
  });

  it("matches case-insensitively", () => {
    setHostname(PUBLIC_LANDING_HOST.toUpperCase());
    expect(isPublicLandingHost()).toBe(true);
  });

  it("is false for the main production domain", () => {
    setHostname("novalightingcompany.com");
    expect(isPublicLandingHost()).toBe(false);
  });

  it("is false for an unrelated / dev hostname", () => {
    setHostname("localhost");
    expect(isPublicLandingHost()).toBe(false);
  });

  it("is false when window is unavailable (SSR guard)", () => {
    vi.stubGlobal("window", undefined);
    expect(isPublicLandingHost()).toBe(false);
  });
});
