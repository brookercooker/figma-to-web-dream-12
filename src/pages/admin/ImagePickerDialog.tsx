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
  const [items, setItems] = useState<Choice[]>([]);
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ(""); setUrl("");
    (async () => {
      const { data } = await (supabase as any)
        .from("images")
        .select("filename,web_path,alt_text")
        .is("archived_at", null)
        .limit(60);
      const mapped: Choice[] = (data ?? []).map((row: any) => ({
        url: (supabase as any).storage.from("images-web").getPublicUrl(row.web_path).data.publicUrl,
        alt: row.alt_text || row.filename || "",
      }));
      setItems(mapped);
    })();
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? items.filter((i) => i.alt.toLowerCase().includes(term)) : items;
  }, [items, q]);

  const upload = async (file: File) => {
    const path = `design/${Date.now()}-${file.name}`;
    await (supabase as any).storage.from("images-web").upload(path, file);
    const publicUrl = (supabase as any).storage.from("images-web").getPublicUrl(path).data.publicUrl;
    onPick({ url: publicUrl, alt: file.name.replace(/\.[^.]+$/, "") });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
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

        <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto">
          {filtered.map((it) => (
            <button
              key={it.url}
              onClick={() => { onPick(it); onOpenChange(false); }}
              className="group rounded-lg overflow-hidden border hover:border-primary transition-colors"
              title={it.alt}
            >
              <img src={it.url} alt={it.alt} className="w-full aspect-square object-cover" loading="lazy" />
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
