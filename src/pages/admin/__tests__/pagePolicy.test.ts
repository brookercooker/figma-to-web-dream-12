import { describe, expect, it } from "vitest";
import { ACCESS_NOTE, canChangeStructure, codedPathOf, isCodedPath, isLandingPage, pageAccess } from "../pagePolicy";

describe("page policy", () => {
  it("landing pages are fully editable, by type or by path", () => {
    expect(pageAccess({ path: "/landing/summer-sale", page_type: "landing" })).toBe("full");
    expect(pageAccess({ path: "/landing/anything" })).toBe("full");
    expect(pageAccess({ path: "/x", page_type: "landing" })).toBe("full");
    expect(isLandingPage({ path: "/about", page_type: "static" })).toBe(false);
  });

  it("main-site pages built in code can only be tweaked", () => {
    expect(isCodedPath("/about")).toBe(true);
    expect(isCodedPath("/")).toBe(true); // the home page is /home
    expect(codedPathOf("/")).toBe("/home");
    expect(pageAccess({ path: "/about", page_type: "static" })).toBe("tweak");
    expect(pageAccess({ path: "/", page_type: "static" })).toBe("tweak");
  });

  it("other main-site pages can only be viewed or sent to the chat", () => {
    expect(isCodedPath("/some-made-up-page")).toBe(false);
    expect(pageAccess({ path: "/some-made-up-page", page_type: "static" })).toBe("view");
  });

  it("the caller can say a coded page can't be tweaked (already converted to sections)", () => {
    expect(pageAccess({ path: "/about", page_type: "static" }, { tweakable: false })).toBe("view");
    expect(pageAccess({ path: "/landing/x" }, { tweakable: false })).toBe("full");
  });

  it("only landing pages may be restructured, and the other two get an explanation", () => {
    expect(canChangeStructure("full")).toBe(true);
    expect(canChangeStructure("tweak")).toBe(false);
    expect(canChangeStructure("view")).toBe(false);
    expect(ACCESS_NOTE.tweak).toMatch(/chat/);
    expect(ACCESS_NOTE.view).toMatch(/chat/);
  });
});
