/**
 * Hostname used to serve public, non-gated landing pages.
 * When the browser is on this hostname, the app skips the admin auth gate,
 * hides the SandboxBanner/site chrome, and only exposes Ready + Live landing
 * pages via RLS on the `pages` table.
 */
export const PUBLIC_LANDING_HOST = "landing.novalightingcompany.com";

/** True when the current browser is on the public landing subdomain. */
export function isPublicLandingHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.toLowerCase() === PUBLIC_LANDING_HOST;
}
