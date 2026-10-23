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
import LibraryCard, { type LabelColorOf } from "./LibraryCard";
import { colorFor } from "../labelColors";
import LibraryFilterBar, { type SortKey } from "./LibraryFilterBar";
import type { ChatReference } from "./references";
import { GATED_BUCKET } from "@/lib/assetUrl";
import { useImageThumbnails } from "../useAdminData";
import { pickTileSrc } from "../imageTileSrc";

export type LibraryKind = "images" | "videos" | "objects";
const PAGE = 60;
const NOUN = { images: "images", videos: "videos", objects: "objects" } as const;
const FULL = { images: "Images", videos: "Videos", objects: "Objects" } as const;
const TITLE = { images: "Pick an Image", videos: "Pick a Video", objects: "Pick an Object" } as const;

type Row = { ref: ChatReference; search: (term: string) => boolean; labels: string[]; note?: string; createdAt?: string; visibility?: string; webPath?: string };

/** Thumbnail-only state: never modifies the reference returned by the picker. */
function ImageThumbnail({ src }: { src: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src) return <span className="block h-full w-full animate-pulse bg-muted" />;
  if (failedSrc === src) return <span className="grid h-full w-full place-items-center px-2 text-center text-xs text-muted-foreground">Preview Unavailable</span>;
  return <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />;
}

const byName = (a: Row, b: Row) => a.ref.name.localeCompare(b.ref.name);
const time = (r: Row) => { const t = r.createdAt ? Date.parse(r.createdAt) : NaN; return Number.isNaN(t) ? null : t; };
/** Order rows for the chosen sort; undated items go last in both date orders. */
export function sortRows(rows: Row[], sort: SortKey): Row[] {
  const out = [...rows];
  if (sort === "name-desc") return out.sort((a, b) => byName(b, a));
  if (sort === "newest" || sort === "oldest") return out.sort((a, b) => {
    const ta = time(a), tb = time(b);
    if (ta === null || tb === null) return ta === tb ? byName(a, b) : ta === null ? 1 : -1;
    return (sort === "newest" ? tb - ta : ta - tb) || byName(a, b);
  });
  if (sort === "label") return out.sort((a, b) => {
    const la = a.labels[0], lb = b.labels[0];
    if (!la || !lb) return la === lb ? byName(a, b) : !la ? 1 : -1;
    return la.localeCompare(lb) || byName(a, b);
  });
  return out.sort(byName);
}

