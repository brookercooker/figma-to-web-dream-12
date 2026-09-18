import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/prototype/client";

interface Choice { url: string; alt: string }
interface LibraryImage extends Choice { labels: string[] }


/** Pick an image from the library, paste a URL, or upload one from the computer. */
export default function ImagePickerDialog({
  open, onOpenChange, onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (choice: Choice) => void;
}) {
  const [items, setItems] = useState<LibraryImage[]>([]);
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ(""); setUrl(""); setLabel("");
    (async () => {
      const { data } = await (supabase as any)
        .from("images")
        .select("filename,web_path,alt_text,tags")
        .is("archived_at", null)
        .limit(120);
      const mapped: LibraryImage[] = (data ?? []).map((row: any) => ({
        url: (supabase as any).storage.from("images-web").getPublicUrl(row.web_path).data.publicUrl,
        alt: row.alt_text || row.filename || "",
        labels: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
      }));
      setItems(mapped);
    })();
  }, [open]);

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.labels.forEach((l) => set.add(l)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = items.filter((i) => {
      if (label && !i.labels.includes(label)) return false;
      if (!term) return true;
      return (
        i.alt.toLowerCase().includes(term) ||
        i.labels.some((l) => l.toLowerCase().includes(term))
      );
    });
    // Sort by label first so search results group together by label.
    return list.sort((a, b) => {
      const la = (a.labels[0] ?? "\uffff").toLowerCase();
      const lb = (b.labels[0] ?? "\uffff").toLowerCase();
      return la === lb ? a.alt.localeCompare(b.alt) : la.localeCompare(lb);
    });
  }, [items, q, label]);

  const upload = async (file: File) => {
    const path = `design/${Date.now()}-${file.name}`;
    await (supabase as any).storage.from("images-web").upload(path, file);
    const publicUrl = (supabase as any).storage.from("images-web").getPublicUrl(path).data.publicUrl;
    onPick({ url: publicUrl, alt: file.name.replace(/\.[^.]+$/, "") });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader><DialogTitle>Choose an image</DialogTitle></DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search images" className="w-52" />
          <div className="flex-1 min-w-[220px] flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…or paste an image link" />
            <Button
              variant="outline"
              disabled={!url.trim()}
              onClick={() => { onPick({ url: url.trim(), alt: "" }); onOpenChange(false); }}
            >
              Use link
            </Button>
          </div>
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            />
            <Button asChild variant="outline"><span>Upload</span></Button>
          </label>
        </div>

        {allLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-xs text-muted-foreground mr-0.5">Labels</span>
            <button
              onClick={() => setLabel("")}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                label === "" ? "bg-foreground text-background border-foreground" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              All
            </button>
            {allLabels.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(label === l ? "" : l)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  label === l ? "bg-foreground text-background border-foreground" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 min-h-0 auto-rows-max content-start overflow-y-auto overscroll-contain pr-2">
          {filtered.map((it) => (
            <button
              key={it.url}
              onClick={() => { onPick(it); onOpenChange(false); }}
              className="group rounded-lg overflow-hidden border hover:border-primary transition-colors text-left"
              title={it.labels.length ? `${it.alt} — ${it.labels.join(", ")}` : it.alt}
            >
              <img src={it.url} alt={it.alt} className="w-full aspect-[4/3] object-cover bg-muted" loading="lazy" />
              {it.labels.length > 0 && (
                <span className="block truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                  {it.labels.join(" · ")}
                </span>
              )}
            </button>
          ))}
          {!filtered.length && (
            <p className="col-span-full text-sm text-muted-foreground py-6 text-center">No images found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
