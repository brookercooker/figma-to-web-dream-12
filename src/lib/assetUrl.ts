import { supabase } from "@/prototype/client";

/**
 * Gated-asset URL resolution.
 *
 * Web derivatives are uploaded to a PRIVATE staging bucket (`images-web-gated`)
 * and only moved into the PUBLIC delivery bucket (`images-web`) when the asset
 * is published. The object key never changes, so a reference copied into page
 * code stays valid across that move — only the bucket segment differs.
 *
 * resolveAssetUrl() takes whatever URL is stored on the row and returns the URL
 * that actually works right now:
 *
 *   1. If the file has already been published, use the permanent public URL.
 *   2. Otherwise mint a short-lived signed URL — which only succeeds for a
 *      signed-in Site Manager user. Anonymous visitors (i.e. the public landing
 *      subdomain) get nothing, which is exactly the gate we want.
 */

export const GATED_BUCKET = "images-web-gated";
export const PUBLIC_BUCKET = "images-web";
export const VIDEO_GATED_BUCKET = "videos-web-gated";
export const VIDEO_PUBLIC_BUCKET = "videos-web";

/** gated bucket -> its public twin bucket */
export const GATED_PAIRS: Record<string, string> = {
  [GATED_BUCKET]: PUBLIC_BUCKET,
  [VIDEO_GATED_BUCKET]: VIDEO_PUBLIC_BUCKET,
};

/** Which gated bucket (if any) a URL points at. */
export function gatedBucketOf(url?: string | null): string | null {
  if (!url) return null;
  for (const b of Object.keys(GATED_PAIRS)) {
    if (url.includes(`/${b}/`)) return b;
  }
  return null;
}

const SIGN_TTL = 60 * 60; // 1 hour

const cache = new Map<string, Promise<string>>();

/** True when the URL points at the private staging bucket. */
export function isGatedUrl(url?: string | null): boolean {
  return gatedBucketOf(url) !== null;
}

/** Object key inside the gated bucket, or null when the URL isn't gated. */
export function gatedPathFromUrl(url: string): string | null {
  const bucket = gatedBucketOf(url);
  if (!bucket) return null;
  const marker = `/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

/** The published twin of a gated URL (same key, public bucket). */
export function publicTwin(url: string): string {
  const bucket = gatedBucketOf(url);
  if (!bucket) return url;
  return url.replace(`/${bucket}/`, `/${GATED_PAIRS[bucket]}/`);
}

// PROTOTYPE MODE: nothing is actually gated — every asset resolves straight to
// its bundled URL so images render instantly with no signing round-trip.
async function resolve(url: string): Promise<string> {
  return isGatedUrl(url) ? publicTwin(url) : url;
}

/** Memoized resolution so repeated renders don't re-sign the same object. */
export function resolveAssetUrl(url?: string | null): Promise<string> {
  if (!url) return Promise.resolve("");
  if (!isGatedUrl(url)) return Promise.resolve(url);
  let hit = cache.get(url);
  if (!hit) {
    hit = resolve(url);
    cache.set(url, hit);
  }
  return hit;
}

/** Drop cached resolutions (call after publishing/gating assets). */
export function clearAssetUrlCache() {
  cache.clear();
}
