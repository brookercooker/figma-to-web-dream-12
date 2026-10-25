import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { leafOf, parentPath } from "../labelPath";
import { colorFor } from "../labelColors";
import type { LabelColorOf } from "./LibraryCard";

export type SortKey = "name" | "name-desc" | "newest" | "oldest" | "label";

/** Bounded popular chips plus a searchable, folder-grouped complete label list. */
export default function LibraryFilterBar({ colorOf = (p) => colorFor(p), labels, labelCounts = {}, label, setLabel, sort, setSort, showDates, shown, total, filtering, onClear }: {
  colorOf?: LabelColorOf; labels: string[]; labelCounts?: Record<string, number>; label: string; setLabel: (l: string) => void;
  sort: SortKey; setSort: (s: SortKey) => void; showDates: boolean;
  shown: number; total: number; filtering: boolean; onClear: () => void;
}) {
  const [more, setMore] = useState(false);
  const popular = useMemo(() => {
    const ranked = [...labels].sort((a, b) => (labelCounts[b] ?? 0) - (labelCounts[a] ?? 0) || a.localeCompare(b));
    const first = ranked.slice(0, 8);
    if (label && !first.includes(label)) return [...first.slice(0, 7), label];
    return first;
  }, [labels, labelCounts, label]);
  const groups = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const path of [...labels].sort((a, b) => a.localeCompare(b))) {
      const folder = parentPath(path);
      grouped.set(folder, [...(grouped.get(folder) ?? []), path]);
    }
    return [...grouped.entries()];
  }, [labels]);
  return (
    <div className="min-w-0 space-y-2">
      {labels.length > 0 && (
        <div className="space-y-2" role="group" aria-label="Filter by Label">
          <div className="flex items-center gap-2">
            <Button variant={label === "" ? "default" : "outline"} size="sm" className="h-7 text-xs" aria-pressed={label === ""} data-picker-own-enter="" onClick={() => setLabel("")}>All</Button>
            <Popover open={more} onOpenChange={setMore}>
              <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7 gap-1 text-xs" data-picker-own-enter="">More Labels<ChevronDown className="h-3 w-3" aria-hidden /></Button></PopoverTrigger>
              <PopoverContent align="start" className="w-80 max-w-[85vw] p-0" data-picker-own-enter="">
                <Command>
                  <CommandInput aria-label="Search Labels" placeholder="Search labels…" />
                  <CommandList aria-label="Labels">
                    <CommandEmpty>No labels match.</CommandEmpty>
                    {groups.map(([folder, paths]) => <CommandGroup key={folder} heading={folder || "Labels"}>
                      {paths.map((path) => <CommandItem key={path} value={path} aria-label={`${path}, ${labelCounts[path] ?? 0} items`} onSelect={() => { setLabel(path); setMore(false); }} className={folder ? "pl-5" : ""}>
                        <span className="min-w-0 flex-1 truncate">{leafOf(path)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{labelCounts[path] ?? 0}</span>
                        {label === path && <Check className="ml-2 h-3 w-3" aria-hidden />}
                      </CommandItem>)}
                    </CommandGroup>)}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {label && <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" aria-label="Clear Label" title="Clear Label" data-picker-own-enter="" onClick={() => setLabel("")}><X className="h-3.5 w-3.5" /></Button>}
          </div>
          <div className="grid grid-cols-4 gap-1.5" data-label-chips="">
            {popular.map((path) => {
              const c = colorOf(path), on = label === path;
              return <Button key={path} variant="outline" size="sm" title={path} aria-label={leafOf(path)} aria-pressed={on} data-picker-own-enter="" onClick={() => setLabel(on ? "" : path)}
                className="h-7 min-w-0 justify-start gap-1 rounded-full px-2 text-xs hover:opacity-80"
                style={on ? { background: c.swatch, borderColor: c.swatch, color: "var(--nova-cream, white)" } : { background: c.bg, borderColor: c.border, color: c.text }}>
                <span className="truncate">{leafOf(path)}</span><span aria-hidden className="ml-auto shrink-0">{labelCounts[path] ?? 0}</span>
              </Button>;
            })}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Sort
          <select aria-label="Sort" className="rounded border bg-background px-1.5 py-1 text-xs text-foreground" value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)} data-picker-own-enter="">
            <option value="name">Name A–Z</option><option value="name-desc">Name Z–A</option>
            {showDates && <option value="newest">Newest First</option>}{showDates && <option value="oldest">Oldest First</option>}
            <option value="label">Label</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">{shown} of {total} shown</span>
        {filtering && <Button variant="link" size="sm" data-picker-own-enter="" onClick={onClear} className="h-auto p-0 text-xs">Clear Filters</Button>}
      </div>
    </div>
  );
}
