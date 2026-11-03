import { beforeEach, expect, it } from "vitest";
import { consumeContentHandoff, needsManualContentEdit, rememberContentHandoff } from "../savedContentHandoff";
beforeEach(() => sessionStorage.clear());
it("detects saved-content replies without inventing a handoff for unrelated replies", () => {
  expect(needsManualContentEdit("The video is saved in Site Manager.")).toBe(true);
  expect(needsManualContentEdit("Use Site Manager to delete it.")).toBe(true);
  expect(needsManualContentEdit("Your code change is ready.")).toBe(false);
});
it("selects only an unambiguous saved section on the matching page", () => {
  const blocks = [{ id: "video", type: "video", url: "/v.mp4" }, { id: "image", type: "image", url: "/i.jpg" }];
  rememberContentHandoff("p", "Remove the video saved in Site Manager");
  expect(consumeContentHandoff("other", blocks)).toBeNull();
  expect(consumeContentHandoff("p", blocks)).toBe("video");
  rememberContentHandoff("p", "Remove the saved section"); expect(consumeContentHandoff("p", blocks)).toBeNull();
});