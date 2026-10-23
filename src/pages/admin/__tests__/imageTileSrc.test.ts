import { describe, expect, it } from "vitest";
import { pickTileSrc } from "../imageTileSrc";

describe("pickTileSrc", () => {
  const webUrl = "https://example.com/private/image.webp";
  it("uses a signed thumbnail for a gated image", () => {
    expect(pickTileSrc({ gated: true, thumb: "signed-thumb", webUrl })).toBe("signed-thumb");
  });
  it("uses a local preview while a gated thumbnail is pending", () => {
    expect(pickTileSrc({ gated: true, local: "blob:preview", webUrl })).toBe("blob:preview");
  });
  it("never falls back to a gated web URL", () => {
    expect(pickTileSrc({ gated: true, webUrl })).toBeNull();
  });
  it("falls back to the web URL for a non-gated image", () => {
    expect(pickTileSrc({ gated: false, webUrl })).toBe(webUrl);
  });
  it("prefers the thumbnail over the local preview", () => {
    expect(pickTileSrc({ gated: true, thumb: "signed-thumb", local: "blob:preview", webUrl })).toBe("signed-thumb");
  });
});