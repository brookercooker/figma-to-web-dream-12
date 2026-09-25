import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/prototype/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Copy, ExternalLink, Search, Archive, ArchiveRestore, Trash2, MoreHorizontal, Plus, Pencil, Files, RefreshCw, Type,
} from "lucide-react";
import { RenameDialog } from "./RenameDialog";
import { renameLanding } from "./renameHelpers";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TagsPanel from "./TagsPanel";
import LabelsCell from "./LabelsCell";
import SelectionBar from "./SelectionBar";
import FilterBar, { type TimeRange } from "./FilterBar";
import AddButtonRow from "./AddButtonRow";
import ConfirmDialog from "./ConfirmDialog";
import Thumbnail from "./Thumbnail";
import PageMiniPreview from "./PageMiniPreview";
import ListPager, { usePager } from "./ListPager";
import PagePreviewDialog from "./PagePreviewDialog";
import { scheduleDeleteWithUndo } from "./deferredDelete";
import CreateLandingPageDialog from "./CreateLandingPageDialog";
import { buildLandingReference, buildLandingBuildPrompt } from "./landingPrompt";
import { CopyRefButton, CopyUrlButton } from "./copyReference";
import { PUBLIC_LANDING_HOST } from "@/lib/publicHost";
import { customLandingSlugs } from "../landing/customLandingPages";

import { toRouteSlug } from "./slug";
import { formatSchedule, formatScheduleShort, isoToLocalParts, localDateToIso } from "./landingDates";
import { useAutoCaptureThumbnails, regenerateThumbnail } from "./useThumbnailCapture";

interface Landing {
  id: string;
  slug_id: string;
  name: string;
  path: string;
  description: string | null;
  notes: string | null;
  tags: string[];
  status: "draft" | "published";
  build_status: "draft" | "ready";
  start_at: string | null;
  end_at: string | null;
  archived_at: string | null;
  updated_at: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  thumbnail_updated_at: string | null;
  thumbnail_build_version: string | null;
}

import {
  workBadgeClass, workLabel,
  scheduleStatus, scheduleBadgeClass, scheduleLabel,
  type WorkStatus,
} from "./workStatus";
import LandingStatusPopover from "./LandingStatusPopover";

type FilterLabel = "Draft" | "Ready" | "Not live" | "Scheduled" | "Live" | "Expired";

function landingWork(row: Landing): WorkStatus {
  return row.build_status === "ready" ? "ready" : "draft";
}


function fmtWindow(row: Landing): string {
  const s = formatScheduleShort(row.start_at);
  const e = formatScheduleShort(row.end_at);
  if (!s && !e) return "Always on";
  if (s && e) return `${s} → ${e}`;
  if (s) return `From ${s}`;
  return `Until ${e}`;
}

async function copy(text: string, label = "Copied") {
  try { await navigator.clipboard.writeText(text); toast.success(label); }
  catch { toast.error("Copy failed"); }
}

function fmtDateTime(iso: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <>
      <div>{date}</div>
      <div>{time}</div>
    </>
  );
}
function fmtDateTimeFull(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short",
  });
}

type Field = "all" | "name" | "id" | "path" | "description" | "tags";
const FIELDS: { v: Field; label: string }[] = [
  { v: "all", label: "All fields" },
  { v: "name", label: "Name" },
  { v: "path", label: "Path" },
  { v: "description", label: "Description" },
  { v: "tags", label: "Labels" },
];

