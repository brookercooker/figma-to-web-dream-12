import { useEffect, useMemo, useState } from "react";
import { matchesLabelFilter } from "./labelPath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Play, Loader2, X, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { withRouteIframe } from "./routeSnapshot";
import { classifyDestination, getStaticRoutes, type LinkStatus, type LinkType, isComingSoonPath } from "./routeTable";
import CreatePageDialog from "./CreatePageDialog";
import TagsPanel from "./TagsPanel";
import LabelPicker from "./LabelPicker";
import SelectionBar from "./SelectionBar";

interface DbPage { id: string; slug_id: string; name: string; path: string; archived_at?: string | null; }

const HEADER_LOCATION = "Header mega-menu";
const FOOTER_LOCATION = "Footer";

interface Row {
  id: string;
  identity_key: string;
  location: string;
  link_text: string;
  destination: string;
  status: LinkStatus;
  type: LinkType;
  is_chrome: boolean;
  is_deleted: boolean;
  dismissed: boolean;
  tags: string[];
  source_pages: string[];
  first_seen_at: string;
  last_seen_at: string;
}

const STATUS_COLORS: Record<LinkStatus, string> = {
  Registered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  Pending: "bg-brass/20 text-brass border-brass/40",
  Broken: "bg-destructive/15 text-destructive border-destructive/40",
  External: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  "Self-Referencing": "bg-amber-500/15 text-amber-700 border-amber-500/30",
};

/** Classify a chrome anchor into a synthetic site-wide location. */
function chromeLocationFor(el: Element): string | null {
  if (el.closest('footer, [role="contentinfo"]')) return FOOTER_LOCATION;
  if (el.closest('header, nav, [role="banner"], [role="navigation"]')) return HEADER_LOCATION;
  return null;
}

function identityKey(location: string, text: string) {
  return `${location}::${text.toLowerCase().trim()}`;
}

function shouldScanRoute(route: string) {
  return !!route && !route.startsWith("/admin") && route !== "*" && route !== "/";
}

