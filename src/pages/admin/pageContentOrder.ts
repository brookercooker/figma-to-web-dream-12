import { parseBlocks, type Block } from "@/components/PageBlocks";

export const PAGE_CONTENT = { id: "page-content", type: "page" } as const;
export type PageContentItem = Block | typeof PAGE_CONTENT;
export const isPageContent = (value: unknown): value is typeof PAGE_CONTENT => !!value && typeof value === "object" && (value as { type?: unknown }).type === "page";
/** Renderers ignore markers; only the page editor preserves their ordering. */
export function parsePageContent(value: unknown): PageContentItem[] {
  let raw = value;
  if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { return []; } }
  if (!Array.isArray(raw)) return [];
  let seen = false;
  return raw.flatMap<PageContentItem>(item => {
    if (!isPageContent(item)) return parseBlocks([item]);
    if (seen) return [];
    seen = true; return [PAGE_CONTENT];
  });
}
export function orderedPageContent(items: readonly PageContentItem[]): PageContentItem[] {
  const marker = items.findIndex(isPageContent);
  return marker < 0 ? [PAGE_CONTENT, ...items] : [...items];
}
export function movePageBlock(items: readonly PageContentItem[], id: string, toIndex: number): PageContentItem[] {
  const full = orderedPageContent(items);
  const from = full.findIndex(item => item.id === id && !isPageContent(item));
  if (from < 0 || !Number.isFinite(toIndex)) return [...items];
  const [block] = full.splice(from, 1);
  if (!block) return [...items];
  full.splice(Math.max(0, Math.min(full.length, Math.trunc(toIndex))), 0, block);
  return isPageContent(full[0]) ? full.slice(1) : full;
}