/** Load the library through the same loaders the page editor's pickers use. */
async function loadRows(kind: LibraryKind): Promise<Row[]> {
  if (kind === "images") {
    return (await loadLibraryImages(2000)).map((i, n) => ({
      ref: { kind: "image", id: i.id ?? i.url ?? String(n), name: i.name || i.alt || "Untitled image", url: i.url, labels: i.labels, thumb: i.url },
      search: (t) => imageMatches(i, t), labels: i.labels, createdAt: i.createdAt,
      visibility: i.visibility, webPath: i.webPath,
    }));
  }
  if (kind === "videos") {
    return (await loadLibraryVideos(2000)).map((v, n) => ({
      ref: { kind: "video", id: v.id ?? v.url ?? String(n), name: v.name || "Untitled video", url: v.url, altUrl: v.altUrl, poster: v.poster, labels: v.labels, thumb: v.poster },
      search: (t) => videoMatches(v, t), labels: v.labels, createdAt: v.createdAt,
    }));
  }
  return (await loadLibraryObjects()).map((o) => {
    const type = o.component_key ? "built in code" : "built in the Site Manager";
    return {
      ref: { kind: "object", id: o.id, name: o.name, componentKey: o.component_key, type, thumb: o.thumbnail_url ?? undefined },
      search: (t) => objectMatches(o, t), labels: o.labels ?? [], note: type, createdAt: o.createdAt,
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
  const [limit, setLimit] = useState(PAGE);
  const [sort, setSort] = useState<SortKey>("name");
  const [selected, setSelected] = useState<Row[]>([]);
  const picked = useRef(false); // after a pick, the chat box keeps focus instead of the tab button

  const { data: labelRows = [], refetch } = useLabelsForScope(kind);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const colorOf = useMemo<LabelColorOf>(() => {
    const idx = new Map(labelRows.map((r: any) => [r.path as string, (r.color_index ?? null) as number | null]));
    const cache = new Map<string, ReturnType<typeof colorFor>>();
    return (p) => { let c = cache.get(p); if (!c) { c = colorFor(p, idx.get(p) ?? null); cache.set(p, c); } return c; };
  }, [labelRows]);
  const allLabels = useMemo(() => labelRows.map((r) => r.path).sort((a, b) => a.localeCompare(b)), [labelRows]);

  useEffect(() => {
    if (!open) return;
    setTerm(""); setLabelF(""); setSort("name"); setLimit(PAGE); setSelected([]);
    void refetchRef.current();
    let live = true;
    setRows(null);
    loadRows(kind).then((r) => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [open, kind]);

  const matches = useMemo(() => sortRows((rows ?? [])
    .filter((r) => r.search(term) && (!labelF || matchesLabelFilter(r.labels, labelF))), sort), [rows, term, labelF, sort]);
  const showDates = useMemo(() => (rows ?? []).some((r) => !!r.createdAt), [rows]);
  useEffect(() => setLimit(PAGE), [term, labelF]);
  const shown = useMemo(() => matches.slice(0, limit), [matches, limit]);
  const publicPaths = useMemo(() => open && kind === "images"
    ? shown.filter((r) => r.visibility !== "gated").flatMap((r) => r.webPath ? [r.webPath] : []) : [], [open, kind, shown]);
  const gatedPaths = useMemo(() => open && kind === "images"
    ? shown.filter((r) => r.visibility === "gated").flatMap((r) => r.webPath ? [r.webPath] : []) : [], [open, kind, shown]);
  const { data: publicThumbs = {} } = useImageThumbnails("images-web", publicPaths, 320);
  const { data: gatedThumbs = {} } = useImageThumbnails(GATED_BUCKET, gatedPaths, 320);
  const filtering = term.trim() !== "" || labelF !== "";
  const clear = () => { setTerm(""); setLabelF(""); };
  const FallbackIcon = kind === "images" ? ImageIcon : kind === "videos" ? Film : Box;

  const selectedIds = useMemo(() => new Set(selected.map((r) => r.ref.id)), [selected]);
  const toggle = (r: Row) => setSelected((s) => s.some((x) => x.ref.id === r.ref.id) ? s.filter((x) => x.ref.id !== r.ref.id) : [...s, r]);
  const finish = () => {
    if (selected.length === 0) return;
    selected.forEach((r) => onPick(r.ref));
    picked.current = true;
    setOpen(false);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  const countRef = useRef(0);
  countRef.current = selected.length;

  /** Enter finishes from anywhere in the popup, except controls that own Enter. */
  const handleEnter = (e: KeyboardEvent) => {
    if (e.key !== "Enter" || e.isComposing || e.defaultPrevented) return;
    const t = e.target instanceof Element ? e.target : null;
    if (t?.closest("[data-picker-own-enter]")) return;
    if (countRef.current === 0) return; // cards select natively; elsewhere nothing happens
    e.preventDefault();
    finishRef.current();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (!(e.target instanceof Element && e.target.closest("[role=dialog]"))) handleEnter(e); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        onKeyDown={(e) => handleEnter(e.nativeEvent)}
        onCloseAutoFocus={(e) => { if (picked.current) { e.preventDefault(); picked.current = false; } }}>
        <div className="space-y-3 border-b p-4 pr-12 sm:p-5 sm:pr-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <DialogTitle>{TITLE[kind]}</DialogTitle>
            <button type="button" onClick={() => { setOpen(false); onOpenFull(); }}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open {FULL[kind]} Page
            </button>
          </div>
          <DialogDescription className="sr-only">Search and Pick {NOUN[kind]} to add to the chat.</DialogDescription>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input autoFocus value={term} onChange={(e) => setTerm(e.target.value)} aria-label={`Search ${NOUN[kind]}`}
              placeholder={`Search ${NOUN[kind]} by name or label…`} className="h-11 pl-9 text-base"
 />
          </div>
          <LibraryFilterBar colorOf={colorOf} labels={allLabels} label={labelF} setLabel={setLabelF}
            sort={sort} setSort={setSort} showDates={showDates} shown={Math.min(limit, matches.length)} total={matches.length} filtering={filtering} onClear={clear} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {rows === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading {NOUN[kind]}…</div>
          ) : matches.length === 0 ? (
            <div className="space-y-2 py-10 text-center">
              <p className="text-sm">No {NOUN[kind]} match</p>
              <p className="text-xs text-muted-foreground">Try fewer words or clear the filters</p>
              {filtering && <Button variant="outline" size="sm" onClick={clear}>Clear Filters</Button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {shown.map((r) => (
                  <LibraryCard key={r.ref.id} item={r.ref} labels={r.labels} note={r.note} selected={selectedIds.has(r.ref.id)} FallbackIcon={FallbackIcon} colorOf={colorOf} onPick={() => toggle(r)}
                    thumbnail={kind === "images" ? <ImageThumbnail src={pickTileSrc({
                      gated: r.visibility === "gated",
                      thumb: r.webPath ? (r.visibility === "gated" ? gatedThumbs : publicThumbs)[r.webPath] : undefined,
                      webUrl: r.ref.url ?? "",
                    })} /> : undefined} />
                ))}
              </div>
              {matches.length > limit && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" data-picker-own-enter="" onClick={() => setLimit((l) => l + PAGE)}>Show More</Button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
          <div className="flex flex-col">
            <span className="text-sm" aria-live="polite">{selected.length > 0 ? `${selected.length} selected` : "Nothing selected yet"}</span>
            <span className="text-xs text-muted-foreground">Press Enter to finish · Space selects the focused item</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" data-picker-own-enter="" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-picker-own-enter="" onClick={finish} disabled={selected.length === 0}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
