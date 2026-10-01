import { describe, it, expect, afterEach, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BUILD_ID } from "../buildVersion";
import { inEditorPreview } from "../editorPreview";
import { isPublicLandingHost, PUBLIC_LANDING_HOST } from "../publicHost";
import { ThumbnailContext, useIsThumbnail } from "../thumbnail";
import { formatBytes } from "../imageOptimize";

afterEach(() => { window.history.replaceState(null, "", "/"); vi.restoreAllMocks(); });

describe("buildVersion", () => {
  it("is a non-empty string", () => { expect(typeof BUILD_ID).toBe("string"); expect(BUILD_ID.length).toBeGreaterThan(0); });
});

describe("inEditorPreview", () => {
  it("is true under /manage", () => { window.history.replaceState(null, "", "/manage/design"); expect(inEditorPreview()).toBe(true); });
  it("is false on public pages at top level", () => { window.history.replaceState(null, "", "/about"); expect(inEditorPreview()).toBe(false); });
  it("is true inside a frame", () => {
    window.history.replaceState(null, "", "/about");
    vi.spyOn(window, "top", "get").mockReturnValue({} as Window);
    expect(inEditorPreview()).toBe(true);
  });
});

describe("publicHost", () => {
  it("is false on localhost", () => { expect(isPublicLandingHost()).toBe(false); });
  it("uses the Nova landing host", () => { expect(PUBLIC_LANDING_HOST).toBe("landing.novalightingcompany.com"); });
});

describe("thumbnail context", () => {
  const Probe = () => createElement("span", null, String(useIsThumbnail()));
  it("defaults to false", () => { expect(renderToStaticMarkup(createElement(Probe))).toContain("false"); });
  it("is true inside the provider", () => {
    expect(renderToStaticMarkup(createElement(ThumbnailContext.Provider, { value: true }, createElement(Probe)))).toContain("true");
  });
});

describe("formatBytes", () => {
  it("formats B, KB and MB", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
