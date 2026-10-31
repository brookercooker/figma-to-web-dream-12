import { describe, expect, it } from "vitest";
import { libraryImageCandidates, pickTileSrc, tileSrcCandidates } from "../imageTileSrc";

describe("pickTileSrc", () => {
  it("uses stored web, fallback and original URLs without synthesizing storage paths", () => {
    expect(libraryImageCandidates({ web_url: "/__l5e/assets-v1/photo.webp", fallback_url: "/fallback.jpg", original_url: "/original.jpg" })).toEqual(["/__l5e/assets-v1/photo.webp", "/fallback.jpg", "/original.jpg"]);
    expect(tileSrcCandidates({ webUrl: "/web", fallbackUrl: "/fallback", originalUrl: "/original" })).toEqual(["/web", "/fallback", "/original"]);
  });
  const webUrl = "https://example.com/private/image.webp";
  it("uses a signed thumbnail for a gated image", () => {
    expect(pickTileSrc({ gated: true, thumb: "signed-thumb", webUrl })).toBe("signed-thumb");
  });
  it("uses a local preview while a gated thumbnail is pending", () => {
    expect(pickTileSrc({ gated: true, local: "blob:preview", webUrl })).toBe("blob:preview");
  });
  it("uses a Lovable asset URL even with gated visibility", () => {
    expect(pickTileSrc({ gated: true, webUrl: "/__l5e/assets-v1/id/photo.jpg" })).toBe("/__l5e/assets-v1/id/photo.jpg");
  });
  it("never uses a raw private staging URL regardless of visibility", () => {
    const privateUrl = "https://example.com/storage/v1/object/public/images-web-gated/photo.webp";
    expect(tileSrcCandidates({ gated: true, webUrl: privateUrl })).toEqual([]);
    expect(tileSrcCandidates({ gated: false, webUrl: privateUrl, thumb: "signed" })).toEqual(["signed"]);
  });
  it("orders candidates as thumbnail, local preview, then usable web URL", () => {
    expect(tileSrcCandidates({ gated: true, thumb: "thumb", local: "blob:local", webUrl })).toEqual(["thumb", "blob:local", webUrl]);
  });
  it("deduplicates candidates so a failed source is not retried", () => {
    expect(tileSrcCandidates({ thumb: webUrl, local: "blob:local", webUrl })).toEqual([webUrl, "blob:local"]);
  });
  it("falls back to the web URL for a non-gated image", () => {
    expect(pickTileSrc({ gated: false, webUrl })).toBe(webUrl);
  });
  it("prefers the thumbnail over the local preview", () => {
    expect(pickTileSrc({ gated: true, thumb: "signed-thumb", local: "blob:preview", webUrl })).toBe("signed-thumb");
  });
});