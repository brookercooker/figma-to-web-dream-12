import { describe, expect, it } from "vitest";
import { pageToRegister } from "../registerPage";

describe("pageToRegister", () => {
  it("registers /race-test-page with the owner's required name", () => {
    expect(pageToRegister("/race-test-page", false)).toEqual({ name: "Race Test Page", path: "/race-test-page" });
  });
  it.each(["/draft", "/objects-flyer", "/future-route"]) ("accepts the real visitor path %s", (path) => {
    expect(pageToRegister(path)?.path).toBe(path);
  });
  it("normalizes trailing slashes and title-cases the last segment", () => {
    expect(pageToRegister("/nested/NEW_product-page///")).toEqual({ name: "New Product Page", path: "/nested/NEW_product-page" });
  });
  it("rejects a reported 404", () => expect(pageToRegister("/missing", true)).toBeNull());
  it.each(["/", "/home", "/home/", "*", "/preview/object/example", "/manage", "/manage/preview", "/management", "/admin", "/admin/users", "/landing/summer-sale"])("rejects excluded address %s", (path) => {
    expect(pageToRegister(path)).toBeNull();
  });
});