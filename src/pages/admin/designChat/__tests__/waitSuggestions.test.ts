import { expect, it } from "vitest";
import { waitSuggestions, type WaitContext } from "../waitSuggestions";
const base: WaitContext = { draftCount: 0, otherDraftPages: [], otherPages: false, previewLoaded: true, device: "desktop", request: "", elapsed: 10, queued: false, available: ["phone", "tablet", "draft", "write", "queue", "manual", "videos", "library", "pages", "preview", "reminder"] };
it("returns at most three relevant suggestions and filters devices and empty draft", () => {
  const result = waitSuggestions({ ...base, device: "mobile" });
  expect(result.length).toBeLessThanOrEqual(3);
  expect(result.some(s => s.id === "phone" || s.id === "draft")).toBe(false);
});
it("offers video actions only for saved videos or a video request", () => {
  expect(waitSuggestions(base).some(s => /video/.test(s.id))).toBe(false);
  expect(waitSuggestions({ ...base, editable: true, content: [{ type: "video" }] })[0].id).toBe("saved-videos");
  expect(waitSuggestions({ ...base, request: "Replace the video" })[0].id).toBe("video-library");
});
it("rotates repeated sets while preserving the most relevant first slot", () => {
  const first = waitSuggestions(base), next = waitSuggestions(base, first.map(s => s.id));
  expect(next.map(s => s.id)).not.toEqual(first.map(s => s.id));
  expect(next[0].id).toBe(first[0].id);
});
it("replaces writing with queue review and requires genuinely other draft pages", () => {
  const result = waitSuggestions({ ...base, queued: true, draftCount: 2, otherDraftPages: ["/about"] });
  expect(result.some(s => s.id === "write")).toBe(false);
  expect(result.some(s => s.id === "queue")).toBe(true);
  expect(result.some(s => s.id === "draft")).toBe(true);
});