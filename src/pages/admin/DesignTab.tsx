import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { codedPages, pageChunks, chunkName } from "./codedPages";
import type { Section } from "@/components/ObjectSections";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Bold, Heading, Image as ImageIcon, Italic, Plus, Save,
  AlignCenter, AlignLeft, AlignRight, Trash2, Type, ExternalLink, Pencil, Boxes,
  ChevronDown, ChevronRight, GripVertical, Film,
PanelLeftOpen, PanelLeftClose, Monitor, Tablet, Smartphone, Eye } from "lucide-react";
import { DeviceFrame, DEVICE_WIDTH, type Device } from "@/components/DeviceFrame";
import CreatePageDialog from "./CreatePageDialog";
import ConfirmDialog from "./ConfirmDialog";
import ImagePickerDialog from "./ImagePickerDialog";
import VideoPickerDialog from "./VideoPickerDialog";
import ObjectPickerDialog from "./ObjectPickerDialog";
import TagsPanel from "./TagsPanel";
import { matchesLabelFilter } from "./labelPath";
import PageMiniPreview from "./PageMiniPreview";
import PageBlocks, { BlockView, newId, parseBlocks, type Block, type BlockAlign, type ImageBlock, type ObjectBlock, type TextBlock, type VideoBlock, hasWideBlocks } from "@/components/PageBlocks";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsertGap, { type InsertType } from "./InsertGap";
import InlineEditSurface, { type InlineEdits, type InlineSelection } from "@/components/InlineEditSurface";
import InlineStylePanel from "./InlineStylePanel";

interface PageRow { id: string; name: string; path: string; content: unknown; updated_at: string; tags?: string[] | null; inline_edits?: InlineEdits | null }

/**
 * Shows the real site header / footer around the editable page content so the
 * page is designed in context. Not interactive and not part of the blocks.
 */
