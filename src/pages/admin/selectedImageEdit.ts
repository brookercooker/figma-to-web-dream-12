import type { InlineEdits, InlineSelection } from "@/components/InlineEditSurface";
export function selectedImageDelete(selection: Pick<InlineSelection, "kind" | "key"> | null, edits: InlineEdits, restore = false): InlineEdits | null {
  if (selection?.kind !== "image") return null;
  const key = `hidden:${selection.key}`;
  if (!restore && edits[key] === "1") return null;
  const next = { ...edits };
  if (restore) delete next[key]; else next[key] = "1";
  return next;
}