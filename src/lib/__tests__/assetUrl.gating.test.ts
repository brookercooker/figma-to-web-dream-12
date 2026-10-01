import { describe, it, expect, afterEach } from "vitest";
import {
  GATED_BUCKET,
  PUBLIC_BUCKET,
  VIDEO_GATED_BUCKET,
  isGatedUrl,
  gatedBucketOf,
  gatedPathFromUrl,
  publicTwin,
  resolveAssetUrl,
  clearAssetUrlCache,
} from "../assetUrl";

// Covers the gated/public bucket resolution that keeps an unpublished asset
// from ever leaking to an anonymous visitor (see SmartImage + the Images tool).

const GATED_URL = `https://x.supabase.co/storage/v1/object/sign/${GATED_BUCKET}/products/foo%20bar.jpg?token=abc`;
const PUBLIC_URL = `https://x.supabase.co/storage/v1/object/public/${PUBLIC_BUCKET}/products/foo.jpg`;
const VIDEO_GATED_URL = `https://x.supabase.co/storage/v1/object/sign/${VIDEO_GATED_BUCKET}/clips/a.mp4`;

describe("assetUrl gating", () => {
  afterEach(() => clearAssetUrlCache());

  it("identifies a gated image URL and its bucket", () => {
    expect(isGatedUrl(GATED_URL)).toBe(true);
    expect(gatedBucketOf(GATED_URL)).toBe(GATED_BUCKET);
  });

  it("identifies a gated video URL and its bucket", () => {
    expect(isGatedUrl(VIDEO_GATED_URL)).toBe(true);
    expect(gatedBucketOf(VIDEO_GATED_URL)).toBe(VIDEO_GATED_BUCKET);
  });

  it("treats a public-bucket URL as not gated", () => {
    expect(isGatedUrl(PUBLIC_URL)).toBe(false);
    expect(gatedBucketOf(PUBLIC_URL)).toBeNull();
  });

  it("treats null/undefined/empty as not gated", () => {
    expect(isGatedUrl(null)).toBe(false);
    expect(isGatedUrl(undefined)).toBe(false);
    expect(isGatedUrl("")).toBe(false);
  });

  it("maps a gated URL to its public twin bucket, preserving the rest of the URL", () => {
    const twin = publicTwin(GATED_URL);
    expect(twin).toContain(`/${PUBLIC_BUCKET}/`);
    expect(twin).not.toContain(`/${GATED_BUCKET}/`);
    expect(twin).toContain("products/foo%20bar.jpg");
  });

  it("leaves an already-public URL unchanged when asked for its twin", () => {
    expect(publicTwin(PUBLIC_URL)).toBe(PUBLIC_URL);
  });

  it("extracts and URL-decodes the object key from a gated URL", () => {
    expect(gatedPathFromUrl(GATED_URL)).toBe("products/foo bar.jpg");
  });

  it("returns null for the object key when the URL isn't gated", () => {
    expect(gatedPathFromUrl(PUBLIC_URL)).toBeNull();
  });

  it("resolveAssetUrl passes a public URL through untouched", async () => {
    await expect(resolveAssetUrl(PUBLIC_URL)).resolves.toBe(PUBLIC_URL);
  });

  it("resolveAssetUrl resolves empty/null input to an empty string", async () => {
    await expect(resolveAssetUrl(null)).resolves.toBe("");
    await expect(resolveAssetUrl(undefined)).resolves.toBe("");
  });

  it("resolveAssetUrl resolves a gated URL to its public twin (prototype-mode: no signing round-trip)", async () => {
    const resolved = await resolveAssetUrl(GATED_URL);
    expect(resolved).toContain(`/${PUBLIC_BUCKET}/`);
  });

  it("memoizes resolution so a repeated lookup returns the same promise's result", async () => {
    const first = await resolveAssetUrl(GATED_URL);
    const second = await resolveAssetUrl(GATED_URL);
    expect(second).toBe(first);
  });

  it("clearAssetUrlCache allows the next resolution to recompute", async () => {
    const first = await resolveAssetUrl(GATED_URL);
    clearAssetUrlCache();
    const second = await resolveAssetUrl(GATED_URL);
    expect(second).toBe(first);
  });
});
