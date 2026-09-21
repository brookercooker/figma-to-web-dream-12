import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/prototype/client";
import { leafOf, matchesLabelFilter } from "./labelPath";
import { useLabelsForScope } from "./useAllLabels";

interface Choice { url: string; poster?: string; name: string }
interface LibraryVideo extends Choice { labels: string[] }

/** Pick a video from the library, paste a YouTube / Vimeo link, or upload a file. */
export default function VideoPickerDialog({
  open, onOpenChange, onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (choice: Choice) => void;
}) {
  const [items, setItems] = useState<LibraryVideo[]>([]);
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ(""); setUrl(""); setLabel("");
    (async () => {
      const { data } = await (supabase as any)
        .from("videos")
        .select("name,storage_url,external_url,poster_url,tags")
        .is("archived_at", null)
        .limit(120);
      const mapped: LibraryVideo[] = (data ?? [])
        .map((row: any) => ({
          url: row.external_url || row.storage_url || "",
          poster: row.poster_url || undefined,
          name: row.name || "",
          labels: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
        }))
        .filter((c: LibraryVideo) => !!c.url);
      setItems(mapped);
    })();
  }, [open]);

  // Labels come from the same per-tool label registry the Videos page uses.
  const { data: labelRows = [], refetch: refetchLabels } = useLabelsForScope("videos");
  useEffect(() => { if (open) refetchLabels(); }, [open, refetchLabels]);
  const allLabels = useMemo(
    () => labelRows.map((r) => r.path).sort((a, b) => a.localeCompare(b)),
    [labelRows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = items.filter((i) => {
      if (label && !matchesLabelFilter(i.labels, label)) return false;
      if (!term) return true;
      return (
        i.name.toLowerCase().includes(term) ||
        i.labels.some((l) => l.toLowerCase().includes(term) || leafOf(l).toLowerCase().includes(term))
      );
    });
    return list.sort((a, b) => {
      const la = (a.labels[0] ?? "\uffff").toLowerCase();
      const lb = (b.labels[0] ?? "\uffff").toLowerCase();
      return la === lb ? a.name.localeCompare(b.name) : la.localeCompare(lb);
    });
  }, [items, q, label]);

  const upload = async (file: File) => {
    const path = `design/${Date.now()}-${file.name}`;
    await (supabase as any).storage.from("videos-web").upload(path, file);
    const publicUrl = (supabase as any).storage.from("videos-web").getPublicUrl(path).data.publicUrl;
    onPick({ url: publicUrl, name: file.name.replace(/\.[^.]+$/, "") });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Choose a video</DialogTitle></DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos" className="w-52" />
          <div className="flex-1 min-w-[220px] flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="…or paste a YouTube, Vimeo, or video link"
            />
            <Button
              variant="outline"
              disabled={!url.trim()}
              onClick={() => { onPick({ url: url.trim(), name: "" }); onOpenChange(false); }}
            >
              Use link
            </Button>
          </div>
          <label className="inline-flex">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            />
            <Button asChild variant="outline"><span>Upload</span></Button>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto">
          {filtered.map((it) => (
            <button
              key={it.url + it.name}
              onClick={() => { onPick(it); onOpenChange(false); }}
              className="group rounded-lg overflow-hidden border text-left hover:border-primary transition-colors"
              title={it.name}
            >
              {it.poster ? (
                <img src={it.poster} alt={it.name} className="w-full aspect-video object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-video bg-muted" />
              )}
              <span className="block truncate px-2 py-1.5 text-xs">{it.name}</span>
            </button>
          ))}
          {!filtered.length && (
            <p className="col-span-full text-sm text-muted-foreground py-6 text-center">No videos found.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
