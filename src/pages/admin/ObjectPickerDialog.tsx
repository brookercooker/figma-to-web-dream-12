import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TopDropContent } from "./designChat/TopDropPanel";
import { Input } from "@/components/ui/input";
import { supabase } from "@/prototype/client";
import ObjectThumbnail from "./ObjectThumbnail";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check, X } from "lucide-react";
import { countObjectLabels, filterObjects, hiddenSelectedCount, labelKey, objectLabels, objectSearchMatches, recentObjectLabels, type LabelMode } from "./objectLabelFilter";

const RECENT_LABELS_KEY = "nova:picker-recent-labels";
function readRecentLabels(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_LABELS_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map(labelKey).slice(0, 3) : [];
  } catch { return []; }
}

export interface ObjectRow { id: string; name: string; status?: string; description?: string; thumbnail_url?: string | null; component_key?: string | null; labels?: string[] | null; createdAt?: string }

/** Saved objects as the page editor uses them: an object block stores `objectId` (this row's id) and `name`. */
export async function loadLibraryObjects(): Promise<ObjectRow[]> {
  const { data } = await (supabase as any)
    .from("object_registry")
    .select("id,name,description,thumbnail_url,component_key,labels,created_at")
    .is("archived_at", null)
    .order("name", { ascending: true });
  return ((data ?? []) as any[]).map(({ created_at, ...o }) => ({ ...o, createdAt: created_at ?? undefined })) as ObjectRow[];
}

/** Same search the picker uses (name and description), plus labels. */
export function objectMatches(o: ObjectRow, term: string) {
  return objectSearchMatches(o, term);
}

