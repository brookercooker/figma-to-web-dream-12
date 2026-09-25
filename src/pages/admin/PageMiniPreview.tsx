import { MiniFrame } from "./ObjectMiniPreview";
import { parseBlocks } from "@/components/PageBlocks";
import { previewSrc, InlinePagePreview } from "./DesignTab";
import { codedPages } from "./codedPages";

/**
 * Lightweight scaled-down page preview. Coded pages render their component
 * directly (no iframe, so no second copy of the whole site boots per row).
 */
export default function PageMiniPreview({ name, path, content }: { name: string; path: string; content?: unknown }) {
  return (
    <MiniFrame render={() => {
      const bl = parseBlocks(content);
      const Coded = !bl.length ? codedPages[previewSrc(path)] : undefined;
      return Coded ? (
        <div className="pointer-events-none select-none [&_header]:!static [&_header]:!z-auto"><Coded /></div>
      ) : (
        <InlinePagePreview name={name} blocks={bl} />
      );
    }} />
  );
}
