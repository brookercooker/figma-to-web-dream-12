import type { FrameSection } from "./frameSections";

export function hasOwnSections(hasHeldContent: boolean, sections: FrameSection[] | null): boolean {
  return hasHeldContent || !!sections?.some(section => section.kind !== "site");
}