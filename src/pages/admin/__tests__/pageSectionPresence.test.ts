import { expect, it } from "vitest";
import { hasOwnSections } from "../pageSectionPresence";
import type { FrameSection } from "../frameSections";
const section = (kind: FrameSection["kind"]): FrameSection => ({ key: kind, name: kind, kind, collapsed: false, movable: false, deletable: false });
it("does not treat shared site chrome as the page's own sections", () => {
  expect(hasOwnSections(false, [section("site")])).toBe(false);
  expect(hasOwnSections(false, null)).toBe(false);
});
it.each(["page", "object", "held"] as const)("counts %s sections reported by the frame even with no held blocks", kind => {
  expect(hasOwnSections(false, [section("site"), section(kind)])).toBe(true);
});
it("counts saved held content without a frame report", () => {
  expect(hasOwnSections(true, null)).toBe(true);
});