import { describe, expect, it } from "vitest";
import { publicPreviewBase, publicPreviewPage } from "../publicPreviewUrl";

const PUBLIC = "https://id-preview--aeb60cc1-b08d-4938-9d83-88c44335e167.lovable.app";
const MANAGER = "https://id-preview--f9b2e62f-9648-44be-ad77-9e823be093ea.lovable.app";
describe("authoritative public preview", () => {
  it("never uses the Manager embed URL or moves its token to the public project", () => {
    const base = publicPreviewBase(`${MANAGER}/preview?__lovable_token=manager-test`, PUBLIC);
    expect(publicPreviewPage(base, "/draft")).toBe(`${PUBLIC}/draft`);
  });
  it("uses exactly the public page path without the edit flag, preserving only public embed credentials", () => {
    const base = publicPreviewBase(`${PUBLIC}/preview?__lovable_token=public-test&nova-edit=1`, PUBLIC);
    expect(publicPreviewPage(base, "/draft")).toBe(`${PUBLIC}/draft?__lovable_token=public-test`);
    expect(publicPreviewPage(base, "/landing/new?view=wide")).toBe(`${PUBLIC}/landing/new?__lovable_token=public-test&view=wide`);
    expect(new URL(publicPreviewPage(base, "/home")).pathname).toBe("/");
  });
  it("rejects same-origin, non-HTTPS and external page destinations", () => {
    expect(() => publicPreviewBase(null, window.location.origin)).toThrow();
    expect(() => publicPreviewBase(null, "http://public.example")).toThrow();
    expect(() => publicPreviewPage(PUBLIC, "https://wrong.example/draft")).toThrow();
  });
});