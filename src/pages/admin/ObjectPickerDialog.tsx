import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TopDropContent } from "./designChat/TopDropPanel";
import { Input } from "@/components/ui/input";
import { supabase } from "@/prototype/client";
import ObjectThumbnail from "./ObjectThumbnail";
import { Button } from "@/components/ui/button";

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
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return `${o.name} ${o.description ?? ""} ${(o.labels ?? []).join(" ")}`.toLowerCase().includes(t);
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

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSelected(new Set());
    void loadLibraryObjects().then(setItems);
  }, [open]);

  const filtered = useMemo(() => {
    return items.filter((o) => objectMatches(o, q));
  }, [items, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TopDropContent className="gap-4 p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{onPickMany ? "Add Objects" : "Add an Object"}</DialogTitle>
        </DialogHeader>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {filtered.map((o) => (
            <Button variant="ghost"
              key={o.id}
              type="button"
              aria-pressed={onPickMany ? selected.has(o.id) : undefined}
              onClick={() => onPickMany ? setSelected(prev => { const next = new Set(prev); if (next.has(o.id)) next.delete(o.id); else next.add(o.id); return next; }) : onPick({ id: o.id, name: o.name })}
              className={`h-auto flex-col items-stretch rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 ${selected.has(o.id) ? "ring-2 ring-primary bg-accent" : ""}`}
            >
              <div className="mb-2 h-28 w-full"><ObjectThumbnail id={o.id} storedThumb={o.thumbnail_url} /></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{o.name}</span>
              </div>
              {o.description ? (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.description}</p>
              ) : null}
            </Button>
          ))}
          {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No objects found.</p>}
        </div>
        {onPickMany && <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Button type="button" variant="ghost" size="sm" disabled={!selected.size} onClick={() => setSelected(new Set())}>Deselect All</Button>
          <Button type="button" disabled={!selected.size} onClick={() => onPickMany(items.filter(o => selected.has(o.id)).map(({ id, name }) => ({ id, name })))}>Add {selected.size} {selected.size === 1 ? "Object" : "Objects"}</Button>
        </div>}
      </TopDropContent>
    </Dialog>
  );
}
