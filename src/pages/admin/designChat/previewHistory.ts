/** In-app history of pages shown in the preview (Back/Forward). Pure, so it can be tested on its own. */
export type PreviewHistory = { entries: string[]; index: number };

export const emptyHistory: PreviewHistory = { entries: [], index: -1 };

/** Canonical visitor address, retaining meaningful queries but unifying home aliases and trailing slashes. */
export function normalizePreviewAddress(address: string): string {
  const [pathname, query = ""] = stripPreviewTokens(address).split("?", 2);
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const path = trimmed === "/home" ? "/" : trimmed;
  const params = new URLSearchParams(query);
  params.sort();
  const search = params.toString();
  return path + (search ? `?${search}` : "");
}

/** Removes preview credentials (`__lovable_*` query parameters) and nothing else, so they are never compared, stored or reused. */
export function stripPreviewTokens(address: string): string {
  const q = address.indexOf("?");
  if (q < 0) return address;
  const kept = address.slice(q + 1).split("&").filter((part) => part && !/^__lovable_/i.test(decodeQueryKey(part)));
  return address.slice(0, q) + (kept.length ? `?${kept.join("&")}` : "");
}
function decodeQueryKey(part: string): string {
  const key = part.split("=", 1)[0];
  try { return decodeURIComponent(key.replace(/\+/g, " ")); } catch { return key; }
}

/** A path-only destination permits a site's default query; explicit queries must match. */
export function previewAddressMatches(expected: string, path: string, search = ""): boolean {
  const expect = normalizePreviewAddress(expected);
  const actual = normalizePreviewAddress(path + (path.includes("?") ? "" : search));
  return expect === actual || (!expect.includes("?") && expect === actual.split("?")[0]);
}

/** The preview reported an address. Same as the current entry: nothing changes (re-renders, Back/Forward arrivals). */
export function visit(h: PreviewHistory, address: string): PreviewHistory {
  if (h.entries[h.index] !== undefined && normalizePreviewAddress(h.entries[h.index]) === normalizePreviewAddress(address)) return h;
  const entries = [...h.entries.slice(0, h.index + 1), stripPreviewTokens(address)];
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