async function scanPage(route: string): Promise<{
  anchors: Array<{ href: string; text: string; location: string; isChrome: boolean }>;
  empty: boolean;
}> {
  const result = await withRouteIframe(route, (doc) => {
    const all = Array.from(doc.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    const main = doc.querySelector("main");
    const mainText = (main?.textContent || "").trim();
    const looksLike404 = /page not found|404/i.test(mainText) && mainText.length < 400;
    const empty = !main || mainText.length < 20 || looksLike404;
    return {
      anchors: all.map((a) => {
        const chromeLoc = chromeLocationFor(a);
        return {
          href: a.getAttribute("href") || "",
          text: (a.textContent || "").trim().slice(0, 120),
          location: chromeLoc ?? route,
          isChrome: !!chromeLoc,
        };
      }),
      empty,
    };
  }, 1400);
  return result ?? { anchors: [], empty: true };
}

async function checkExternal(url: string): Promise<"ok" | "fail" | "unverified"> {
  try {
    await fetch(url, { method: "HEAD", mode: "no-cors" });
    return "unverified";
  } catch { return "fail"; }
}

export default function LinkAuditView({ pages }: { pages: DbPage[] }) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<LinkStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<LinkType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prefill, setPrefill] = useState<string | null>(null);


  const livePages = useMemo(() => pages.filter((p) => !p.archived_at), [pages]);
  const dbPagePaths = useMemo(() => new Set(livePages.map((p) => p.path).filter(Boolean)), [livePages]);

  // ---- Load persisted results on mount ----
  const loadPersisted = async () => {
    const [{ data: rowData }, { data: metaData }] = await Promise.all([
      (supabase as any).from("link_audit_rows").select("*").order("location").order("link_text"),
      (supabase as any).from("link_audit_meta").select("*").eq("id", 1).maybeSingle(),
    ]);
    setRows((rowData ?? []) as Row[]);
    if (metaData?.last_ran_at) setLastRun(new Date(metaData.last_ran_at));
    if (metaData?.scanned_pages) setScannedPages(metaData.scanned_pages);
  };
  useEffect(() => { loadPersisted(); }, []);

  const runScan = async () => {
    setScanning(true);
    setProgress(0);
    try {
      const staticPaths = getStaticRoutes()
        .filter((r) => !r.isRedirectToComingSoon && !r.path.includes(":") && shouldScanRoute(r.path))
        .map((r) => r.path);
      const dbPaths = livePages.map((p) => p.path).filter(shouldScanRoute);
      const routes = Array.from(new Set([...dbPaths, ...staticPaths]));

      // Aggregate by the exact diff identity: location + link text.
      //  - Chrome links use fixed site-wide labels (Header mega-menu/Footer).
      //  - In-page links use the single page path as their location, so a link
      //    found on /home and /team becomes two stable rows, not one joined row.
      type Agg = {
        location: string;
        link_text: string;
        destination: string;
        is_chrome: boolean;
        source_pages: Set<string>;
      };
      const seen = new Map<string, Agg>();

      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const { anchors, empty } = await scanPage(route);
        if (empty) { setProgress(Math.round(((i + 1) / routes.length) * 100)); continue; }
        for (const a of anchors) {
          if (!a.text) continue; // skip empty-text links (icons w/o labels)
          const bucketLocation = a.isChrome ? a.location : route;
          const key = identityKey(bucketLocation, a.text);
          let entry = seen.get(key);
          if (!entry) {
            entry = {
              location: bucketLocation,
              link_text: a.text,
              destination: a.href,
              is_chrome: a.isChrome,
              source_pages: new Set<string>(),
            };
            seen.set(key, entry);
          }
          if (!a.isChrome) entry.source_pages.add(route);
        }
        setProgress(Math.round(((i + 1) / routes.length) * 100));
      }

      // Classify each aggregated row.
      const classified = [...seen.entries()].map(([key, r]) => {
        const cls = classifyDestination(r.destination, r.location, dbPagePaths);
        let status = cls.status;
        if (status === "Self-Referencing" && r.is_chrome) status = "Registered";
        return {
          key,
          ...r,
          source_pages: [...r.source_pages].sort(),
          status,
          type: cls.type,
          destinationNorm: cls.normalized,
        };
      });

      // ---- DIFF against persisted rows ----
      const { data: existing } = await (supabase as any)
        .from("link_audit_rows").select("*");
      const existingByKey = new Map<string, Row>((existing ?? []).map((r: Row) => [r.identity_key, r]));
      const nowIso = new Date().toISOString();
      const seenKeys = new Set<string>();

      const upserts: any[] = [];
      for (const c of classified) {
        seenKeys.add(c.key);
        const prev = existingByKey.get(c.key);
        upserts.push({
          identity_key: c.key,
          location: c.location,
          link_text: c.link_text,
          destination: c.destinationNorm,
          status: c.status,
          type: c.type,
          is_chrome: c.is_chrome,
          is_deleted: false,
          dismissed: prev?.dismissed ?? false,
          tags: prev?.tags ?? [],
          source_pages: c.source_pages,
          first_seen_at: prev?.first_seen_at ?? nowIso,
          last_seen_at: nowIso,
        });
      }

      // Chunk upserts.
      const chunk = 200;
      for (let i = 0; i < upserts.length; i += chunk) {
        const { error } = await (supabase as any)
          .from("link_audit_rows")
          .upsert(upserts.slice(i, i + chunk), { onConflict: "identity_key" });
        if (error) { toast.error(error.message); throw error; }
      }

      // Mark rows not in this scan as deleted (only ones that weren't already dismissed).
      const deletedKeys = [...existingByKey.keys()].filter((k) => !seenKeys.has(k));
      if (deletedKeys.length > 0) {
        const { error } = await (supabase as any)
          .from("link_audit_rows")
          .update({ is_deleted: true, last_seen_at: existingByKey.get(deletedKeys[0])!.last_seen_at })
          .in("identity_key", deletedKeys);
        if (error) toast.error(error.message);
      }

      // Save meta.
      const summary = {
        Registered: classified.filter((r) => r.status === "Registered").length,
        Pending: classified.filter((r) => r.status === "Pending").length,
        Broken: classified.filter((r) => r.status === "Broken").length,
        External: classified.filter((r) => r.status === "External").length,
        SelfRef: classified.filter((r) => r.status === "Self-Referencing").length,
      };
      await (supabase as any).from("link_audit_meta").upsert({
        id: 1, last_ran_at: nowIso, summary, scanned_pages: routes,
      }, { onConflict: "id" });

      await loadPersisted();

      // External reachability (in-memory only, not persisted).
      const externals = classified.filter((r) => r.status === "External");
      await Promise.all(externals.map(async (r) => {
        if (/^(mailto:|tel:)/i.test(r.destinationNorm)) return;
        await checkExternal(r.destinationNorm);
      }));
      toast.success(`Scanned ${routes.length} page(s) — ${upserts.length} link(s) tracked`);
    } finally {
      setScanning(false);
    }
  };

  // ---- Actions ----
  const updateTags = async (row: Row, tags: string[]) => {
    setRows((cur) => cur.map((r) => (r.id === row.id ? { ...r, tags } : r)));
    const { error } = await (supabase as any)
      .from("link_audit_rows").update({ tags }).eq("id", row.id);
    if (error) { toast.error(error.message); await loadPersisted(); }
  };

  const dismissRow = async (row: Row) => {
    setRows((cur) => cur.filter((r) => r.id !== row.id));
    setSelectedIds((cur) => cur.filter((id) => id !== row.id));
    const { error } = await (supabase as any).from("link_audit_rows").delete().eq("id", row.id);
    if (error) { toast.error(error.message); await loadPersisted(); }
  };

  const applyTagBulk = async (ids: string[], tag: string) => {
    const targets = rows.filter((r) => ids.includes(r.id));
    const updates = targets
      .filter((r) => !r.tags.includes(tag))
      .map((r) => ({ id: r.id, tags: [...r.tags, tag] }));
    if (updates.length === 0) {
      toast.info(`All selected already have "${tag}"`);
      return;
    }
    setRows((cur) => cur.map((r) => {
      const u = updates.find((x) => x.id === r.id);
      return u ? { ...r, tags: u.tags } : r;
    }));
    const results = await Promise.all(updates.map((u) =>
      (supabase as any).from("link_audit_rows").update({ tags: u.tags }).eq("id", u.id)
    ));
    const failed = results.filter((r) => r.error).length;
    if (failed > 0) { toast.error(`${failed} update(s) failed`); await loadPersisted(); }
    else toast.success(`Applied "${tag}" to ${updates.length} link(s)`);
  };


  // ---- Derived ----
  const activeRows = useMemo(() => rows.filter((r) => !r.is_deleted), [rows]);
  const deletedRows = useMemo(() => rows.filter((r) => r.is_deleted), [rows]);

  const locations = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.location));
    return [...s].sort((a, b) => {
      if (a === HEADER_LOCATION) return -1;
      if (b === HEADER_LOCATION) return 1;
      if (a === FOOTER_LOCATION) return -1;
      if (b === FOOTER_LOCATION) return 1;
      return a.localeCompare(b);
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (locationFilter !== "all" && r.location !== locationFilter) return false;
      if (tagFilters.length && !tagFilters.every((t) => matchesLabelFilter(r.tags, t))) return false;
      if (term && ![r.destination, r.link_text, r.location, ...(r.source_pages || [])].some((v) => (v || "").toLowerCase().includes(term))) return false;
      return true;
    });
  }, [rows, q, statusFilter, typeFilter, locationFilter, tagFilters]);

  const tagUsageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    activeRows.forEach((r) => r.tags.forEach((t) => { map[t] = (map[t] ?? 0) + 1; }));
    return map;
  }, [activeRows]);

  const counts = useMemo(() => {
    const c = { Registered: 0, Pending: 0, Broken: 0, External: 0, SelfRef: 0 };
    activeRows.forEach((r) => {
      if (r.status === "Registered") c.Registered++;
      else if (r.status === "Pending") c.Pending++;
      else if (r.status === "Broken") c.Broken++;
      else if (r.status === "External") c.External++;
      else if (r.status === "Self-Referencing") c.SelfRef++;
    });
    return c;
  }, [activeRows]);

  const orphans = useMemo(() => {
    if (activeRows.length === 0) return [];
    const incoming = new Set<string>();
    activeRows.forEach((r) => {
      if (!r.destination) return;
      incoming.add(r.destination);
      if (isComingSoonPath(r.destination)) incoming.add("/coming-soon");
    });
    return livePages.filter((p) => !!p.path && !incoming.has(p.path));
  }, [activeRows, livePages]);

  const brokenDestinations = useMemo(() => {
    const set = new Map<string, Row>();
    activeRows.filter((r) => r.status === "Broken").forEach((r) => set.set(r.destination, r));
    return [...set.values()];
  }, [activeRows]);

  const toggleTagFilter = (t: string) =>
    setTagFilters((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);

  return (
    <div className="flex gap-4 items-start">
      <TagsPanel
        scope="links"
        usageCounts={tagUsageCounts}
        activeFilters={tagFilters}
        onToggleFilter={toggleTagFilter}
        onClearFilters={() => setTagFilters([])}
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onApplyTag={applyTagBulk}
        itemLabel="links"
        filteredCount={filtered.filter((r) => !r.is_deleted).length}
        onSelectAllFiltered={() => setSelectedIds(filtered.filter((r) => !r.is_deleted).map((r) => r.id))}
      />


      <div className="flex-1 min-w-0 space-y-4">
      <div className="flex items-center gap-3 flex-wrap p-4 border rounded-lg bg-muted/20">
        <Button onClick={runScan} disabled={scanning} className="gap-2">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {scanning ? `Scanning… ${progress}%` : "Scan All Pages"}
        </Button>
        <div className="text-xs text-muted-foreground">
          {lastRun ? `Last scan: ${lastRun.toLocaleString()} · ${scannedPages.length} page(s)` : "No scans yet — click Scan to begin."}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryCard label="Registered" value={counts.Registered} />
            <SummaryCard label="Pending (Supernova CC)" value={counts.Pending} />
            <SummaryCard label="Broken" value={counts.Broken} tone={counts.Broken ? "bad" : undefined} />
            <SummaryCard label="External" value={counts.External} />
            <SummaryCard label="Self-referencing" value={counts.SelfRef} tone={counts.SelfRef ? "warn" : undefined} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter results…" className="pl-9" />
            </div>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              className="text-sm border rounded px-2 h-9 bg-background max-w-[200px]">
              <option value="all">All locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border rounded px-2 h-9 bg-background">
              <option value="all">All statuses</option>
              {(["Registered","Pending","Broken","External","Self-Referencing"] as LinkStatus[]).map((s) =>
                <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-sm border rounded px-2 h-9 bg-background">
              <option value="all">All types</option>
              {(["Static page","Supernova CC","External","Unknown"] as LinkType[]).map((t) =>
                <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>

          <SelectionBar
            count={selectedIds.length}
            itemLabel="link"
            onClear={() => setSelectedIds([])}
            hint={<>Click <Plus className="inline w-3 h-3" /> on a label in the sidebar to apply in bulk</>}
          />


          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col style={{ width: "36px" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "110px" }} />
                <col />
                <col style={{ width: "48px" }} />
              </colgroup>
              <thead className="bg-muted/40 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-2">
                    <Checkbox
                      checked={
                        filtered.length > 0 &&
                        filtered.every((r) => selectedIds.includes(r.id))
                      }
                      onCheckedChange={(v) => {
                        if (v) setSelectedIds(Array.from(new Set([...selectedIds, ...filtered.map((r) => r.id)])));
                        else {
                          const fIds = new Set(filtered.map((r) => r.id));
                          setSelectedIds(selectedIds.filter((id) => !fIds.has(id)));
                        }
                      }}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left px-3 py-2">Link text</th>
                  <th className="text-left px-3 py-2">Links from</th>
                  <th className="text-left px-3 py-2">Destination</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Labels</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const checked = selectedIds.includes(r.id);
                  return (
                  <tr key={r.id} className={`border-t align-top ${r.is_deleted ? "bg-destructive/5" : checked ? "bg-primary/5" : ""}`}>
                    <td className="px-2 py-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedIds((cur) => v ? [...cur, r.id] : cur.filter((id) => id !== r.id));
                        }}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="truncate" title={r.link_text}>{r.link_text || <span className="opacity-60">—</span>}</div>
                      {r.is_deleted && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border border-destructive/40 text-destructive bg-destructive/10">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.is_chrome ? (
                        <span className="font-medium">{r.location}</span>
                      ) : r.location ? (
                        <span className="block truncate font-mono text-[11px]" title={r.location}>{r.location}</span>
                      ) : (
                        <span className="opacity-60">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs break-all">{r.destination || <span className="opacity-60">—</span>}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.type}</td>
                    <td className="px-3 py-2">
                      <LabelPicker scope="links"
                        value={r.tags}
                        onChange={(next) => updateTags(r, next)}
                        triggerLabel="Add"
                        compact
                      />
                    </td>
                    <td className="px-2 py-2">
                      {r.is_deleted && (
                        <button
                          onClick={() => dismissRow(r)}
                          className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground"
                          title="Dismiss deleted row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-muted-foreground py-8">No matching links.</td></tr>
                )}
              </tbody>
            </table>
          </div>


          {deletedRows.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {deletedRows.length} row(s) marked <strong>Deleted</strong> from prior scans (excluded from stats above).
            </div>
          )}

          {brokenDestinations.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Missing pages ({brokenDestinations.length})</h3>
              <div className="border rounded-lg divide-y">
                {brokenDestinations.map((r) => (
                  <div key={r.destination} className="p-3 flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs flex-1 min-w-0 truncate">{r.destination}</span>
                    <Button size="sm" variant="outline" onClick={() =>
                      setPrefill((r.destination.replace(/^\/+/, "") || r.link_text) || "New Page")
                    }>Create this page</Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {orphans.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Orphaned pages ({orphans.length})</h3>
              <div className="border rounded-lg divide-y">
                {orphans.map((p) => (
                  <div key={p.id} className="p-3 text-sm flex items-center gap-3">
                    <span className="font-medium">{p.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{p.path}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CreatePageDialog
        open={!!prefill}
        onOpenChange={(o) => !o && setPrefill(null)}
        initialName={prefill ?? ""}
      />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  const cls = tone === "bad" ? "border-destructive/40 text-destructive"
    : tone === "warn" ? "border-amber-500/40 text-amber-700" : "";
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <div className="text-2xl font-medium">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