function ChromePreview({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {label}
      </button>
      {open && (
        <div className="pointer-events-none select-none [&_header]:!static [&_header]:!z-auto">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Paths that a real page component answers. Anything else is a prototype page
 * stored in memory, which an iframe cannot see (each frame reseeds its own
 * data), so those preview inline instead of through an iframe.
 */
const CODED_PATHS = new Set([
  "/home", "/locations", "/full-vendor-list", "/new-and-now", "/outdoor-oasis",
  "/team", "/inspiration-gallery", "/lighting-tips", "/about", "/contact",
  "/contact-us-trade-account", "/shipping-policy", "/return-policy",
  "/privacy-policy", "/terms-conditions", "/objects-flyer", "/coming-soon",
  "/brands", "/catalog", "/ceiling-lighting", "/wall-lighting", "/lamps",
  "/outdoor", "/fans", "/architectural", "/home-decor", "/room",
]);

export const previewSrc = (path: string) => (path === "/" ? "/home" : path);
export const canIframe = (path: string) => CODED_PATHS.has(previewSrc(path));

/** Renders a prototype page the way visitors see it, without an iframe. */
export function InlinePagePreview({ name, blocks }: { name: string; blocks: Block[] }) {
  return (
    <div className="bg-background">
      <div className="pointer-events-none select-none [&_header]:!static [&_header]:!z-auto">
        <Header />
      </div>
      <div className={hasWideBlocks(blocks) ? "" : "mx-auto max-w-3xl px-6 py-10"}>
        {blocks.length ? (
          <PageBlocks blocks={blocks} />
        ) : (
          <>
            <h1 className="font-serif text-3xl">{name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This page has no content yet. Add a section to design it.
            </p>
          </>
        )}
      </div>
      <div className="pointer-events-none select-none">
        <Footer />
      </div>
    </div>
  );
}

const SIZES: TextBlock["size"][] = ["sm", "md", "lg", "xl"];
const SIZE_LABEL: Record<TextBlock["size"], string> = { sm: "S", md: "M", lg: "L", xl: "XL" };

function ToolButton({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      onClick={onClick}
      className={`h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-xs transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
      }`}
    >
      {children}
    </button>
  );
}

/** Renders a coded page off-screen, splits it into sections and converts each one. */
function PageImportProbe({ path, onDone }: { path: string; onDone: (parts: { name: string; sections: Section[] }[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const tick = async () => {
      if (cancelled) return;
      const root = ref.current;
      const loading = !root || !root.children.length || root.querySelector(".animate-pulse") ||
        [...root.querySelectorAll("img")].some((i) => !i.complete);
      if (loading && Date.now() - start < 6000) { setTimeout(tick, 150); return; }
      await new Promise((r) => setTimeout(r, 250));
      if (cancelled || !root) return;
      const { sectionsFromDom } = await import("./importCodedObject");
      const chunks = pageChunks(root);
      const parts = chunks
        .map((el, i) => ({ name: chunkName(el, `Section ${i + 1}`), sections: sectionsFromDom(el) }))
        .filter((p) => p.sections.length);
      onDone(parts);
    };
    setTimeout(tick, 300);
    return () => { cancelled = true; };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  const C = codedPages[path];
  return createPortal(
    <div ref={ref} className="import-probe bg-background" style={{ position: "fixed", left: -20000, top: 0, width: 1280, pointerEvents: "none" }}>
      <Suspense fallback={<div className="animate-pulse h-10" />}><C /></Suspense>
    </div>,
    document.body,
  );
}

export default function DesignTab() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("page") ?? "";

  const [pages, setPages] = useState<PageRow[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [videoFor, setVideoFor] = useState<string | null>(null);
  // block id waiting for an object choice, or "new" when adding one
  const [objectFor, setObjectFor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [listOpen, setListOpen] = useState(() => !new URLSearchParams(window.location.search).get("page"));
  const [dragId, setDragId] = useState<string>("");
  const [dropAt, setDropAt] = useState<{ id: string; before: boolean } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showLive, setShowLive] = useState(true);
  // Pages built in code have no editable blocks yet: show them as one locked section.
  const [hasExisting, setHasExisting] = useState(false);
  const [currentFirst, setCurrentFirst] = useState(true);
  const [objectAt, setObjectAt] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  // In-place editing of a coded page: type over text, click pictures to swap.
  const [quick, setQuick] = useState(false);
  const [inlineEdits, setInlineEdits] = useState<InlineEdits>({});
  const [resetKey, setResetKey] = useState(0);
  const [inlineSel, setInlineSel] = useState<InlineSelection | null>(null);
  const [imgAsk, setImgAsk] = useState<((url: string | null) => void) | null>(null);
  const pickImage = () => new Promise<string | null>((resolve) => setImgAsk(() => resolve));
  const inlineTimer = useRef<number>();
  const changeInline = (next: InlineEdits) => {
    setInlineEdits(next);
    const id = selectedId;
    window.clearTimeout(inlineTimer.current);
    inlineTimer.current = window.setTimeout(async () => {
      const updated_at = new Date().toISOString();
      await (supabase as any).from("pages").update({ inline_edits: next, updated_at }).eq("id", id);
      setPages((cur) => cur.map((x) => (x.id === id ? { ...x, inline_edits: next, updated_at } : x)));
    }, 800);
  };


  const load = async () => {
    const { data } = await (supabase as any)
      .from("pages")
      .select("id,name,path,content,updated_at,tags,inline_edits")
      .is("archived_at", null)
      .order("name", { ascending: true });
    setPages(data ?? []);
    return (data ?? []) as PageRow[];
  };

  useEffect(() => { load(); }, []);

  const page = useMemo(() => pages.find((p) => p.id === selectedId) ?? null, [pages, selectedId]);
  // Entering Edit on a coded page converts it into editable sections automatically.
  const autoTried = useRef(new Set<string>());
  useEffect(() => {
    if (!showLive && hasExisting && !importing && page && codedPages[previewSrc(page.path)] && !autoTried.current.has(page.id)) {
      autoTried.current.add(page.id);
      setImporting(true);
    }
  }, [showLive, hasExisting, importing, page]);
  // What the page shows once saved — re-read from the row so saving refreshes it.
  const savedBlocks = useMemo(() => parseBlocks(page?.content), [page?.content]);

  useEffect(() => {
    const parsed = parseBlocks(page?.content);
    setBlocks(parsed);
    setActiveId("");
    setDirty(false);
    // Pages open in Preview unless the link asks for Edit (e.g. returning from the object editor).
    const qs = new URLSearchParams(window.location.search);
    setShowLive(qs.get("mode") !== "edit");
    if (qs.has("mode")) {
      // Only the first page opened from that link starts in Edit.
      qs.delete("mode");
      window.history.replaceState(window.history.state, "", `${window.location.pathname}?${qs}`);
    }
    // Only pages that really exist in code get the locked "Current page" section.
    // Newly created pages start empty, with the site header and footer around them.
    setHasExisting(!parsed.length && !!page && canIframe(page.path));
    setCurrentFirst(true);
    setQuick(qs.get("mode") === "edit" && !parsed.length && !!page && !!codedPages[previewSrc(page.path)]);
    setInlineSel(null);
    setInlineEdits(page?.inline_edits ?? {});
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  const [sortBy, setSortBy] = useState<"name" | "recent" | "label">("name");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = pages.filter((p) => {
      if (tagFilters.length && !tagFilters.every((t) => matchesLabelFilter(p.tags ?? [], t))) return false;
      if (!term) return true;
      return `${p.name} ${p.path} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(term);
    });
    if (sortBy === "recent") {
      list.sort((a, b) => String((b as any).updated_at ?? "").localeCompare(String((a as any).updated_at ?? "")));
    }
    return list;
  }, [pages, q, tagFilters, sortBy]);

  const usageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    pages.forEach((p) => (p.tags ?? []).forEach((t) => { c[t] = (c[t] ?? 0) + 1; }));
    return c;
  }, [pages]);

  const applyTag = async (ids: string[], path: string) => {
    for (const id of ids) {
      const p = pages.find((x) => x.id === id);
      if (!p || (p.tags ?? []).includes(path)) continue;
      const nextTags = [...(p.tags ?? []), path];
      await (supabase as any).from("pages").update({ tags: nextTags }).eq("id", id);
      setPages((cur) => cur.map((x) => (x.id === id ? { ...x, tags: nextTags } : x)));
    }
  };

  const [deleting, setDeleting] = useState<PageRow | null>(null);
  const deletePage = async (pg: PageRow) => {
    await (supabase as any).from("pages").delete().eq("id", pg.id);
    setPages((cur) => cur.filter((x) => x.id !== pg.id));
    if (pg.id === selectedId) {
      const next = new URLSearchParams(params);
      next.delete("page");
      setParams(next, { replace: true });
    }
    setDeleting(null);
  };

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("page", id);
    setParams(next, { replace: true });
  };

  const update = (id: string, patch: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
    setDirty(true);
  };

  const addBlock = (type: Block["type"], at?: number) => {
    const base = { id: newId(), align: "left" as BlockAlign };
    const block: Block =
      type === "image"
        ? { ...base, type: "image", url: "", alt: "", width: 100 } as ImageBlock
        : type === "video"
        ? { ...base, type: "video", url: "", width: 100 } as VideoBlock
        : type === "heading"
          ? { ...base, type: "heading", text: "New heading", size: "lg" } as TextBlock
          : { ...base, type: "text", text: "Write something here.", size: "md" } as TextBlock;
    setBlocks((prev) => {
      const i = at === undefined ? prev.length : Math.max(0, Math.min(prev.length, at));
      return [...prev.slice(0, i), block, ...prev.slice(i)];
    });
    setActiveId(block.id);
    setShowLive(false);
    setDirty(true);
    if (type === "image") setPickerFor(block.id);
    if (type === "video") setVideoFor(block.id);
  };

  const insertAt = (type: InsertType, at: number) => {
    if (type === "object") { setObjectAt(at); setObjectFor("new"); return; }
    addBlock(type, at);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    // At the ends, step past the locked "Current page" section instead of doing nothing.
    if (j < 0 || j >= blocks.length) {
      if (!hasExisting) return;
      if (j < 0 && currentFirst) setCurrentFirst(false);
      else if (j >= blocks.length && !currentFirst) setCurrentFirst(true);
      else return;
      setDirty(true);
      return;
    }
    setBlocks((prev) => {
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setDirty(true);
  };

  // Pointer-based dragging: see-through copy follows the pointer, the wheel keeps
  // working, and the page scrolls near the top or bottom edge.
  const grabRef = useRef({ x: 0, y: 0 });
  const dropRef = useRef<{ id: string; before: boolean } | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const deviceStyle = DEVICE_WIDTH[device] ? { width: DEVICE_WIDTH[device]!, maxWidth: "100%", margin: "0 auto" } : undefined;
  const startDrag = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY;
    const mv = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 5) return;
      window.removeEventListener("mousemove", mv);
      grabRef.current = { x: ev.clientX, y: ev.clientY };
      setDragId(id);
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", () => window.removeEventListener("mousemove", mv), { once: true });
  };
  useEffect(() => {
    if (!dragId) return;
    let speed = 0, raf = 0;
    let lastX = grabRef.current.x, lastY = grabRef.current.y;
    const locate = () => {
      const el = (document.elementFromPoint(lastX, lastY) as HTMLElement | null)?.closest("[data-page-block]") as HTMLElement | null;
      let next: { id: string; before: boolean } | null = null;
      if (el && el.dataset.pageBlock !== dragId) {
        const r = el.getBoundingClientRect();
        next = { id: el.dataset.pageBlock!, before: lastY < r.top + r.height / 2 };
      }
      const cur = dropRef.current;
      if (cur?.id !== next?.id || cur?.before !== next?.before) { dropRef.current = next; setDropAt(next); }
    };
    const src = document.querySelector(`[data-page-block="${dragId}"]`) as HTMLElement | null;
    let ghost: HTMLElement | null = null;
    let offX = 0, offY = 0;
    if (src) {
      const r = src.getBoundingClientRect();
      offX = lastX - r.left; offY = lastY - r.top;
      ghost = src.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-page-block");
      Object.assign(ghost.style, {
        position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`,
        maxHeight: "320px", overflow: "hidden", opacity: "0.6", pointerEvents: "none", zIndex: "1000",
        margin: "0", background: "hsl(var(--background))", borderRadius: "0.5rem",
        boxShadow: "0 20px 40px -12px hsl(var(--foreground) / 0.35)",
      });
      document.body.appendChild(ghost);
    }
    const place = () => { if (ghost) { ghost.style.left = `${lastX - offX}px`; ghost.style.top = `${lastY - offY}px`; } };
    const tick = () => { if (speed) { window.scrollBy(0, speed); locate(); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const moveH = (e: MouseEvent) => {
      lastX = e.clientX; lastY = e.clientY;
      const edge = 120, h = window.innerHeight;
      if (e.clientY < edge) speed = -Math.ceil(((edge - e.clientY) / edge) * 24);
      else if (e.clientY > h - edge) speed = Math.ceil(((e.clientY - (h - edge)) / edge) * 24);
      else speed = 0;
      place(); locate();
    };
    const wheel = () => requestAnimationFrame(locate);
    const up = () => {
      const d = dropRef.current;
      if (d) moveTo(dragId, d.id, d.before);
      dropRef.current = null; setDropAt(null); setDragId("");
    };
    const prevSel = document.body.style.userSelect, prevCur = document.body.style.cursor;
    document.body.style.userSelect = "none"; document.body.style.cursor = "grabbing";
    window.addEventListener("mousemove", moveH);
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("mouseup", up, { once: true });
    return () => {
      cancelAnimationFrame(raf); ghost?.remove();
      document.body.style.userSelect = prevSel; document.body.style.cursor = prevCur;
      window.removeEventListener("mousemove", moveH);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("mouseup", up);
    };
  }, [dragId]);

  /** Drag a block to a new position in the page. */
  const moveTo = (id: string, targetId: string, before: boolean) => {
    if (id === targetId) return;
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === id);
      if (from < 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      let to = copy.findIndex((b) => b.id === targetId);
      if (to < 0) return prev;
      if (!before) to += 1;
      copy.splice(to, 0, item);
      return copy;
    });
    setDirty(true);
  };

  const remove = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setDirty(true);
  };

  const save = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("pages")
        .update({ content: blocks, build_status: "ready" })
        .eq("id", page.id);
      if (error) throw error;
      await load();
      setDirty(false);
      toast.success(`Saved — your page is live at ${page.path}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the page");
    } finally { setSaving(false); }
  };

  // Auto-save: quietly store changes shortly after the user stops editing.
  useEffect(() => {
    if (!dirty || !page) return;
    const pageId = page.id;
    const snapshot = blocks;
    const t = setTimeout(async () => {
      setSaving(true);
      const { error } = await (supabase as any)
        .from("pages")
        .update({ content: snapshot, build_status: "ready" })
        .eq("id", pageId);
      setSaving(false);
      if (error) { toast.error(error.message ?? "Could not save the page"); return; }
      setPages((cur) => cur.map((x) => (x.id === pageId ? { ...x, content: snapshot, updated_at: new Date().toISOString() } as any : x)));
      setBlocks((cur) => { if (cur === snapshot) setDirty(false); return cur; });
    }, 800);
    return () => clearTimeout(t);
  }, [blocks, dirty, page?.id]);

  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) { setToolbarHidden(false); return; }
    const io = new IntersectionObserver(([e]) => setToolbarHidden(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const addRow = (at: number, label: string) => (
    <div className="my-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2">
      <span className="mr-1 text-xs text-muted-foreground">{label}</span>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => { setObjectAt(at); setObjectFor("new"); }}>
        <Boxes className="w-4 h-4" /> Object
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("image", at)}>
        <ImageIcon className="w-4 h-4" /> Image
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("video", at)}>
        <Film className="w-4 h-4" /> Video
      </Button>
    </div>
  );

  const finishImport = async (parts: { name: string; sections: Section[] }[]) => {
    if (!page) return;
    const made: ObjectBlock[] = [];
    for (const part of parts) {
      const { data } = await (supabase as any).from("object_registry").insert({
        name: `${page.name} · ${part.name}`,
        status: "Draft",
        component_key: null,
        description: `Converted from the ${page.name} page.`,
        intended_pages: [page.path],
        labels: [],
        content: part.sections,
      }).select("*").single();
      if (data) made.push({ id: newId(), type: "object", objectId: data.id, name: data.name, align: "left", wide: true });
    }
    setImporting(false);
    if (!made.length) { toast.error("Couldn't break this page into sections."); return; }
    setBlocks((prev) => (currentFirst ? [...made, ...prev] : [...prev, ...made]));
    setHasExisting(false);
    setShowLive(false);
    setDirty(true);
    toast.success(`${page.name} is now ${made.length} editable sections.`);
  };

  const existingCard = page ? (
    <div key="current-page-section">
      {addRow(currentFirst ? 0 : blocks.length, "Add a section above")}
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">Current page</span>
          <span className="text-xs text-muted-foreground">Built in code — shown here so you can add around it</span>
          {codedPages[previewSrc(page.path)] && (
            <Button size="sm" className="ml-auto gap-2" disabled={importing} onClick={() => setImporting(true)}>
              <Pencil className="w-4 h-4" /> {importing ? "Breaking into sections…" : "Make editable"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={codedPages[previewSrc(page.path)] ? "" : "ml-auto"}
            onClick={() => setCurrentFirst((v) => !v)}
          >
            {currentFirst ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
        {canIframe(page.path) ? (
          <iframe
            key={`${page.id}-${page.updated_at}-inline`}
            src={previewSrc(page.path)}
            title={`${page.name} current content`}
            className="h-[46vh] w-full bg-background"
          />
        ) : (
          <div className="h-[46vh] overflow-y-auto">
            <InlinePagePreview name={page.name} blocks={savedBlocks} />
          </div>
        )}
      </div>
      {addRow(blocks.length, "Add a section below")}
    </div>
  ) : null;


  return (
    <div className={`grid grid-cols-1 gap-6 ${listOpen ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-[auto_1fr]"}`}>
      {/* Page list */}
      {!listOpen ? (
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Button variant="outline" size="icon" title="Show pages" onClick={() => setListOpen(true)}>
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        </aside>
      ) : (
      <aside className="space-y-3">
        <div className="flex items-center gap-2">
          <Button className="flex-1 gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New page
          </Button>
          <Button variant="outline" size="icon" title="Hide pages" onClick={() => setListOpen(false)}>
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
        {(<>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages or labels" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sort by</span>
          <div className="inline-flex rounded-md border p-0.5">
            {([["name", "Name"], ["recent", "Recently edited"], ["label", "Label"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => { setSortBy(k); if (k !== "label") setTagFilters([]); }}
                className={`rounded px-2 py-1 ${sortBy === k ? "bg-muted text-foreground font-medium" : "hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {sortBy === "label" && (
        <div className="rounded-lg border">
          {true && (
            <div className="py-2">
              <TagsPanel
                bare
                scope="static"
                usageCounts={usageCounts}
                activeFilters={tagFilters}
                onToggleFilter={(t) => setTagFilters((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                onClearFilters={() => setTagFilters([])}
                selectedCount={0}
                selectedIds={[]}
                onApplyTag={applyTag}
                itemLabel="pages"
                filteredCount={filtered.length}
              />
            </div>
          )}
        </div>
        )}
        <div className="border rounded-lg divide-y max-h-[65vh] overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className={`group relative w-full text-left px-3 py-2 transition-colors ${
                p.id === selectedId ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <div className="flex items-start gap-3">
              <PageMiniPreview name={p.name} path={p.path} content={p.content} />
              <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{p.path}</div>
              {!!(p.tags ?? []).length && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {(p.tags ?? []).map((t) => (
                    <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              </div>
              <span role="button" tabIndex={0} title="Delete page"
                onClick={(e) => { e.stopPropagation(); setDeleting(p); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setDeleting(p); } }}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus:opacity-100">
                <Trash2 className="w-4 h-4" />
              </span>
              </div>
            </button>
          ))}
          {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No pages found.</p>}
        </div>
        </>)}
      </aside>
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this page?"
        description={<>"{deleting?.name}" ({deleting?.path}) will be removed. This can't be undone.</>}
        confirmLabel="Delete page"
        onConfirm={() => deleting && deletePage(deleting)}
      />

      {/* Editor */}
      <section className="min-w-0">
        {!page ? (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            Pick a page on the left to design it, or create a new one.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="mr-auto">
                <h2 className="text-lg font-medium">{page.name}</h2>
                <a
                  href={page.path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground font-mono inline-flex items-center gap-1 hover:text-foreground"
                >
                  {page.path} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="inline-flex rounded-md border overflow-hidden mr-1">
                <button
                  type="button"
                  onClick={() => { setShowLive(true); setQuick(false); }}
                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 transition-colors ${showLive && !quick ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => { if (hasExisting && codedPages[previewSrc(page.path)]) { setShowLive(true); setQuick(true); } else { setShowLive(false); setQuick(false); } }}
                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 transition-colors border-l ${!showLive || quick ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="inline-flex rounded-md border overflow-hidden mr-1" role="group" aria-label="Screen size">
                {([["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["phone", Smartphone, "Phone"]] as const).map(([d, Icon, label]) => (
                  <button
                    key={d}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={device === d}
                    onClick={() => setDevice(d)}
                    className={`px-2.5 py-1.5 transition-colors ${device === d ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <span ref={toolbarRef} className="inline-flex" />
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setObjectFor("new")}>
                <Boxes className="w-4 h-4" /> Object
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("image")}>
                <ImageIcon className="w-4 h-4" /> Image
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("video")}>
                <Film className="w-4 h-4" /> Video
              </Button>
            </div>

            {showLive && hasExisting && codedPages[previewSrc(page.path)] && (quick || device === "desktop") ? (
              <div className="border rounded-lg overflow-hidden bg-background" style={deviceStyle}>
                <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    {quick
                      ? "Click any wording to type over it, or select wording or a picture to change its style on the right. Changes save on their own."
                      : "This is how the page looks right now."}
                  </p>
                  {quick ? (
                    Object.keys(inlineEdits).length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => { changeInline({}); setResetKey((k) => k + 1); }}>Undo all changes</Button>
                    )
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => setQuick(true)}>
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                  )}
                </div>
                <div className={quick ? "grid grid-cols-[1fr_260px]" : ""}>
                <div className="h-[70vh] overflow-y-auto bg-background">
                  {(() => {
                    const C = codedPages[previewSrc(page.path)];
                    return (
                      <InlineEditSurface
                        key={`${page.id}-${quick}-${resetKey}`}
                        edits={inlineEdits}
                        editing={quick}
                        onChange={changeInline}
                        onPickImage={pickImage}
                        onSelect={setInlineSel}
                        selectedKey={inlineSel?.key ?? null}
                      >
                        <Suspense fallback={<div className="h-64 animate-pulse bg-muted" />}><C /></Suspense>
                      </InlineEditSurface>
                    );
                  })()}
                </div>
                {quick && (
                  <aside className="h-[70vh] overflow-y-auto border-l bg-background p-4">
                    <InlineStylePanel
                      sel={inlineSel}
                      edits={inlineEdits}
                      onChange={changeInline}
                      onReplaceImage={async () => {
                        if (!inlineSel) return;
                        const url = await pickImage();
                        if (url) changeInline({ ...inlineEdits, [`img:${inlineSel.key}`]: url });
                      }}
                    />
                  </aside>
                )}
                </div>
              </div>
            ) : showLive ? (
              <div className="border rounded-lg overflow-hidden bg-background">
                <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    {blocks.length
                      ? "This is how the page looks right now. Switch to Edit to change it."
                      : "This is how the page looks right now. Add a heading, text, or an image to design it."}
                  </p>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowLive(false)}>
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                </div>
                {savedBlocks.length || !canIframe(page.path) ? (
                  device === "desktop" ? (
                    <div className="h-[70vh] overflow-y-auto bg-background">
                      <InlinePagePreview name={page.name} blocks={savedBlocks} />
                    </div>
                  ) : (
                    <div className="bg-muted/40 py-4">
                      <DeviceFrame title={`${page.name} preview`} className="block h-[70vh] border bg-background shadow-sm" style={deviceStyle}>
                        <InlinePagePreview name={page.name} blocks={savedBlocks} />
                      </DeviceFrame>
                    </div>
                  )
                ) : (
                  <iframe
                    key={`${page.id}-${page.updated_at}`}
                    src={previewSrc(page.path)}
                    title={`${page.name} preview`}
                    className="w-full h-[70vh] bg-background"
                    style={deviceStyle}
                  />
                )}
              </div>
            ) : (
            <div className="rounded-lg border bg-background overflow-hidden" style={deviceStyle}>
              {!hasExisting && (
                <ChromePreview label="Site header">
                  <Header />
                </ChromePreview>
              )}

              {importing && (
                <div role="status" className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
                  <span className="h-3 w-3 rounded-full border-2 border-muted-foreground/40 border-t-foreground animate-spin" aria-hidden />
                  Converting this page so it can be edited…
                </div>
              )}
              <div hidden={importing} className={hasWideBlocks(blocks) ? "min-h-[50vh] py-4" : "p-6 sm:p-10 min-h-[50vh]"}>
              {!blocks.length && !hasExisting && (
                <p className="text-sm text-muted-foreground text-center py-16">
                  This page is empty. Add a heading, some text, or an image to begin.
                </p>
              )}

              <div className={hasWideBlocks(blocks) ? "px-8" : "max-w-3xl mx-auto"}>
                {hasExisting && currentFirst && existingCard}
                {blocks.map((b, i) => {
                  const active = b.id === activeId;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setActiveId(b.id)}
                      data-page-block={b.id}
                      className={`group relative rounded-lg px-3 transition-colors cursor-text ${
                        active ? "ring-2 ring-primary/40 bg-muted/30" : "hover:bg-muted/20"
                      } ${dragId === b.id ? "opacity-50" : ""} ${
                        dropAt?.id === b.id
                          ? dropAt.before
                            ? "border-t-2 border-primary"
                            : "border-b-2 border-primary"
                          : ""
                      }`}
                    >
                      {!dragId && <InsertGap edge="top" onAdd={(t) => insertAt(t, i)} />}
                      {!dragId && i === blocks.length - 1 && <InsertGap edge="bottom" onAdd={(t) => insertAt(t, i + 1)} />}

                      <button
                        type="button"
                        title="Drag to move"
                        aria-label="Drag to move"
                        onMouseDown={(e) => startDrag(e, b.id)}
                        className={`absolute -left-7 top-2 z-20 cursor-grab rounded p-1 text-muted-foreground transition-opacity hover:bg-muted active:cursor-grabbing ${
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      {active && (
                        <div
                          title="Drag to move"
                          onMouseDown={(e) => {
                            const t = e.target as HTMLElement;
                            if (t.closest("input,textarea,select,[contenteditable=true]")) return;
                            startDrag(e, b.id);
                          }}
                          className="sticky top-16 z-10 -mx-3 mb-2 flex flex-wrap items-center gap-1 border-b bg-background/95 px-3 py-2 backdrop-blur cursor-grab active:cursor-grabbing"
                        >
                          {b.type === "object" ? (
                            <>
                              <button
                                type="button"
                                title={collapsed[b.id] ? "Expand object" : "Collapse object"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }));
                                }}
                                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                              >
                                {collapsed[b.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span>Object: {b.name ?? "Saved object"}</span>
                              </button>
                              <ToolButton title="Replace" onClick={() => setObjectFor(b.id)}>
                                <Boxes className="w-4 h-4" />
                                <span className="ml-1 text-xs">Replace</span>
                              </ToolButton>
                              <ToolButton
                                title="Edit"
                                onClick={() => navigate(`/manage/objects/design?object=${b.objectId}&returnPage=${selectedId}`)}
                              >
                                <Pencil className="w-4 h-4" />
                                <span className="ml-1 text-xs">Edit</span>
                              </ToolButton>
                            </>
                          ) : b.type === "heading" || b.type === "text" ? (
                            <>
                              <ToolButton
                                title={b.type === "heading" ? "Turn into text" : "Turn into heading"}
                                active={b.type === "heading"}
                                onClick={() => update(b.id, { type: b.type === "heading" ? "text" : "heading" } as Partial<Block>)}
                              >
                                <Heading className="w-4 h-4" />
                              </ToolButton>
                              <ToolButton title="Bold" active={!!b.bold} onClick={() => update(b.id, { bold: !b.bold } as Partial<Block>)}>
                                <Bold className="w-4 h-4" />
                              </ToolButton>
                              <ToolButton title="Italic" active={!!b.italic} onClick={() => update(b.id, { italic: !b.italic } as Partial<Block>)}>
                                <Italic className="w-4 h-4" />
                              </ToolButton>
                              <span className="mx-1 h-5 w-px bg-border" />
                              {SIZES.map((s) => (
                                <ToolButton key={s} title={`Size ${SIZE_LABEL[s]}`} active={b.size === s} onClick={() => update(b.id, { size: s } as Partial<Block>)}>
                                  {SIZE_LABEL[s]}
                                </ToolButton>
                              ))}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                title={collapsed[b.id] ? "Expand" : "Collapse"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }));
                                }}
                                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                              >
                                {collapsed[b.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span>{b.type === "video" ? "Video" : "Image"}</span>
                              </button>
                              {b.type === "video" ? (
                                <ToolButton title="Replace video" onClick={() => setVideoFor(b.id)}>
                                  <Film className="w-4 h-4" />
                                  <span className="ml-1 text-xs">Replace</span>
                                </ToolButton>
                              ) : (
                                <ToolButton title="Replace image" onClick={() => setPickerFor(b.id)}>
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="ml-1 text-xs">Replace</span>
                                </ToolButton>
                              )}
                              <span className="mx-1 h-5 w-px bg-border" />
                              {([50, 75, 100] as const).map((w) => (
                                <ToolButton key={w} title={`Width ${w}%`} active={(b as ImageBlock).width === w} onClick={() => update(b.id, { width: w } as Partial<Block>)}>
                                  {w}%
                                </ToolButton>
                              ))}
                            </>
                          )}
                          {b.type !== "object" && (
                            <>
                              <span className="mx-1 h-5 w-px bg-border" />
                              {(["left", "center", "right"] as BlockAlign[]).map((a) => (
                                <ToolButton key={a} title={`Align ${a}`} active={b.align === a} onClick={() => update(b.id, { align: a } as Partial<Block>)}>
                                  {a === "left" ? <AlignLeft className="w-4 h-4" /> : a === "center" ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                                </ToolButton>
                              ))}
                            </>
                          )}
                          <span className="mx-1 h-5 w-px bg-border" />
                          {(i > 0 || (hasExisting && currentFirst)) && (
                            <ToolButton title="Move up" onClick={() => move(b.id, -1)}><ArrowUp className="w-4 h-4" /></ToolButton>
                          )}
                          {(i < blocks.length - 1 || (hasExisting && !currentFirst)) && (
                            <ToolButton title="Move down" onClick={() => move(b.id, 1)}><ArrowDown className="w-4 h-4" /></ToolButton>
                          )}
                          <ToolButton title="Delete block" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></ToolButton>
                        </div>
                      )}

                      {b.type === "object" ? (
                        <div className="py-2">
                          {!active && (
                            <div title="Drag to move" onMouseDown={(e) => startDrag(e, b.id)} className="flex w-full cursor-grab items-center gap-1 rounded hover:bg-muted/40 active:cursor-grabbing">
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
<button
                              type="button"
                              title={collapsed[b.id] ? "Expand object" : "Collapse object"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }));
                              }}
                              className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                            >
                              {collapsed[b.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span>Object: {b.name ?? "Saved object"}</span>
                            </button>
                            </div>
                          )}
                          {!collapsed[b.id] && (
                            <div className="pointer-events-none">
                              <BlockView block={b} />
                            </div>
                          )}
                        </div>
                      ) : b.type === "image" || b.type === "video" ? (
                        <div className="py-2">
                          {!active && (
                            <div title="Drag to move" onMouseDown={(e) => startDrag(e, b.id)} className="flex w-full cursor-grab items-center gap-1 rounded hover:bg-muted/40 active:cursor-grabbing">
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
<button
                              type="button"
                              title={collapsed[b.id] ? "Expand" : "Collapse"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }));
                              }}
                              className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                            >
                              {collapsed[b.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span>{b.type === "video" ? "Video" : "Image"}</span>
                            </button>
                            </div>
                          )}
                          {!collapsed[b.id] && (
                            <>
                              {b.url ? (
                                <BlockView block={b} />
                              ) : (
                                <button
                                  onClick={() => (b.type === "video" ? setVideoFor(b.id) : setPickerFor(b.id))}
                                  className="w-full border border-dashed rounded-lg py-12 text-sm text-muted-foreground hover:bg-muted/40"
                                >
                                  {b.type === "video" ? "Choose a video" : "Choose an image"}
                                </button>
                              )}
                              {active && (
                                <div className="grid sm:grid-cols-2 gap-2 mt-2">
                                  {b.type === "image" && (
                                    <Input value={b.alt} placeholder="Describe the image" onChange={(e) => update(b.id, { alt: e.target.value } as Partial<Block>)} />
                                  )}
                                  <Input value={b.caption ?? ""} placeholder="Caption (optional)" onChange={(e) => update(b.id, { caption: e.target.value } as Partial<Block>)} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : active ? (
                        <Textarea
                          value={(b as TextBlock).text}
                          autoFocus
                          rows={b.type === "heading" ? 2 : 4}
                          onChange={(e) => update(b.id, { text: e.target.value } as Partial<Block>)}
                          className="my-3 resize-y"
                        />
                      ) : (
                        <BlockView block={b} />
                      )}
                      {i === blocks.length - 1 && <div className="h-2" />}
                    </div>
                  );
                })}
                {hasExisting && !currentFirst && existingCard}
              </div>
              </div>

              {!hasExisting && (
                <ChromePreview label="Site footer">
                  <Footer />
                </ChromePreview>
              )}
            </div>
            )}
          </>
        )}
      </section>

      {page && importing && codedPages[previewSrc(page.path)] && (
        <PageImportProbe path={previewSrc(page.path)} onDone={finishImport} />
      )}
      {page && toolbarHidden && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-full border bg-background/95 px-3 py-2 shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-2">
          <span className="px-1 text-xs text-muted-foreground">Add</span>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => setObjectFor("new")}>
            <Boxes className="w-4 h-4" /> Object
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => addBlock("image")}>
            <ImageIcon className="w-4 h-4" /> Image
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => addBlock("video")}>
            <Film className="w-4 h-4" /> Video
          </Button>
        </div>
      )}

      <CreatePageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async (p) => { await load(); select(p.id); }}
      />
      <ObjectPickerDialog
        open={!!objectFor}
        onOpenChange={(v) => { if (!v) setObjectFor(null); }}
        onPick={({ id, name }) => {
          if (objectFor === "new") {
            const block: ObjectBlock = { id: newId(), type: "object", objectId: id, name, align: "left" };
            setBlocks((prev) => {
              const i = objectAt === null ? prev.length : Math.max(0, Math.min(prev.length, objectAt));
              return [...prev.slice(0, i), block, ...prev.slice(i)];
            });
            setActiveId(block.id);
            setShowLive(false);
          } else if (objectFor) {
            update(objectFor, { objectId: id, name } as Partial<Block>);
          }
          setDirty(true);
          setObjectFor(null);
          setObjectAt(null);
        }}
      />
      <VideoPickerDialog
        open={!!videoFor}
        onOpenChange={(v) => { if (!v) setVideoFor(null); }}
        onPick={({ url, poster }) => {
          if (videoFor) update(videoFor, { url, poster: poster ?? undefined } as Partial<Block>);
          setVideoFor(null);
        }}
      />
      <ImagePickerDialog
        open={!!imgAsk}
        onOpenChange={(v) => { if (!v && imgAsk) { imgAsk(null); setImgAsk(null); } }}
        onPick={({ url }) => { imgAsk?.(url); setImgAsk(null); }}
      />
      <ImagePickerDialog
        open={!!pickerFor}
        onOpenChange={(v) => { if (!v) setPickerFor(null); }}
        onPick={({ url, alt }) => {
          if (pickerFor) update(pickerFor, { url, alt: alt || "" } as Partial<Block>);
          setPickerFor(null);
        }}
      />
    </div>
  );
}
