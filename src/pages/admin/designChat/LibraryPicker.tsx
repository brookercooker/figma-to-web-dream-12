import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Box, ExternalLink, Film, Image as ImageIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { imageMatches, loadLibraryImages } from "../ImagePickerDialog";
import { loadLibraryVideos, videoMatches } from "../VideoPickerDialog";
import { loadLibraryObjects, objectMatches } from "../ObjectPickerDialog";
import type { ChatReference } from "./references";

export type LibraryKind = "images" | "videos" | "objects";
const SHOWN = 30;
const NOUN = { images: "images", videos: "videos", objects: "objects" } as const;
const FULL = { images: "Images", videos: "Videos", objects: "Objects" } as const;

type Row = { ref: ChatReference; search: (term: string) => boolean; sub: string };

/** Load the library through the same loaders the page editor's pickers use. */
async function loadRows(kind: LibraryKind): Promise<Row[]> {
  if (kind === "images") {
    return (await loadLibraryImages(2000)).map((i, n) => ({
      ref: { kind: "image", id: i.id ?? i.url ?? String(n), name: i.name || i.alt || "Untitled image", url: i.url, labels: i.labels, thumb: i.url },
      search: (t) => imageMatches(i, t), sub: i.labels.join(", "),
    }));
  }
  if (kind === "videos") {
    return (await loadLibraryVideos(2000)).map((v, n) => ({
      ref: { kind: "video", id: v.id ?? v.url ?? String(n), name: v.name || "Untitled video", url: v.url, altUrl: v.altUrl, poster: v.poster, labels: v.labels, thumb: v.poster },
      search: (t) => videoMatches(v, t), sub: v.labels.join(", "),
    }));
  }
  return (await loadLibraryObjects()).map((o) => {
    const type = o.component_key ? "built in code" : "built in the Site Manager";
    return {
      ref: { kind: "object", id: o.id, name: o.name, componentKey: o.component_key, type, thumb: o.thumbnail_url ?? undefined },
      search: (t) => objectMatches(o, t), sub: [type, ...(o.labels ?? [])].join(" · "),
    };
  });
}

export default function LibraryPicker({ kind, label, Icon, active, showLabel, className, onPick, onOpenFull }: {
  kind: LibraryKind; label: string; Icon: ComponentType<{ className?: string }>; active: boolean; showLabel: boolean; className: string;
  onPick: (ref: ChatReference) => void; onOpenFull: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [term, setTerm] = useState("");
  const picked = useRef(false); // after a pick, the chat box keeps focus instead of the tab button
  useEffect(() => {
    if (!open) return;
    setTerm("");
    let live = true;
    setRows(null);
    loadRows(kind).then((r) => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [open, kind]);
  const matches = useMemo(() => (rows ?? []).filter((r) => r.search(term)), [rows, term]);
  const FallbackIcon = kind === "images" ? ImageIcon : kind === "videos" ? Film : Box;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title={label} aria-label={label} aria-current={active ? "page" : undefined}
          aria-haspopup="dialog" aria-expanded={open} className={className}>
          <Icon className="w-4 h-4" />
          {showLabel && <span>{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,24rem)] p-0" onCloseAutoFocus={(e) => { if (picked.current) { e.preventDefault(); picked.current = false; } }}>
        <Command shouldFilter={false} label={`Pick from ${NOUN[kind]}`}>
          <CommandInput autoFocus value={term} onValueChange={setTerm} placeholder={`Search ${NOUN[kind]} by name or label…`} />
          <CommandList className="max-h-[min(60vh,22rem)] overflow-y-auto">
            {rows === null ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading {NOUN[kind]}…</div>
            ) : matches.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No {NOUN[kind]} match</p>
            ) : matches.slice(0, SHOWN).map((r) => (
              <CommandItem key={r.ref.id} value={r.ref.id} onSelect={() => { picked.current = true; onPick(r.ref); setOpen(false); }} className="gap-3">
                {r.ref.thumb ? <img src={r.ref.thumb} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded object-cover" />
                  : <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-muted"><FallbackIcon className="h-4 w-4 text-muted-foreground" /></span>}
                <span className="min-w-0">
                  <span className="block truncate text-sm">{r.ref.name}</span>
                  {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
                </span>
              </CommandItem>
            ))}
          </CommandList>
          {rows !== null && matches.length > SHOWN && (
            <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">Showing {SHOWN} of {matches.length}, keep typing to narrow</p>
          )}
          <button type="button" onClick={() => { setOpen(false); onOpenFull(); }}
            className="flex w-full items-center gap-2 border-t px-3 py-2.5 text-sm font-medium hover:bg-muted">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />Open full {FULL[kind]} page
          </button>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
