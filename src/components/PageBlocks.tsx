/**
 * Shared block model + renderer for pages built in the Design tab.
 * Blocks are stored as JSON on the `pages.content` column.
 */

import ObjectBlockView from "@/components/ObjectBlockView";

export type BlockAlign = "left" | "center" | "right";

export interface TextBlock {
  id: string;
  type: "heading" | "text";
  text: string;
  align: BlockAlign;
  size: "sm" | "md" | "lg" | "xl";
  bold?: boolean;
  italic?: boolean;
}

export interface ImageBlock {
  id: string;
  type: "image";
  url: string;
  alt: string;
  caption?: string;
  align: BlockAlign;
  width: 50 | 75 | 100;
}

export interface ObjectBlock {
  id: string;
  type: "object";
  /** id of the row in the object registry — rendered live, so edits flow through */
  objectId: string;
  name?: string;
  align: BlockAlign;
  /** full-bleed section converted from a coded page */
  wide?: boolean;
}

export interface VideoBlock {
  id: string;
  type: "video";
  url: string;
  poster?: string;
  caption?: string;
  align: BlockAlign;
  width: 50 | 75 | 100;
}

export type Block = TextBlock | ImageBlock | ObjectBlock | VideoBlock;

/** YouTube / Vimeo links play through their own player; everything else is a file. */
export function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `b-${Math.random().toString(36).slice(2)}`;

export const hasWideBlocks = (blocks: Block[]) => blocks.some((b) => b.type === "object" && b.wide);

export function parseBlocks(value: unknown): Block[] {
  if (Array.isArray(value)) return value as Block[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as Block[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

const alignClass: Record<BlockAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const selfClass: Record<BlockAlign, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

const headingSize: Record<TextBlock["size"], string> = {
  sm: "text-xl sm:text-2xl",
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl",
  xl: "text-4xl sm:text-5xl",
};

const bodySize: Record<TextBlock["size"], string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const widthClass: Record<ImageBlock["width"], string> = {
  50: "w-1/2",
  75: "w-3/4",
  100: "w-full",
};

export function BlockView({ block }: { block: Block }) {
  if (block.type === "object") {
    return <ObjectBlockView objectId={block.objectId} name={block.name} flush={block.wide} />;
  }

  if (block.type === "video") {
    if (!block.url) return null;
    const embed = embedSrc(block.url);
    return (
      <figure className={`${selfClass[block.align]} ${widthClass[block.width]} my-6`}>
        {embed ? (
          <iframe
            src={embed}
            title={block.caption || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video rounded-lg border-0"
          />
        ) : (
          <video
            src={block.url}
            poster={block.poster || undefined}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto rounded-lg"
          />
        )}
        {block.caption ? (
          <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "image") {
    if (!block.url) return null;
    return (
      <figure className={`${selfClass[block.align]} ${widthClass[block.width]} my-6`}>
        <img
          src={block.url}
          alt={block.alt || ""}
          loading="lazy"
          className="w-full h-auto rounded-lg object-cover"
        />
        {block.caption ? (
          <figcaption className="mt-2 text-xs text-muted-foreground">{block.caption}</figcaption>
        ) : null}
      </figure>
    );
  }

  const cls = [
    alignClass[block.align],
    block.bold ? "font-semibold" : "",
    block.italic ? "italic" : "",
  ].join(" ");

  if (block.type === "heading") {
    return (
      <h2
        className={`font-serif font-light tracking-[-0.01em] leading-tight text-foreground mt-8 mb-3 whitespace-pre-wrap ${headingSize[block.size]} ${cls}`}
      >
        {block.text}
      </h2>
    );
  }

  return (
    <p className={`text-muted-foreground leading-relaxed my-3 whitespace-pre-wrap ${bodySize[block.size]} ${cls}`}>
      {block.text}
    </p>
  );
}

export default function PageBlocks({ blocks }: { blocks: Block[] }) {
  if (!blocks.length) return null;
  return (
    <div className={blocks.some((b) => b.type === "object" && b.wide) ? "" : "max-w-3xl"}>
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}