export default function LandingPagesView() {
  const [rows, setRows] = useState<Landing[]>([]);
  const [q, setQ] = useState("");
  const [searchField, setSearchField] = useState<Field>("all");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | FilterLabel>("all");
  const [sort, setSort] = useState<"name" | "name_desc" | "newest" | "oldest">("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<string[] | null>(null);
  const lastIdx = useRef<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Landing | null>(null);
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState<Landing | null>(null);
  const [preview, setPreview] = useState<Landing | null>(null);
  const [promoteConfirm, setPromoteConfirm] = useState<{
    row: Landing;
    next: { work: WorkStatus; startAt: string | null; endAt: string | null };
  } | null>(null);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("pages")
      .select("*")
      .eq("page_type", "landing")
      .order("name", { ascending: true });
    setRows((data ?? []).map((r: any) => ({ ...r, tags: r.tags ?? [] })));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const onFocus = () => load();
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Auto-capture server-side thumbnails for stale/new landing pages.
  // Skip Draft pages: their route resolves to the app's NotFound render on
  // the public subdomain (RLS hides unpublished rows from anon), which would
  // otherwise be captured as a 404 screenshot. Users can still trigger a
  // manual regenerate after promoting to Ready & publishing.
  const captureCandidates = useMemo(() =>
    rows
      .filter((r) => !r.archived_at && r.path && (r as any).build_status === "ready")
      .map((r) => ({
        kind: "page" as const,
        id: r.id,
        path: r.path,
        updated_at: r.updated_at,
        thumbnail_url: r.thumbnail_url,
        thumbnail_updated_at: r.thumbnail_updated_at,
        thumbnail_build_version: r.thumbnail_build_version,
      })), [rows]);
  useAutoCaptureThumbnails(captureCandidates, ["admin", "pages"]);

  const regenerateOne = async (r: Landing) => {
    try {
      toast.info("Regenerating thumbnail…");
      await regenerateThumbnail({
        kind: "page", id: r.id, path: r.path,
        updated_at: r.updated_at,
        thumbnail_url: r.thumbnail_url,
        thumbnail_updated_at: r.thumbnail_updated_at,
        thumbnail_build_version: r.thumbnail_build_version,
      });
      toast.success("Thumbnail regenerated");
      load();
    } catch (e: any) {
      toast.error(`Failed: ${e?.message ?? "unknown"}`);
    }
  };

  const usageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    rows.forEach((r) => r.tags?.forEach((t) => { c[t] = (c[t] ?? 0) + 1; }));
    return c;
  }, [rows]);

  const archivedCount = useMemo(() => rows.filter((r) => r.archived_at).length, [rows]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = rows
      .filter((r) => {
        if (hiddenIds.has(r.id)) return false;
        const isArchived = !!r.archived_at;
        if (showArchived ? !isArchived : isArchived) return false;
        if (tagFilters.length && !tagFilters.every((t) => (r.tags ?? []).includes(t))) return false;
        if (statusFilter !== "all") {
          const work = landingWork(r);
          const sched = scheduleStatus(work, r.start_at, r.end_at);
          const wl = workLabel(work);         // "Draft" | "Ready"
          const sl = scheduleLabel(sched);    // "Not live" | "Scheduled" | "Live" | "Expired"
          if (statusFilter !== wl && statusFilter !== sl) return false;
        }
        if (dateFrom && new Date(r.updated_at) < new Date(dateFrom)) return false;
        if (dateTo && new Date(r.updated_at) > new Date(dateTo + "T23:59:59")) return false;
        const rangeMs =
          timeRange === "hour" ? 3600e3 :
          timeRange === "day" ? 24 * 3600e3 :
          timeRange === "week" ? 7 * 24 * 3600e3 : 0;
        if (rangeMs && (Date.now() - new Date(r.updated_at).getTime()) > rangeMs) return false;
        if (needle) {
          const parts: string[] =
            searchField === "name" ? [r.name] :
            searchField === "id" ? [r.slug_id ?? ""] :
            searchField === "path" ? [r.path] :
            searchField === "description" ? [r.description ?? ""] :
            searchField === "tags" ? (r.tags ?? []) :
            [r.name, r.slug_id ?? "", r.path, r.description ?? "", ...(r.tags ?? [])];
          const hay = parts.join(" ").toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      const da = new Date(a.updated_at).getTime(), db = new Date(b.updated_at).getTime();
      return sort === "oldest" ? da - db : db - da;
    });
  }, [rows, q, searchField, tagFilters, statusFilter, sort, dateFrom, dateTo, timeRange, showArchived, hiddenIds]);
  const pager = usePager(filtered.length);


  const updateLandingStatus = async (
    id: string,
    next: { work: WorkStatus; startAt: string | null; endAt: string | null },
    opts?: { scaffoldDismissed?: boolean; skipStartingStateCheck?: boolean },
  ) => {
    const row = rows.find((r) => r.id === id);
    // Intercept transitions from Draft → Ready when the page is still in its
    // starting state (no custom React component has been built for its slug).
    if (
      row &&
      !opts?.skipStartingStateCheck &&
      row.build_status !== "ready" &&
      next.work === "ready"
    ) {
      const slug = row.path.replace(/^\/landing\//, "");
      const inStartingState = !customLandingSlugs.has(slug);
      if (inStartingState) {
        setPromoteConfirm({ row, next });
        return;
      }
    }

    const build_status = next.work === "ready" ? "ready" : "draft";
    const status = build_status === "ready" ? "published" : "draft";
    const patch: any = {
      build_status, status, start_at: next.startAt, end_at: next.endAt,
    };
    if (typeof opts?.scaffoldDismissed === "boolean") {
      patch.scaffold_dismissed = opts.scaffoldDismissed;
    }
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } as Landing : r)));
    const { error } = await (supabase as any).from("pages").update(patch).eq("id", id);
    if (error) { toast.error(error.message); load(); return; }
    toast.success("Status updated");
  };

  const updateTags = async (id: string, tags: string[]) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, tags } : r)));
    const { error } = await (supabase as any).from("pages").update({ tags }).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  };

  const applyTag = async (ids: string[], tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || !ids.length) return;
    await Promise.all(ids.map(async (id) => {
      const r = rows.find((x) => x.id === id); if (!r || r.tags.includes(t)) return;
      await (supabase as any).from("pages").update({ tags: [...r.tags, t] }).eq("id", id);
    }));
    load();
  };

  const archive = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await (supabase as any).from("pages").update({ archived_at: new Date().toISOString() }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    setSelected(new Set());
    toast(`Archived ${ids.length} landing page${ids.length === 1 ? "" : "s"}`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          await (supabase as any).from("pages").update({ archived_at: null }).in("id", ids);
          load();
        },
      },
    });
    load();
  };

  const unarchive = async (ids: string[]) => {
    if (!ids.length) return;
    const { error } = await (supabase as any).from("pages").update({ archived_at: null }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    setSelected(new Set());
    toast.success(`Restored ${ids.length} landing page${ids.length === 1 ? "" : "s"}`);
    load();
  };

  const doDeleteBulk = (ids: string[]) => {
    setConfirmBulkDelete(null);
    setSelected(new Set());
    scheduleDeleteWithUndo({
      label: `Deleted ${ids.length} landing page${ids.length === 1 ? "" : "s"}`,
      hide: () => setHiddenIds((s) => { const n = new Set(s); ids.forEach((i) => n.add(i)); return n; }),
      restore: () => setHiddenIds((s) => { const n = new Set(s); ids.forEach((i) => n.delete(i)); return n; }),
      commit: async () => {
        const { error } = await (supabase as any).from("pages").delete().in("id", ids);
        if (error) throw error;
      },
      onCommitted: () => { setHiddenIds((s) => { const n = new Set(s); ids.forEach((i) => n.delete(i)); return n; }); load(); },
    });
  };

  const toggleSelect = (id: string, idx: number, shift: boolean) => {
    const n = new Set(selected);
    if (shift && lastIdx.current !== null) {
      const [a, b] = [lastIdx.current, idx].sort((x, y) => x - y);
      for (let i = a; i <= b; i++) n.add(filtered[i].id);
    } else {
      if (n.has(id)) n.delete(id); else n.add(id);
    }
    lastIdx.current = idx;
    setSelected(n);
  };

  const duplicate = async (r: Landing) => {
    const baseName = `${r.name} (copy)`;
    const baseSlug = toRouteSlug(baseName);
    // Find a free slug
    const { data: all } = await (supabase as any).from("pages").select("path");
    const taken = new Set<string>((all ?? []).map((p: any) => (p.path ?? "").toLowerCase()));
    let slug = baseSlug; let n = 2;
    while (taken.has(`/landing/${slug}`.toLowerCase())) { slug = `${baseSlug}-${n++}`; }
    const { error } = await (supabase as any).from("pages").insert({
      name: baseName, path: `/landing/${slug}`, page_type: "landing", status: "draft",
      description: r.description ?? "", notes: "", tags: r.tags ?? [],
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Duplicated as draft");
    load();
  };

  return (
    <div className="flex gap-4 items-start">
      <TagsPanel
        scope="landing"
        usageCounts={usageCounts}
        activeFilters={tagFilters}
        onToggleFilter={(t) => setTagFilters((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t])}
        onClearFilters={() => setTagFilters([])}
        selectedCount={selected.size}
        selectedIds={[...selected]}
        onApplyTag={applyTag}
        itemLabel="landing pages"
        filteredCount={filtered.length}
        onSelectAllFiltered={() => setSelected(new Set(filtered.map((r) => r.id)))}
      />

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-stretch gap-0 rounded-lg border-2 border-border focus-within:border-primary bg-background shadow-sm overflow-hidden">
          <div className="flex items-center pl-4 pr-2 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          <Input
            placeholder="Search landing pages…"
            aria-label="Search landing pages"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 border-0 rounded-none h-14 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-2"
          />
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as Field)}
            className="text-sm px-3 border-l bg-muted/40 h-14"
            title="Search field"
            aria-label="Search field"
          >
            {FIELDS.map((f) => <option key={f.v} value={f.v}>in {f.label}</option>)}
          </select>
        </div>

        <FilterBar
          sort={sort}
          onSortChange={(v) => setSort(v as any)}
          sortOptions={[
            { v: "newest", label: "Recently modified" },
            { v: "oldest", label: "Oldest modified" },
            { v: "name", label: "Name (A–Z)" },
            { v: "name_desc", label: "Name (Z–A)" },
          ]}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          dateFieldLabel="Modified"
          status={statusFilter}
          onStatusChange={(v) => setStatusFilter(v as any)}
          statusOptions={[
            { v: "all", label: "All statuses" },
            { v: "Draft", label: "Draft" },
            { v: "Scheduled", label: "Scheduled" },
            { v: "Live", label: "Live" },
            { v: "Expired", label: "Expired" },
          ]}
          showArchived={showArchived}
          onShowArchivedChange={(v) => { setShowArchived(v); setSelected(new Set()); }}
          archivedCount={archivedCount}
        />

        <div className="flex items-center gap-3 py-2">
          <button type="button" onClick={() => navigate("/manage/design")}
            className="inline-flex items-center gap-3 px-10 py-3.5 rounded-full bg-[hsl(var(--nova-ink))] text-[hsl(var(--nova-sand))] border border-transparent shadow-md transition-all duration-300 hover:bg-[hsl(var(--nova-brass))] hover:text-[hsl(var(--nova-ink))] active:scale-[0.98]">
            <Pencil className="w-[18px] h-[18px] opacity-80" />
            <span className="text-[15px] font-medium tracking-wide uppercase">Edit Pages</span>
          </button>
          <AddButtonRow subtle text="Add new page" label="Landing Page" onClick={() => setCreating(true)} />
        </div>



        <SelectionBar
          count={selected.size}
          itemLabel="landing page"
          onClear={() => setSelected(new Set())}
        >
          {showArchived ? (
            <Button size="sm" variant="outline" onClick={() => unarchive([...selected])}>
              <ArchiveRestore className="w-3.5 h-3.5 mr-1.5" /> Restore
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => archive([...selected])}>
              <Archive className="w-3.5 h-3.5 mr-1.5" /> Archive
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => setConfirmBulkDelete([...selected])}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
          </Button>
        </SelectionBar>


        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed min-w-[1030px]">
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: 116 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 48 }} />
              <col style={{ width: 48 }} />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2"></th>

                <th className="px-3 py-2 text-left">Preview</th>
                <th className="px-3 py-2 text-left">Name &amp; Path</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-left">Schedule</th>
                <th className="px-3 py-2 text-center">Copy</th>
                <th className="px-3 py-2 text-left">Labels</th>
                <th className="px-3 py-2 text-left">Last Mod</th>
                <th className="px-2 py-2 text-center">Edit</th>
                <th className="px-2 py-2 text-center"><span className="sr-only">Open</span></th>
                <th className="px-2 py-2 text-center"><span className="sr-only">More</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">
                  {timeRange === "hour" ? "No landing pages modified in the last hour."
                  : timeRange === "day" ? "No landing pages modified in the last 24 hours."
                  : timeRange === "week" ? "No landing pages modified in the last 7 days."
                  : timeRange === "custom" && (dateFrom || dateTo) ? "No landing pages match the selected date range."
                  : showArchived ? "No archived landing pages."
                  : <>No landing pages match the current filters. Click <strong>Add New Landing Page</strong> to create one.</>}
                </td></tr>
              )}
              {filtered.slice(pager.start, pager.end).map((r, i) => { const idx = pager.start + i;
                const work = landingWork(r);
                const sched = scheduleStatus(work, r.start_at, r.end_at);
                const slug = r.path.replace(/^\/landing\//, "");
                return (
                  <tr key={r.id} className={`border-b align-top hover:bg-muted/40 ${selected.has(r.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-1 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={(e) => toggleSelect(r.id, idx, (e.nativeEvent as MouseEvent).shiftKey)}
                        aria-label={`Select ${r.name}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setPreview(r)}
                        className="block rounded hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
                        title="Open larger preview"
                      >
                        <PageMiniPreview name={r.name} path={r.path} content={(r as any).content} />
                      </button>
                    </td>
                    <td className="px-3 py-3 min-w-0" title={r.name}>
                      <div className="flex flex-col gap-0.5 min-w-0 items-start">
                        <a
                          href={r.path}
                          className="text-sm truncate max-w-full block text-left hover:underline focus:outline-none focus:underline"
                          title={r.name}
                        >
                          {r.name}
                        </a>
                        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-full" title={r.path}>
                          {r.path}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${workBadgeClass(work)}`}>
                          {workLabel(work)}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${scheduleBadgeClass(sched)}`}>
                          {scheduleLabel(sched)}
                        </span>
                        {!r.archived_at && (
                          <LandingStatusPopover
                            value={{ work, startAt: r.start_at, endAt: r.end_at }}
                            onSave={(next) => updateLandingStatus(r.id, next)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-[11px] text-muted-foreground truncate" title={fmtWindow(r)}>{fmtWindow(r)}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <CopyRefButton
                          reference={buildLandingReference(r.name, slug)}
                          id={r.slug_id}
                          label="Copy Reference"
                        />
                        {work === "ready" && (() => {
                          const publicUrl = `https://${PUBLIC_LANDING_HOST}/landing/${slug}`;
                          let value = publicUrl;
                          let title = publicUrl;
                          if (sched === "scheduled" && r.start_at) {
                            value = `This page will go live on ${fmtDateTimeFull(r.start_at)}.`;
                            title = value;
                          } else if (sched === "expired" && r.end_at) {
                            value = `This page expired on ${fmtDateTimeFull(r.end_at)}.`;
                            title = value;
                          } else if (sched === "not-live") {
                            value = `This page is Ready but has no scheduled go-live date.`;
                            title = value;
                          }
                          return <CopyUrlButton value={value} title={title} toastLabel={sched === "live" ? "URL" : "Message"} />;
                        })()}
                      </div>
                    </td>

                    <td className="px-2 py-3 min-w-0">
                      <LabelsCell scope="landing" value={r.tags ?? []} onChange={(v) => updateTags(r.id, v)} itemName={r.name} />
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground whitespace-nowrap leading-tight" title={fmtDateTimeFull(r.updated_at)}>
                      {fmtDateTime(r.updated_at) || "—"}
                    </td>
                    <td className="px-1 py-3 text-center">
                      <button className="p-1.5 rounded border hover:bg-muted inline-flex" aria-label="Edit design" title="Edit design"
                        onClick={() => navigate(`/manage/design?page=${r.id}`)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-1 py-3 text-center">
                      <button className="p-1.5 rounded border hover:bg-muted inline-flex"
                        aria-label="Open in new tab"
                        title="Open in new tab"
                        onClick={() => window.open(r.path, "_blank", "noopener,noreferrer")}>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-1 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded border hover:bg-muted inline-flex"
                            aria-label="More actions"
                            title="More actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {r.name}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setEditing(r)}>
                            <Pencil className="w-4 h-4 mr-2" /> Settings…
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setRenaming(r)}>
                            <Type className="w-4 h-4 mr-2" /> Rename…
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => duplicate(r)}>
                            <Files className="w-4 h-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {r.archived_at ? (
                            <DropdownMenuItem onSelect={() => unarchive([r.id])}>
                              <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => archive([r.id])}>
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => regenerateOne(r)}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Regenerate thumbnail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setConfirmBulkDelete([r.id])}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      <ListPager {...pager} total={filtered.length} />
        </div>
      </div>

      <CreateLandingPageDialog open={creating} onOpenChange={setCreating} onCreated={load} />
      <EditLandingDialog row={editing} onClose={() => setEditing(null)} onSaved={load} />
      <RenameDialog
        open={!!renaming}
        onOpenChange={(o) => { if (!o) setRenaming(null); }}
        title={renaming ? `Rename "${renaming.name}"` : "Rename landing page"}
        description="Renaming updates the URL. A redirect from the old path is created automatically so existing links keep working."
        pathPrefix="/landing/"
        currentName={renaming?.name ?? ""}
        currentSlug={renaming ? renaming.path.replace(/^\/landing\//, "") : ""}
        onSubmit={async (name, slug) => {
          if (!renaming) return;
          const res = await renameLanding({
            id: renaming.id,
            currentPath: renaming.path,
            newName: name,
            newSlug: slug,
          });
          toast.success(res.redirected ? "Renamed. Old URL redirects to the new one." : "Renamed");
          load();
        }}
      />
      <PagePreviewDialog
        page={preview ? {
          kind: "page", id: preview.id, name: preview.name, path: preview.path,
          updated_at: preview.updated_at,
          thumbnail_updated_at: preview.thumbnail_updated_at,
          thumbnail_build_version: preview.thumbnail_build_version,
          thumbnail_url: preview.build_status === "ready" ? preview.thumbnail_url : null,
          preview_url: preview.build_status === "ready" ? preview.preview_url : null,
        } : null}
        placeholderMessage={preview && preview.build_status !== "ready" ? "Preview available after this landing page is promoted to Ready and published." : undefined}
        onClose={() => setPreview(null)}
        onCaptured={load}
      />


      <ConfirmDialog
        open={!!confirmBulkDelete}
        onOpenChange={(o) => { if (!o) setConfirmBulkDelete(null); }}
        title={`Delete ${confirmBulkDelete?.length ?? 0} landing page${(confirmBulkDelete?.length ?? 0) === 1 ? "" : "s"}?`}
        description="This permanently removes the landing page record. You'll have 5 seconds to undo."
        confirmLabel="Delete permanently"
        destructive
        onConfirm={() => confirmBulkDelete && doDeleteBulk(confirmBulkDelete)}
      />

      <Dialog
        open={!!promoteConfirm}
        onOpenChange={(o) => { if (!o) setPromoteConfirm(null); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish "{promoteConfirm?.row.name}" as Ready?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              This landing page hasn't been built yet — it's still using the
              default "Under Construction" scaffold.
            </p>
            <p>What should visitors see at the public URL?</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                const p = promoteConfirm; if (!p) return;
                setPromoteConfirm(null);
                updateLandingStatus(p.row.id, p.next, {
                  scaffoldDismissed: false,
                  skipStartingStateCheck: true,
                });
              }}
            >
              Publish as-is (show the scaffold)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const p = promoteConfirm; if (!p) return;
                setPromoteConfirm(null);
                updateLandingStatus(p.row.id, p.next, {
                  scaffoldDismissed: true,
                  skipStartingStateCheck: true,
                });
              }}
            >
              Show a "Coming Soon" message
            </Button>
            <Button variant="ghost" onClick={() => setPromoteConfirm(null)}>
              Cancel — keep as Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditLandingDialog({
  row, onClose, onSaved,
}: { row: Landing | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setDescription(row.description ?? "");
    setStatus(row.status);
    const s = isoToLocalParts(row.start_at);
    const e = isoToLocalParts(row.end_at);
    setStartDate(s.date); setStartTime(s.time === "00:00" ? "" : s.time);
    setEndDate(e.date); setEndTime(e.time === "00:00" ? "" : e.time);
  }, [row]);

  const save = async () => {
    if (!row) return;
    setSaving(true);
    const { error } = await (supabase as any).from("pages").update({
      name: name.trim() || row.name,
      description,
      status,
      start_at: localDateToIso(startDate, startTime),
      end_at: localDateToIso(endDate, endTime),
    }).eq("id", row.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Landing page updated");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit landing page</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded p-2 text-sm min-h-[80px]"
              placeholder="Add a description…"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 text-sm rounded border ${status === s ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                  {s === "draft" ? "Draft" : "Ready"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Time</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">Dates use your local time. Leave time blank for an all-day date.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
