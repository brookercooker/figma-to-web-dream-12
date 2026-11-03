import { describe, expect, it } from "vitest";
import { ribbonSegments, type RibbonState } from "../stageRibbon";
const base: RibbonState = { received: true, changed: false, built: false, ready: false, current: 1, partial: .5, elapsed: 20 };
describe("real ribbon stages", () => {
  it("fills only finished steps and leaves future steps empty", () => {
    expect(ribbonSegments(base).map(s => s.fill)).toEqual([1, .5, 0, 0]);
    expect(ribbonSegments({ ...base, changed: true, current: 2 }).map(s => s.fill)).toEqual([1, 1, .5, 0]);
    expect(ribbonSegments({ ...base, changed: true, built: true, current: 3 }).map(s => s.fill)).toEqual([1, 1, 1, .5]);
    expect(ribbonSegments({ ...base, changed: true, built: true, ready: true }).map(s => s.fill)).toEqual([1, 1, 1, 1]);
  });
  it("cannot fill a current stage early even with an excessive estimate", () => {
    expect(ribbonSegments({ ...base, partial: 1e10 })[1].fill).toBe(.95);
  });
});