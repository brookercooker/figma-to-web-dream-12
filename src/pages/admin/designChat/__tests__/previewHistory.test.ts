import { describe, it, expect } from "vitest";
import { emptyHistory, visit, step, canBack, canForward, normalizePreviewAddress, previewAddressMatches, stripPreviewTokens } from "../previewHistory";

describe("preview history", () => {
  it("keeps Forward available after Back reports an equivalent Homepage address", () => {
    const back = step(visit(visit(emptyHistory, "/home/"), "/about"), -1);
    expect(visit(back.history, "/")).toBe(back.history);
    expect(canForward(visit(back.history, "/"))).toBe(true);
  });
  it("normalizes trailing slashes and equivalent query serialization without losing query destinations", () => {
    expect(normalizePreviewAddress("/home/?b=2&a=hello%20world")).toBe("/?a=hello+world&b=2");
    expect(previewAddressMatches("/about/?b=2&a=1", "/about", "?a=1&b=2")).toBe(true);
    expect(previewAddressMatches("/home", "/", "?offer=1")).toBe(true);
    expect(previewAddressMatches("/about?offer=1", "/about", "?offer=2")).toBe(false);
    expect(previewAddressMatches("/about", "/team")).toBe(false);
  });
  it("starts with nothing to go back or forward to", () => {
    expect(canBack(emptyHistory)).toBe(false);
    expect(canForward(emptyHistory)).toBe(false);
  });
  it("does not push the same address twice in a row", () => {
    const h = visit(visit(emptyHistory, "/"), "/");
    expect(h.entries).toEqual(["/"]);
  });
  it("Back returns the previous page and its arrival adds no entry", () => {
    let h = visit(visit(emptyHistory, "/"), "/about");
    const r = step(h, -1);
    expect(r.address).toBe("/");
    h = visit(r.history, "/");
    expect(h.entries).toEqual(["/", "/about"]);
    expect(canForward(h)).toBe(true);
    expect(canBack(h)).toBe(false);
  });
  it("Forward goes to the next page", () => {
    const h = step(visit(visit(emptyHistory, "/"), "/about"), -1).history;
    expect(step(h, 1).address).toBe("/about");
  });
  it("visiting a new page after Back drops the forward entries", () => {
    let h = step(visit(visit(emptyHistory, "/"), "/about"), -1).history;
    h = visit(h, "/team");
    expect(h.entries).toEqual(["/", "/team"]);
    expect(canForward(h)).toBe(false);
  });
  it("stepping past either end does nothing", () => {
    const h = visit(emptyHistory, "/");
    expect(step(h, -1).address).toBeNull();
    expect(step(h, 1).address).toBeNull();
  });
});

describe("preview credential stripping", () => {
  it.each([
    ["/?__lovable_token=abc", "/"],
    ["/about?__lovable_token=abc&b=2", "/about?b=2"],
    ["/about?a=1&__lovable_token=abc&__lovable_other=z", "/about?a=1"],
    ["/about?%5F%5Flovable_token=abc&a=1", "/about?a=1"],
    ["/about?lovable_token=keep&x__lovable_y=keep", "/about?lovable_token=keep&x__lovable_y=keep"],
    ["/about", "/about"],
  ])("strips only __lovable_* parameters from %s", (input, out) => {
    expect(stripPreviewTokens(input)).toBe(out);
  });
  it("matches a first page reported with the token against a later arrival without it", () => {
    expect(normalizePreviewAddress("/home?__lovable_token=abc")).toBe("/");
    expect(previewAddressMatches("/?__lovable_token=abc", "/")).toBe(true);
    expect(previewAddressMatches("/", "/", "?__lovable_token=abc")).toBe(true);
  });
  it("never stores the token in history", () => {
    const h = visit(visit(emptyHistory, "/?__lovable_token=abc&x=1"), "/team");
    expect(h.entries).toEqual(["/?x=1", "/team"]);
    expect(visit(h, "/team?__lovable_token=new")).toBe(h);
  });
});