/** Pick a saved object to place on a page. */
export default function ObjectPickerDialog({
  open, onOpenChange, onPick, onPickMany,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (choice: { id: string; name: string }) => void;
  onPickMany?: (choices: { id: string; name: string }[]) => void;
}) {
  const [items, setItems] = useState<ObjectRow[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [labels, setLabels] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<LabelMode>("any");
  const [labelView, setLabelView] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSelected(new Set());
    setLabels(new Set()); setMode("any"); setLabelView(false); setLabelSearch(""); setRecent(readRecentLabels());
    void loadLibraryObjects().then(setItems);
  }, [open]);

  const filtered = useMemo(() => {
    return filterObjects(items, q, labels, mode) as ObjectRow[];
  }, [items, q, labels, mode]);
  const labelCounts = useMemo(() => countObjectLabels(items), [items]);
  const alphabetic = useMemo(() => [...labelCounts].sort((a, b) => a.name.localeCompare(b.name)), [labelCounts]);
  const hidden = hiddenSelectedCount(selected, filtered);
  const clearFilters = () => { setQ(""); setLabels(new Set()); };
  const toggleLabel = (key: string) => {
    const next = new Set(labels);
    if (next.has(key)) next.delete(key);
    else {
      next.add(key);
      const updated = recentObjectLabels(recent, key); setRecent(updated);
      try { localStorage.setItem(RECENT_LABELS_KEY, JSON.stringify(updated)); } catch { /* Storage is optional. */ }
    }
    setLabels(next);
  };
  const chip = (key: string, name: string, count?: number) => <Button key={key} type="button" variant={labels.has(key) ? "default" : "outline"} aria-pressed={labels.has(key)} onClick={() => toggleLabel(key)} className="h-11 shrink-0 rounded-full px-3 sm:h-9">
    {labels.has(key) && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{name}{count !== undefined && <span>{count}</span>}
  </Button>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TopDropContent hideClose aria-describedby={undefined} className="!bottom-0 !left-0 !top-auto !visible !w-full max-w-none max-h-[90dvh] rounded-t-xl rounded-b-none gap-3 p-4 overflow-hidden sm:!bottom-auto sm:!left-auto sm:!right-0 sm:!top-0 sm:!w-[460px] sm:h-dvh sm:max-h-dvh sm:rounded-none sm:p-5">
        <div aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-full bg-muted-foreground/40 sm:hidden" />
        <DialogHeader className="min-h-11 justify-center pr-12 text-left shrink-0">
          <DialogTitle>{onPickMany ? "Add Objects" : "Add an Object"}</DialogTitle>
        </DialogHeader>
        <DialogClose asChild><Button variant="ghost" size="icon" aria-label="Close" className="absolute right-3 top-6 h-11 w-11 sm:top-5"><X className="h-5 w-5" /></Button></DialogClose>
        {labelView ? <>
          <div className="flex items-center justify-between gap-2 shrink-0"><Button variant="ghost" onClick={() => setLabelView(false)} className="h-11 px-0"><ArrowLeft className="h-4 w-4" />Back to Objects</Button><h2 className="font-medium">Labels</h2></div>
          <Input aria-label="Find a Label" value={labelSearch} onChange={e => setLabelSearch(e.target.value)} placeholder={`Find a label (${labelCounts.length} in total)`} className="h-11 shrink-0" />
          <div className="shrink-0 space-y-2"><p id="object-label-mode" className="text-sm text-muted-foreground">Show objects with</p><div role="group" aria-labelledby="object-label-mode" className="flex">
            {(["any", "all"] as const).map(value => <Button key={value} variant={mode === value ? "default" : "outline"} aria-pressed={mode === value} onClick={() => setMode(value)} className={`h-11 flex-1 ${value === "any" ? "rounded-r-none" : "rounded-l-none"}`}>{value === "any" ? "Any Label" : "All Labels"}</Button>)}
          </div></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {recent.some(key => labelCounts.some(label => label.key === key)) && <section className="mb-4 space-y-2"><h3 className="text-sm font-medium">Recently Used</h3><div className="flex flex-wrap gap-2">{recent.map(key => { const label = labelCounts.find(item => item.key === key); return label ? chip(key, label.name) : null; })}</div></section>}
            <h3 className="mb-2 text-sm font-medium">All Labels, A to Z</h3>
            {alphabetic.filter(label => label.key.includes(labelKey(labelSearch))).map(label => <label key={label.key} className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-1 text-sm"><Checkbox checked={labels.has(label.key)} onCheckedChange={() => toggleLabel(label.key)} aria-label={label.name} /><span className="min-w-0 flex-1 break-words">{label.name}</span><span className="text-muted-foreground">{label.count}</span></label>)}
          </div>
          <div className="flex shrink-0 gap-2 border-t pt-3"><Button variant="ghost" disabled={!labels.size} onClick={() => setLabels(new Set())} className="h-12 sm:h-11">Clear Labels</Button><Button onClick={() => setLabelView(false)} className="h-12 flex-1 sm:h-11">Show {filtered.length} Objects</Button></div>
        </> : <>
        <Input aria-label="Search by Name or Label" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or label" className="h-11 shrink-0" />
        <section className="min-w-0 shrink-0 space-y-2"><h2 className="text-sm font-medium">Labels</h2><div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          <Button type="button" variant={!labels.size ? "default" : "outline"} aria-pressed={!labels.size} onClick={() => setLabels(new Set())} className="h-11 shrink-0 rounded-full px-3 sm:h-9">{!labels.size && <Check className="h-3.5 w-3.5" aria-hidden="true" />}All <span>{items.length}</span></Button>
          {labelCounts.slice(0, 5).map(label => chip(label.key, label.name, label.count))}
          {labelCounts.length > 5 && <Button variant="outline" onClick={() => setLabelView(true)} className="h-11 shrink-0 rounded-full border-dashed px-3 sm:h-9">More Labels {labelCounts.length - 5}</Button>}
        </div></section>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-1"><p role="status" className="text-xs text-muted-foreground">Showing {filtered.length} of {items.length} objects{hidden > 0 ? ` · ${hidden} selected hidden by filters` : ""}</p>{(labels.size > 0 || q.length > 0) && <Button variant="ghost" onClick={clearFilters} className="h-9 px-1 text-xs">Clear Filters</Button>}</div>
        <div className="grid grid-cols-1 content-start gap-2 sm:grid-cols-2 sm:gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {filtered.map((o) => (
            <Button variant="ghost"
              key={o.id}
              type="button"
              aria-label={o.name}
              aria-pressed={onPickMany ? selected.has(o.id) : undefined}
              onClick={() => onPickMany ? setSelected(prev => { const next = new Set(prev); if (next.has(o.id)) next.delete(o.id); else next.add(o.id); return next; }) : onPick({ id: o.id, name: o.name })}
              className={`relative h-auto min-w-0 flex-row items-center justify-start gap-3 whitespace-normal rounded-lg border-2 p-2 text-left transition-colors hover:bg-muted/60 sm:flex-col sm:items-stretch sm:gap-0 sm:p-3 ${selected.has(o.id) ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <div className="h-12 w-[52px] shrink-0 overflow-hidden rounded-lg sm:mb-2 sm:h-28 sm:w-full"><ObjectThumbnail id={o.id} storedThumb={o.thumbnail_url} /></div>
              <div className="min-w-0 flex-1 pr-7 sm:pr-0"><div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{o.name}</span>
              </div>
              <div className="mt-1 flex min-w-0 flex-wrap gap-1">{objectLabels(o).slice(0, 2).map(label => <span key={labelKey(label)} className={`max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-normal ${labels.has(labelKey(label)) ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{labelCounts.find(item => item.key === labelKey(label))?.name ?? label}</span>)}{objectLabels(o).length > 2 && <span className="text-[11px] text-muted-foreground">+{objectLabels(o).length - 2}</span>}</div>
              {o.description ? (
                <p className="mt-1 hidden text-xs font-normal text-muted-foreground line-clamp-1 sm:block">{o.description}</p>
              ) : null}
              </div>
              {onPickMany && selected.has(o.id) && <span role="img" aria-label="Selected" className="absolute right-2 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground sm:top-2 sm:translate-y-0"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>}
            </Button>
          ))}
          {!filtered.length && <div className="col-span-full py-8 text-center text-sm text-muted-foreground"><p>No objects match these filters.</p><Button variant="ghost" onClick={clearFilters} className="mt-2 h-11">Clear Filters</Button></div>}
        </div>
        {onPickMany && <div className="flex shrink-0 items-center justify-between gap-2 border-t pt-3">
          <Button type="button" variant="ghost" size="sm" className="h-12 sm:h-11" disabled={!selected.size} onClick={() => setSelected(new Set())}>Deselect All</Button>
          <Button type="button" className="h-12 min-w-0 flex-1 sm:h-11" disabled={!selected.size} onClick={() => onPickMany(items.filter(o => selected.has(o.id)).map(({ id, name }) => ({ id, name })))}>{objectAddLabel(selected.size)}</Button>
        </div>}
        </>}
      </TopDropContent>
    </Dialog>
  );
}

/** The picker's add button: a hint until something is picked, then the count. */
export function objectAddLabel(count: number): string {
  return count ? `Add ${count} ${count === 1 ? "Object" : "Objects"}` : "Select objects to add";
}
