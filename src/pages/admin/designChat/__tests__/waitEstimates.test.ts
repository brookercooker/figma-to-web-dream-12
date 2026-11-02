import { describe, expect, it } from "vitest";
import { detectWaitKind, stageShares, timedProgress, WAIT_ESTIMATES } from "../waitEstimates";

describe("measured wait estimates", () => {
  it("uses the measured 20 second question/plan estimate", () => {
    expect(detectWaitKind("What colour is this?")).toBe("question");
    expect(detectWaitKind("Redesign every page", true)).toBe("question");
    expect(WAIT_ESTIMATES.question).toEqual([20]);
  });
  it("uses 40 + 50 for a normal change", () => { expect(detectWaitKind("Make the heading bigger")).toBe("normal"); expect(WAIT_ESTIMATES.normal).toEqual([40, 50]); });
  it("uses 75 + 50 above 200 characters", () => { expect(detectWaitKind("a".repeat(201))).toBe("bigger"); expect(WAIT_ESTIMATES.bigger).toEqual([75, 50]); });
  it("detects three requests or lists", () => { expect(detectWaitKind("Fix this. Move that. Change the title.")).toBe("bigger"); expect(detectWaitKind("Changes:\n- Fix title\n- Move photo")).toBe("bigger"); });
  it.each(["redesign", "rebuild", "layout", "rename", "everywhere", "every page", "all pages", "new page", "add a page", "two columns", "undo"])("detects %s", word => expect(detectWaitKind(word)).toBe("bigger"));
  it("uses 55 + 50 for library images and videos", () => { for (const type of ["Image", "Video"]) expect(detectWaitKind(`Add this\n\nReferences from the library:\n- ${type} \"Photo\": https://example.test/photo`)).toBe("library"); expect(WAIT_ESTIMATES.library).toEqual([55, 50]); });
  it("uses 60 total or 150 with content edits for Submit", () => { expect(WAIT_ESTIMATES.submit).toEqual([50, 10]); expect(WAIT_ESTIMATES.contentSubmit).toEqual([140, 10]); });
  it("uses 10 seconds for manual save", () => expect(WAIT_ESTIMATES.save).toEqual([10]));
  it("splits stages in proportion and jumps on a real transition", () => { expect(stageShares("normal")).toEqual([40 / 90, 50 / 90]); expect(timedProgress("normal", 1, 0, "Building").value).toBe(40 / 90); });
  it("eases to about 80% at the estimate and never completes itself", () => { expect(timedProgress("save", 0, 10, "Saving").value).toBeCloseTo(1 - Math.exp(-1.6)); expect(timedProgress("save", 0, 1e10, "Saving").value).toBeLessThan(1); expect(timedProgress("save", 0, 0, "Done", 0, true).value).toBe(1); });
  it("switches to running long after twice the stage estimate", () => { expect(timedProgress("normal", 0, 80, "Making").label).not.toMatch(/Taking/); expect(timedProgress("normal", 0, 81, "Making").label).toMatch(/Taking a bit longer/); });
  it("is identical on reload mid-wait from server elapsed time", () => { const elapsed = (45_000 - 15_000) / 1000; expect(timedProgress("normal", 0, elapsed, "Making").value).toBeCloseTo(40 / 90 * (1 - Math.exp(-30 / 40 * 1.6))); });
  it("never moves backwards", () => expect(timedProgress("normal", 0, 1, "Making", 0.6).value).toBe(0.6));
});