import type { ComponentType, ReactNode } from "react";
import { Check, Film } from "lucide-react";
import type { ChatReference } from "./references";
import { colorFor, type LabelColor } from "../labelColors";
import { leafOf } from "../labelPath";

export type LabelColorOf = (path: string) => LabelColor;
const MAX_PILLS = 3;

/** One roomy, keyboard-focusable result card in the library picker. */
export default function LibraryCard({ item, labels, note, selected, FallbackIcon, onPick, thumbnail, colorOf = (p) => colorFor(p) }: {
  item: ChatReference; labels: string[]; note?: string; selected: boolean;
  FallbackIcon: ComponentType<{ className?: string }>; onPick: () => void; colorOf?: LabelColorOf;
  thumbnail?: ReactNode;
}) {
  return (
    <button type="button" onClick={onPick} data-picker-card="" title={item.name} aria-pressed={selected}
      className={`group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors ${selected ? "border-foreground ring-2 ring-foreground" : "hover:border-foreground/40"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}>
      <span data-thumb-frame="" className="relative block aspect-[4/3] w-full overflow-hidden bg-muted">
        <span data-thumb-fill="" className="absolute inset-0 block h-full w-full">
          {thumbnail ?? (item.thumb ? <img src={item.thumb} alt="" loading="lazy" className={`absolute inset-0 h-full w-full ${item.kind === "image" ? "object-contain object-center" : "object-cover"}`} />
            : <span className="absolute inset-0 grid h-full w-full place-items-center"><FallbackIcon className="h-8 w-8 text-muted-foreground" /></span>)}
        </span>
        {item.kind === "video" && (
          <span className="absolute left-2 top-2 rounded bg-background/85 p-1"><Film className="h-3.5 w-3.5" aria-hidden="true" /></span>
        )}
        {labels.length > 0 && (
          <span className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1" aria-label="Labels">
            {labels.slice(0, MAX_PILLS).map((l) => {
              const c = colorOf(l);
              return <span key={l} title={l} data-label-pill={l} className="max-w-full truncate rounded-full border px-1.5 py-0.5 text-[11px] leading-none shadow-sm"
                style={{ background: c.bg, borderColor: c.border, color: c.text }}>{leafOf(l)}</span>;
            })}
            {labels.length > MAX_PILLS && (
              <span title={labels.slice(MAX_PILLS).join(", ")} className="rounded-full border bg-background/90 px-1.5 py-0.5 text-[11px] leading-none text-foreground shadow-sm">+{labels.length - MAX_PILLS}</span>
            )}
          </span>
        )}
        {selected && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
            <Check className="h-3 w-3" aria-hidden="true" />Selected
          </span>
        )}
      </span>
      <span className="block space-y-0.5 p-2">
        <span className="line-clamp-2 text-sm leading-snug">{item.name}</span>
        {note && <span className="block text-xs text-muted-foreground">{note}</span>}
      </span>
    </button>
  );
}
