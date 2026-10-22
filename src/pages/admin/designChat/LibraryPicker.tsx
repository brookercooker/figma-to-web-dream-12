import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { Box, ExternalLink, Film, Image as ImageIcon, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { imageMatches, loadLibraryImages } from "../ImagePickerDialog";
import { loadLibraryVideos, videoMatches } from "../VideoPickerDialog";
import { loadLibraryObjects, objectMatches } from "../ObjectPickerDialog";
import { matchesLabelFilter } from "../labelPath";
import { useLabelsForScope } from "../useAllLabels";
import LibraryCard from "./LibraryCard";
import LibraryFilterBar, { type BuiltFilter } from "./LibraryFilterBar";
import type { ChatReference } from "./references";

export type LibraryKind = "images" | "videos" | "objects";
const PAGE = 60;
const NOUN = { images: "images", videos: "videos", objects: "objects" } as const;
const FULL = { images: "Images", videos: "Videos", objects: "Objects" } as const;
const TITLE = { images: "Pick an image", videos: "Pick a video", objects: "Pick an object" } as const;

type Row = { ref: ChatReference; search: (term: string) => boolean; labels: string[]; note?: string; inCode?: boolean };

/** Load the library through the same loaders the page editor's pickers use. */
async function loadRows(kind: LibraryKind): Promise<Row[]> {
  if (kind === "images") {
    return (await loadLibraryImages(2000)).map((i, n) => ({
      ref: { kind: "image", id: i.id ?? i.url ?? String(n), name: i.name || i.alt || "Untitled image", url: i.url, labels: i.labels, thumb: i.url },
      search: (t) => imageMatches(i, t), labels: i.labels,
    }));
  }
  if (kind === "videos") {
    return (await loadLibraryVideos(2000)).map((v, n) => ({
      ref: { kind: "video", id: v.id ?? v.url ?? String(n), name: v.name || "Untitled video", url: v.url, altUrl: v.altUrl, poster: v.poster, labels: v.labels, thumb: v.poster },
      search: (t) => videoMatches(v, t), labels: v.labels,
    }));
  }
  return (await loadLibraryObjects()).map((o) => {
    const type = o.component_key ? "built in code" : "built in the Site Manager";
    return {
      ref: { kind: "object", id: o.id, name: o.name, componentKey: o.component_key, type, thumb: o.thumbnail_url ?? undefined },
      search: (t) => objectMatches(o, t), labels: o.labels ?? [], note: type, inCode: !!o.component_key,
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
  const [labelF, setLabelF] = useState("");
  const [built, setBuilt] = useState<BuiltFilter>("all");
  const [limit, setLimit] = useState(PAGE);
  const [keepOpen, setKeepOpen] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const picked = useRef(false); // after a pick, the chat box keeps focus instead of the tab button

  const { data: labelRows = [], refetch } = useLabelsForScope(kind);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const allLabels = useMemo(() => labelRows.map((r) => r.path).sort((a, b) => a.localeCompare(b)), [labelRows]);

  useEffect(() => {
    if (!open) return;
    setTerm(""); setLabelF(""); setBuilt("all"); setLimit(PAGE); setAdded(new Set()); setKeepOpen(false);
    void refetchRef.current();
    let live = true;
    setRows(null);
    loadRows(kind).then((r) => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [open, kind]);

  const matches = useMemo(() => (rows ?? [])
    .filter((r) => r.search(term) && (!labelF || matchesLabelFilter(r.labels, labelF))
      && (built === "all" || (built === "code") === !!r.inCode))
    .sort((a, b) => a.ref.name.localeCompare(b.ref.name)), [rows, term, labelF, built]);
  useEffect(() => setLimit(PAGE), [term, labelF, built]);
  const filtering = term.trim() !== "" || labelF !== "" || built !== "all";
  const clear = () => { setTerm(""); setLabelF(""); setBuilt("all"); };
  const FallbackIcon = kind === "images" ? ImageIcon : kind === "videos" ? Film : Box;

  const pick = (r: Row) => {
    onPick(r.ref);
    if (keepOpen) { setAdded((s) => new Set(s).add(r.ref.id)); return; }
    picked.current = true;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" title={label} aria-label={label} aria-current={active ? "page" : undefined}
          aria-haspopup="dialog" aria-expanded={open} className={className}>
          <Icon className="w-4 h-4" />
          {showLabel && <span>{label}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 p-0 sm:h-[85vh]"
        onCloseAutoFocus={(e) => { if (picked.current) { e.preventDefault(); picked.current = false; } }}>
        <div className="space-y-3 border-b p-4 pr-12 sm:p-5 sm:pr-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <DialogTitle>{TITLE[kind]}</DialogTitle>
            <button type="button" onClick={() => { setOpen(false); onOpenFull(); }}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open full {FULL[kind]} page
            </button>
          </div>
          <DialogDescription className="sr-only">Search and pick {NOUN[kind]} to add to the chat.</DialogDescription>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} aria-label={`Search ${NOUN[kind]}`}
              placeholder={`Search ${NOUN[kind]} by name or label…`} className="h-11 pl-9 text-base" />
          </div>
          <LibraryFilterBar labels={allLabels} label={labelF} setLabel={setLabelF} built={built} setBuilt={setBuilt}
            showBuilt={kind === "objects"} shown={Math.min(limit, matches.length)} total={matches.length} filtering={filtering} onClear={clear} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {rows === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading {NOUN[kind]}…</div>
          ) : matches.length === 0 ? (
            <div className="space-y-2 py-10 text-center">
              <p className="text-sm">No {NOUN[kind]} match</p>
              <p className="text-xs text-muted-foreground">Try fewer words or clear the filters</p>
              {filtering && <Button variant="outline" size="sm" onClick={clear}>Clear filters</Button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {matches.slice(0, limit).map((r) => (
                  <LibraryCard key={r.ref.id} item={r.ref} labels={r.labels} note={r.note} added={added.has(r.ref.id)} FallbackIcon={FallbackIcon} onPick={() => pick(r)} />
                ))}
              </div>
              {matches.length > limit && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>Show more</Button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} className="h-4 w-4" />
            Keep open to add more
          </label>
          {added.size > 0 && <span className="text-xs text-muted-foreground" aria-live="polite">{added.size} added</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
