import { pageKey } from "./registerPage";
import type { WorkingPage } from "./DesignChatContext";

export type ManualPage = WorkingPage & { id: string; page_type: string; build_status: string | null };

export function orderedManualPages(pages: readonly ManualPage[]): ManualPage[] {
  return [...pages].sort((a, b) => Number(a.page_type === "landing") - Number(b.page_type === "landing") || a.name.localeCompare(b.name) || a.path.localeCompare(b.path));
}

export function filterManualPages(pages: readonly ManualPage[], query: string): ManualPage[] {
  const term = query.trim().toLowerCase();
  return pages.filter(page => `${page.name} ${page.path}`.toLowerCase().includes(term));
}

/** Frame destinations must be internal page paths, never manager or external addresses. */
export function manualNavigationPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300 || !/^\/(?!\/)/.test(value) || /[\\\s?#\u0000-\u001f]/.test(value)) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return null; }
  if (!/^\/(?!\/)/.test(decoded) || /[\\\s?#\u0000-\u001f]/.test(decoded) || /^\/manage(?:\/|$)/i.test(decoded)) return null;
  return pageKey(value);
}

export function manualPageAtPath(pages: readonly ManualPage[], value: unknown): ManualPage | null {
  const path = manualNavigationPath(value);
  return path === null ? null : pages.find(page => pageKey(page.path) === path) ?? null;
}