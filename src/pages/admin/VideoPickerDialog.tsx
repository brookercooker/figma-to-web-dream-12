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
  const [items, setItems] = useState<Choice[]>([]);
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ(""); setUrl("");
    (async () => {
      const { data } = await (supabase as any)
        .from("videos")
        .select("name,storage_url,external_url,poster_url")
        .is("archived_at", null)
        .limit(60);
      const mapped: Choice[] = (data ?? [])
        .map((row: any) => ({
          url: row.external_url || row.storage_url || "",
          poster: row.poster_url || undefined,
          name: row.name || "",
        }))
        .filter((c: Choice) => !!c.url);
      setItems(mapped);
    })();
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? items.filter((i) => i.name.toLowerCase().includes(term)) : items;
  }, [items, q]);

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
