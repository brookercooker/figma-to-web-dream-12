import { describe, it, expect } from "vitest";
import { toAbsoluteUrl } from "../absoluteUrl";

describe("toAbsoluteUrl", () => {
  const origin = window.location.origin;
  it("returns empty for empty input", () => {
    expect(toAbsoluteUrl(null)).toBe("");
    expect(toAbsoluteUrl(undefined)).toBe("");
    expect(toAbsoluteUrl("   ")).toBe("");
  });
  it("keeps absolute, data and blob URLs", () => {
    for (const u of ["https://x.com/a.png", "http://x.com/a", "data:image/png;base64,AA", "blob:abc"]) expect(toAbsoluteUrl(u)).toBe(u);
  });
  it("adds protocol to protocol-relative URLs", () => {
    expect(toAbsoluteUrl("//cdn.x.com/a.png")).toBe(`${window.location.protocol}//cdn.x.com/a.png`);
  });
  it("resolves rooted and bare paths against the origin", () => {
    expect(toAbsoluteUrl("/__l5e/a.jpg")).toBe(`${origin}/__l5e/a.jpg`);
    expect(toAbsoluteUrl("images/a.jpg")).toBe(`${origin}/images/a.jpg`);
    expect(toAbsoluteUrl("  /a.jpg  ")).toBe(`${origin}/a.jpg`);
  });
});
