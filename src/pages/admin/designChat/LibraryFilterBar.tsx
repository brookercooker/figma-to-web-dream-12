import { leafOf } from "../labelPath";
import { colorFor } from "../labelColors";
import type { LabelColorOf } from "./LibraryCard";

export type BuiltFilter = "all" | "code" | "manager";
export type SortKey = "name" | "name-desc" | "newest" | "oldest" | "label" | "built";

const chip = (on: boolean) =>
  `text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? "bg-foreground text-background border-foreground" : "hover:bg-muted text-muted-foreground"}`;

/** Label chips, the objects-only "Where it's built" filter, sort, count and Clear filters. */
export default function LibraryFilterBar({ colorOf = (p) => colorFor(p), labels, label, setLabel, built, setBuilt, showBuilt, sort, setSort, showDates, shown, total, filtering, onClear }: {
  colorOf?: LabelColorOf; labels: string[]; label: string; setLabel: (l: string) => void;
  built: BuiltFilter; setBuilt: (b: BuiltFilter) => void; showBuilt: boolean;
  sort: SortKey; setSort: (s: SortKey) => void; showDates: boolean;
  shown: number; total: number; filtering: boolean; onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by label">
          <button type="button" aria-pressed={label === ""} data-picker-own-enter="" onClick={() => setLabel("")} className={chip(label === "")}>All</button>
          {labels.map((l) => {
            const c = colorOf(l), on = label === l;
            return (
              <button key={l} type="button" title={l} aria-pressed={on} data-picker-own-enter="" onClick={() => setLabel(on ? "" : l)}
                className="text-xs px-2.5 py-1 rounded-full border transition-opacity hover:opacity-80"
                style={on ? { background: c.swatch, borderColor: c.swatch, color: "white" } : { background: c.bg, borderColor: c.border, color: c.text }}>{leafOf(l)}</button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {showBuilt && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Where it's built">
            <span className="text-xs text-muted-foreground">Where it's built:</span>
            {([["all", "All"], ["code", "Built in code"], ["manager", "Built in the Site Manager"]] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={built === v} data-picker-own-enter="" onClick={() => setBuilt(v)} className={chip(built === v)}>{t}</button>
            ))}
          </div>
        )}
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Sort
          <select aria-label="Sort" className="rounded border bg-background px-1.5 py-1 text-xs text-foreground" value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)} data-picker-own-enter="">
            <option value="name">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            {showDates && <option value="newest">Newest first</option>}
            {showDates && <option value="oldest">Oldest first</option>}
            <option value="label">Label</option>
            {showBuilt && <option value="built">Where it's built</option>}
          </select>
        </label>
        <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">{shown} of {total} shown</span>
        {filtering && <button type="button" data-picker-own-enter="" onClick={onClear} className="text-xs font-medium underline-offset-2 hover:underline">Clear filters</button>}
      </div>
    </div>
  );
}
