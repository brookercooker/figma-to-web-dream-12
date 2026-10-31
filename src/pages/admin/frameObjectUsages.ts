import { pageKey } from "./designChat/registerPage";
import type { FrameSection } from "./frameSections";

// Trusted frame snapshots are session metadata, never saved as page content.
const placements = new Map<string, Set<string>>();
export function rememberFrameObjects(path: string, sections: FrameSection[]) {
  placements.set(pageKey(path), new Set(sections.flatMap(s => s.objectId ? [s.objectId] : [])));
}
export function frameObjectPaths(id: string) {
  return [...placements].filter(([, ids]) => ids.has(id)).map(([path]) => path);
}