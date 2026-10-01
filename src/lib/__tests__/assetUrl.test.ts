import { describe, it, expect } from "vitest";
import { gatedBucketOf, isGatedUrl, gatedPathFromUrl, publicTwin, resolveAssetUrl, clearAssetUrlCache } from "../assetUrl";

const base = "https://s.example.com/storage/v1/object/public";
const gatedImg = `${base}/images-web-gated/folder/My%20Pic.webp?token=1`;
const gatedVid = `${base}/videos-web-gated/v/clip.mp4`;

describe("assetUrl", () => {
  it("detects gated buckets", () => {
    expect(gatedBucketOf(gatedImg)).toBe("images-web-gated");
    expect(gatedBucketOf(gatedVid)).toBe("videos-web-gated");
    expect(gatedBucketOf(`${base}/images-web/a.webp`)).toBeNull();
    expect(gatedBucketOf(null)).toBeNull();
    expect(isGatedUrl(gatedImg)).toBe(true);
    expect(isGatedUrl("/a.png")).toBe(false);
  });
  it("extracts the decoded object key without query", () => {
    expect(gatedPathFromUrl(gatedImg)).toBe("folder/My Pic.webp");
    expect(gatedPathFromUrl(`${base}/images-web/a.webp`)).toBeNull();
  });
  it("maps to the public twin bucket", () => {
    expect(publicTwin(gatedImg)).toContain("/images-web/folder/");
    expect(publicTwin(gatedVid)).toBe(`${base}/videos-web/v/clip.mp4`);
    expect(publicTwin("/plain.png")).toBe("/plain.png");
  });
  it("resolves URLs (prototype mode: gated -> public twin)", async () => {
    clearAssetUrlCache();
    expect(await resolveAssetUrl(null)).toBe("");
    expect(await resolveAssetUrl("/plain.png")).toBe("/plain.png");
    expect(await resolveAssetUrl(gatedVid)).toBe(`${base}/videos-web/v/clip.mp4`);
  });
  it("memoizes resolution of the same URL", () => {
    clearAssetUrlCache();
    expect(resolveAssetUrl(gatedVid)).toBe(resolveAssetUrl(gatedVid));
  });
});
