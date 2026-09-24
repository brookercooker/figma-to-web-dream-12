import { MiniFrame } from "./ObjectMiniPreview";
import { parseBlocks } from "@/components/PageBlocks";
import { canIframe, previewSrc, InlinePagePreview } from "./DesignTab";

/** Live scaled-down page preview (no screenshot service needed). */
export default function PageMiniPreview({ name, path, content }: { name: string; path: string; content?: unknown }) {
  return (
    <MiniFrame render={() => {
      const bl = parseBlocks(content);
      return !bl.length && canIframe(path) ? (
        <iframe src={`${previewSrc(path)}?thumb=1`} title="" tabIndex={-1} loading="lazy" className="border-0" style={{ width: 1280, height: 800 }} />
      ) : (
        <InlinePagePreview name={name} blocks={bl} />
      );
    }} />
  );
}
