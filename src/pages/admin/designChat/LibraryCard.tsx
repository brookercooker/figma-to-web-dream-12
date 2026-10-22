import type { ComponentType } from "react";
import { Check, Film } from "lucide-react";
import type { ChatReference } from "./references";

/** One roomy, keyboard-focusable result card in the library picker. */
export default function LibraryCard({ item, labels, note, selected, FallbackIcon, onPick }: {
  item: ChatReference; labels: string[]; note?: string; selected: boolean;
  FallbackIcon: ComponentType<{ className?: string }>; onPick: () => void;
}) {
  return (
    <button type="button" onClick={onPick} title={item.name} aria-pressed={selected}
      className={`group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-colors ${selected ? "border-foreground ring-2 ring-foreground" : "hover:border-foreground/40"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}>
      <span className="relative block aspect-[4/3] w-full bg-muted">
        {item.thumb ? <img src={item.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          : <span className="grid h-full w-full place-items-center"><FallbackIcon className="h-8 w-8 text-muted-foreground" /></span>}
        {item.kind === "video" && (
          <span className="absolute left-2 top-2 rounded bg-background/85 p-1"><Film className="h-3.5 w-3.5" aria-hidden="true" /></span>
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
        {labels.length > 0 && <span className="block truncate text-xs text-muted-foreground">{labels.join(", ")}</span>}
      </span>
    </button>
  );
}
