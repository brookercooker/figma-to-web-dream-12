import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/prototype/client";

interface ObjectRow { id: string; name: string; status?: string; description?: string; thumbnail_url?: string | null }

/** Pick a saved object to place on a page. */
export default function ObjectPickerDialog({
  open, onOpenChange, onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (choice: { id: string; name: string }) => void;
}) {
  const [items, setItems] = useState<ObjectRow[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    (async () => {
      const { data } = await (supabase as any)
        .from("object_registry")
        .select("id,name,status,description,thumbnail_url")
        .is("archived_at", null)
        .order("name", { ascending: true });
      setItems((data ?? []) as ObjectRow[]);
    })();
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((o) => `${o.name} ${o.description ?? ""}`.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add an object</DialogTitle>
        </DialogHeader>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick({ id: o.id, name: o.name })}
              className="rounded-lg border p-3 text-left transition-colors hover:bg-muted/60"
            >
              {o.thumbnail_url ? (
                <img src={o.thumbnail_url} alt="" className="mb-2 h-28 w-full rounded-md object-cover" />
              ) : null}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{o.name}</span>
                {o.status ? (
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {o.status}
                  </span>
                ) : null}
              </div>
              {o.description ? (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.description}</p>
              ) : null}
            </button>
          ))}
          {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No objects found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
