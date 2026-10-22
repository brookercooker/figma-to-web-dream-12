/** Explicit gap positions take precedence over the selected block; otherwise append. */
export function pageInsertPosition(blocks: readonly { id: string }[], activeId: string, at?: number | null): number {
  const selected = blocks.findIndex((block) => block.id === activeId);
  return Math.max(0, Math.min(blocks.length, at ?? (selected < 0 ? blocks.length : selected + 1)));
}

/** A dismissed picker never changes the page's block list. */
export function insertPickedBlock<T>(blocks: T[], block: T | null, at: number): T[] {
  if (block === null) return blocks;
  const position = Math.max(0, Math.min(blocks.length, at));
  return [...blocks.slice(0, position), block, ...blocks.slice(position)];
}