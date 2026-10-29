import { describe, expect, it } from "vitest";
import { imageUsageNames } from "../imageDeleteUsages";
describe("delete usage warnings", () => {
  it("includes saved page blocks and Draft object edits", () => {
    expect(imageUsageNames([{ id: "image-one", web_path: "photo.webp" }], [
      { name: "Homepage", content: [{ type: "image", src: "photo.webp" }] },
      { name: "About Us", inline_edits: { "img:0": "/photo.webp" } },
      { name: "Contact", content: [{ text: "hello" }] },
    ])).toEqual(["Homepage", "About Us"]);
  });
});