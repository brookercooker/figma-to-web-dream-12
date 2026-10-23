/** In-app history of pages shown in the preview (Back/Forward). Pure, so it can be tested on its own. */
export type PreviewHistory = { entries: string[]; index: number };

export const emptyHistory: PreviewHistory = { entries: [], index: -1 };

/** The preview reported an address. Same as the current entry: nothing changes (re-renders, Back/Forward arrivals). */
export function visit(h: PreviewHistory, address: string): PreviewHistory {
  if (h.entries[h.index] === address) return h;
  const entries = [...h.entries.slice(0, h.index + 1), address];
  return { entries, index: entries.length - 1 };
}

export const canBack = (h: PreviewHistory) => h.index > 0;
export const canForward = (h: PreviewHistory) => h.index < h.entries.length - 1;

/** Move one step; the returned address is what the preview should load. The later visit for it is then a no-op. */
export function step(h: PreviewHistory, by: -1 | 1): { history: PreviewHistory; address: string | null } {
  const index = h.index + by;
  if (index < 0 || index >= h.entries.length) return { history: h, address: null };
  return { history: { ...h, index }, address: h.entries[index] };
}
