import { describe, it, expect } from "vitest";
import { emptyHistory, visit, step, canBack, canForward } from "../previewHistory";

describe("preview history", () => {
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
