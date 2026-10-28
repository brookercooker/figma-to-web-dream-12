import { useEditorSlot, type AddKind } from "./designChat/EditorSlot";
import { notifyContentEdited } from "./designChat/contentSync";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { useDesignChatOptional } from "./designChat/DesignChatContext";
import EmbeddedBox from "./designChat/EmbeddedBox";
import { Input } from "@/components/ui/input";
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
import PageBlocks, { BlockView, newId, parseBlocks, type Block, type BlockAlign, type ImageBlock, type ObjectBlock, type TextBlock, type VideoBlock, type CodeBlock, hasWideBlocks } from "@/components/PageBlocks";

import SharedObjectNotice from "./SharedObjectNotice";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InsertGap, { type InsertType } from "./InsertGap";
import { readStyle, styleKey, type InlineChunk, type InlineEdits, type InlineScope, type InlineSelection } from "@/components/InlineEditSurface";
import InlineStylePanel from "./InlineStylePanel";
import InlineEditSafetyPanel from "./InlineEditSafetyPanel";
import InlineDestinationPanel from "./InlineDestinationPanel";
import { hasVisibleEdits, withoutPath } from "@/lib/inlineEditCore";
import type { InlineReports } from "@/components/InlineEditSurface";
import { useEditorLinkGuard } from "@/components/useEditorLinkGuard";
import { insertPickedBlock, pageInsertPosition } from "./pageInsertion";
import FramedPageEditor, { type FramedEditorController } from "./FramedPageEditor";
import { editMap } from "./framedPageProtocol";
import { draftEmbedUrl } from "./siteManifest";
import { usePageEditorSurface } from "./usePageEditorSurface";
import { remoteSnapshot } from "./remoteSelection";

interface PageRow { id: string; name: string; path: string; content: unknown; updated_at: string; tags?: string[] | null; inline_edits?: InlineEdits | null; build_status?: string | null }

export const previewSrc = (path: string) => (path === "/" ? "/home" : path);
export function InlinePagePreview({ name, blocks }: { name: string; blocks: Block[] }) {
  return <div><Header /><h1 className="font-serif text-3xl">{name}</h1><PageBlocks blocks={blocks} /><Footer /></div>;
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

export default function DesignTab({ embedded = false, pageId }: { embedded?: boolean; pageId?: string } = {}) {
  const blockCanvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // Embedded in the Site Manager's edit mode, the page comes from the working page, not the address.
  const selectedId = embedded ? pageId ?? "" : params.get("page") ?? "";
  const { slot, registerSave, saveAll, registerDiscard, registerHasChanges, registerAdd } = useEditorSlot();
  // Embedded, nothing auto-saves: changes are held here until the Site Manager's Save changes saves them all.
  const pendingInline = useRef<{ pageId: string; next: InlineEdits } | null>(null);
  const pendingObjects = useRef<Record<string, InlineEdits>>({});
  const [tweaksPending, setTweaksPending] = useState(false);

  const [pages, setPages] = useState<PageRow[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [sectionRevision, setSectionRevision] = useState(0);
  // Batch a held section change with exactly one explicit public-frame reload.
  const changeBlocks = (next: Block[] | ((current: Block[]) => Block[])) => {
    setBlocks(next);
    setSectionRevision((revision) => revision + 1);
    setDirty(true);
  };
  const [activeId, setActiveId] = useState<string>("");
  const [heldInFrame, setHeldInFrame] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [videoFor, setVideoFor] = useState<string | null>(null);
  const [imageAt, setImageAt] = useState<number | null>(null);
  const [videoAt, setVideoAt] = useState<number | null>(null);
  const scrollToNew = useRef<string | null>(null);
  // block id waiting for an object choice, or "new" when adding one
  const [objectFor, setObjectFor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [listOpen, setListOpen] = useState(() => !new URLSearchParams(window.location.search).get("page"));
  const [dragId, setDragId] = useState<string>("");
  const [dropAt, setDropAt] = useState<{ id: string; before: boolean } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [objectAt, setObjectAt] = useState<number | null>(null);
  const discarded = useRef(false);
  const opening = useRef<PageRow | null>(null);
  const originalObjects = useRef<Record<string, InlineEdits>>({});
  const persistedPage = useRef(false);
  const persistedObjects = useRef(new Set<string>());
  const [closed, setClosed] = useState(false);
  // In-place editing of a coded page: type over text, click pictures to swap.
  const [inlineEdits, setInlineEdits] = useState<InlineEdits>({});
  const framedApi = useRef<FramedEditorController | null>(null);
  const [framedReports, setFramedReports] = useState<InlineReports>({});
  const [resetKey, setResetKey] = useState(0);
  // Embedded pages not in the coded list: what loading their code found, and a counter that re-runs the load.
  const [inlineSel, setInlineSel] = useState<InlineSelection | null>(null);
  const [foldedChunks, setFoldedChunks] = useState<Set<string>>(new Set());
  // Edits on shared objects, keyed by object; saved on the object so every page shows them.
  const [objectEdits, setObjectEdits] = useState<Record<string, InlineEdits>>({});
  const objectRows = useRef<Record<string, string>>({});
  const objectTimers = useRef<Record<string, number>>({});
  useEffect(() => {
    (supabase as any).from("object_registry").select("id,component_key,inline_edits").then(({ data }: any) => {
      const edits: Record<string, InlineEdits> = {};
      (data ?? []).forEach((r: any) => {
        if (!r.component_key) return;
        objectRows.current[r.component_key] = r.id;
        if (r.inline_edits) edits[r.component_key] = r.inline_edits;
      });
      originalObjects.current = structuredClone(edits);
      setObjectEdits(edits);
    });
  }, []);
  const changeScope = (scope: InlineScope, next: InlineEdits, remote = false) => {
    remote = remote || !!(inlineSel && remoteSnapshot(inlineSel.el));
    const snapshot = inlineSel && remoteSnapshot(inlineSel.el);
    if (snapshot && scope === snapshot.scope && snapshot.fingerprint && Object.keys(next).some(k => { const parsed = k.includes(":") ? k.slice(k.indexOf(":") + 1) : k; return parsed === snapshot.key && !k.startsWith("fp:"); })) next = { ...next, [`fp:${snapshot.key}`]: JSON.stringify(snapshot.fingerprint) };
    if (snapshot?.link?.fingerprint && scope === snapshot.link.scope && next[`link:${snapshot.link.key}`]) next = { ...next, [`fp:${snapshot.link.key}`]: JSON.stringify(snapshot.link.fingerprint) };
    if (scope === "page") {
      return changeInline(next, remote);
    }
    setObjectEdits((cur) => ({ ...cur, [scope]: next }));
    const id = objectRows.current[scope];
    if (!id) return;
    if (embedded) { pendingObjects.current[scope] = next; setTweaksPending(true); return; }
    window.clearTimeout(objectTimers.current[scope]);
    objectTimers.current[scope] = window.setTimeout(() => {
      (supabase as any).from("object_registry").update({ inline_edits: next, updated_at: new Date().toISOString() }).eq("id", id).then(({ error }: any) => { if (!error) notifyContentEdited(); });
    }, 800);
  };
  const scopeEdits = (scope: InlineScope) => scope === "page" ? inlineEdits : objectEdits[scope] ?? {};
  /** Reorder sections among siblings, using order styles on the page's own edits. */
  const reorderChunks = (from: InlineChunk, to: InlineChunk, after: boolean, all: InlineChunk[]) => {
    const sibs = all.filter((c) => c.parent === from.parent);
    const orderOf = (c: InlineChunk, i: number) => {
      const o = parseInt(readStyle(inlineEdits, c.key).order ?? "");
      return Number.isFinite(o) ? o : i;
    };
    const list = sibs.map((c, i) => ({ c, o: orderOf(c, i) })).sort((a, b) => a.o - b.o).map((x) => x.c).filter((c) => c.key !== from.key);
    const at = list.findIndex((c) => c.key === to.key);
    list.splice(after ? at + 1 : at, 0, from);
    const out = { ...inlineEdits };
    const patch = (key: string, props: Record<string, string>) => { out[styleKey(key)] = JSON.stringify({ ...readStyle(out, key), ...props }); };
    patch(from.parent, { display: "flex", "flex-direction": "column" });
    list.forEach((c, i) => patch(c.key, { order: String(i) }));
    changeInline(out, !!framedApi.current);
  };
  const [imgAsk, setImgAsk] = useState<((url: string | null) => void) | null>(null);
  const pickImage = () => new Promise<string | null>((resolve) => setImgAsk(() => resolve));
  const inlineTimer = useRef<number>();
  const changeInline = (next: InlineEdits, remote = false) => {
    setInlineEdits(next);
    const id = selectedId;
    if (embedded) { pendingInline.current = { pageId: id, next }; setTweaksPending(true); return; }
    window.clearTimeout(inlineTimer.current);
    inlineTimer.current = window.setTimeout(async () => {
      const updated_at = new Date().toISOString();
      const { error } = await (supabase as any).from("pages").update({ inline_edits: next, updated_at }).eq("id", id);
      if (!error) notifyContentEdited();
      setPages((cur) => cur.map((x) => (x.id === id ? { ...x, inline_edits: next, updated_at } : x)));
    }, 800);
  };


  const load = async () => {
    const { data } = await (supabase as any)
      .from("pages")
      .select("id,name,path,content,updated_at,tags,inline_edits,build_status")
      .is("archived_at", null)
      .order("name", { ascending: true });
    setPages(data ?? []);
    return (data ?? []) as PageRow[];
  };

  useEffect(() => { load(); }, []);

  const page = useMemo(() => pages.find((p) => p.id === selectedId) ?? null, [pages, selectedId]);
  const surface = usePageEditorSurface(page);
  const framed = surface === "framed";
  useEffect(() => {
    // Wait for the page to load so a "mode=edit" link isn't used up early.
    if (!page) return;
    const parsed = parseBlocks(page?.content);
    opening.current = structuredClone(page);
    discarded.current = false;
    setClosed(false);
    persistedPage.current = false;
    persistedObjects.current.clear();
    setBlocks(parsed);
    setActiveId("");
    setDirty(false);
    setInlineSel(null);
    setFoldedChunks(new Set());
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
    if (pg.id === selectedId && !embedded) {
      const next = new URLSearchParams(params);
      next.delete("page");
      setParams(next, { replace: true });
    }
    setDeleting(null);
  };

  const select = (id: string) => {
    if (embedded) return;
    const next = new URLSearchParams(params);
    next.set("page", id);
    setParams(next, { replace: true });
  };

  const update = (id: string, patch: Partial<Block>) => {
    changeBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  };

  const addPickedBlock = (block: Block, at: number) => {
    if (discarded.current) return;
    const next = insertPickedBlock(blocks, block, blocks.length);
    if (page) pendingSave.current = { pageId: page.id, snapshot: next };
    changeBlocks(next);
    scrollToNew.current = block.id;
    setActiveId(block.id);
  };

  useEffect(() => {
    if (!scrollToNew.current) return;
    const el = blockCanvasRef.current?.querySelector<HTMLElement>(`[data-page-block="${scrollToNew.current}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    scrollToNew.current = null;
  }, [blocks]);

  const addBlock = (type: Block["type"], at?: number) => {
    const position = pageInsertPosition(blocks, activeId, at);
    if (type === "image") { setImageAt(position); setPickerFor("new"); return; }
    if (type === "video") { setVideoAt(position); setVideoFor("new"); return; }
    const base = { id: newId(), align: "left" as BlockAlign };
    const block: Block =
      type === "heading"
          ? { ...base, type: "heading", text: "New heading", size: "lg" } as TextBlock
          : { ...base, type: "text", text: "Write something here.", size: "md" } as TextBlock;
    addPickedBlock(block, position);
  };

  const insertAt = (type: InsertType, at: number) => {
    if (type === "object") { setObjectAt(pageInsertPosition(blocks, activeId, at)); setObjectFor("new"); return; }
    addBlock(type, at);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    changeBlocks((prev) => {
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
  const [localDevice, setDevice] = useState<Device>("desktop");
  // Embedded, the Site Manager's size buttons size the wrapper around the editor; inside it everything fills at full width.
  const chat = useDesignChatOptional();
  const device: Device = embedded ? "desktop" : localDevice;
  const deviceStyle = !embedded && DEVICE_WIDTH[device] ? { width: DEVICE_WIDTH[device], maxWidth: "100%", margin: "0 auto" } : undefined;
  const h70 = embedded ? "h-full" : "h-[70vh]";
  const frame = embedded ? "h-full overflow-hidden bg-background" : "border rounded-lg overflow-hidden bg-background";
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
        next = { id: el.dataset.pageBlock ?? "", before: lastY < r.top + r.height / 2 };
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
      ghost.setAttribute("data-editor-drag-ghost", "");
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
    changeBlocks((prev) => {
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
    changeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const save = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("pages")
        .update({ content: blocks })
        .eq("id", page.id);
      if (error) throw error;
      pendingSave.current = null;
      notifyContentEdited();
      await load();
      setDirty(false);
      toast.success(`Saved — your page is live at ${page.path}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the page");
    } finally { setSaving(false); }
  };

  // Unsaved block changes waiting for auto-save; flushed if the editor closes or the page changes.
  const pendingSave = useRef<{ pageId: string; snapshot: Block[] } | null>(null);

  // Auto-save: quietly store changes shortly after the user stops editing.
  useEffect(() => {
    if (!dirty || !page || discarded.current) return;
    const pageId = page.id;
    const snapshot = blocks;
    pendingSave.current = { pageId, snapshot };
    if (embedded) return;
    const t = setTimeout(async () => {
      setSaving(true);
      const { error } = await (supabase as any)
        .from("pages")
        .update({ content: snapshot })
        .eq("id", pageId);
      setSaving(false);
      if (error) { toast.error(error.message ?? "Could not save the page"); return; }
      if (pendingSave.current?.snapshot === snapshot) pendingSave.current = null;
      notifyContentEdited();
      setPages((cur) => cur.map((x) => (x.id === pageId ? { ...x, content: snapshot, updated_at: new Date().toISOString() } as any : x)));
      setBlocks((cur) => { if (cur === snapshot) setDirty(false); return cur; });
    }, 800);
    return () => clearTimeout(t);
  }, [blocks, dirty, page?.id]);

  // On unmount or page change, save any pending changes right away (a safety net; embedded, Save changes normally saves first).
  useEffect(() => {
    return () => {
      if (embedded || discarded.current) {
        pendingSave.current = null; pendingInline.current = null; pendingObjects.current = {};
        return;
      }
      const p = pendingSave.current;
      const inl = pendingInline.current;
      const objs = pendingObjects.current;
      pendingSave.current = null;
      pendingInline.current = null;
      pendingObjects.current = {};
      const writes: Promise<any>[] = [];
      if (p) writes.push((supabase as any).from("pages").update({ content: p.snapshot }).eq("id", p.pageId));
      if (inl) writes.push((supabase as any).from("pages").update({ inline_edits: inl.next, updated_at: new Date().toISOString() }).eq("id", inl.pageId));
      Object.entries(objs).forEach(([scope, next]) => {
        const id = objectRows.current[scope];
        if (id) writes.push((supabase as any).from("object_registry").update({ inline_edits: next, updated_at: new Date().toISOString() }).eq("id", id));
      });
      if (!writes.length) return;
      Promise.all(writes).then((rs) => { if (rs.some((x: any) => !x?.error)) notifyContentEdited(); });
    };
  }, [page?.id]);

  /** Embedded: write everything held in memory. False (after a message) if any write failed; failed parts stay held. */
  const saveAllRef = useRef<() => Promise<boolean>>(async () => true);
  saveAllRef.current = async () => {
    if (discarded.current) return false;
    let wrote = false;
    let failed: string | null = null;
    const p = pendingSave.current;
    if (p) {
      const { error } = await (supabase as any).from("pages").update({ content: p.snapshot }).eq("id", p.pageId);
      if (error) failed = error.message ?? "Could not save the page";
      else {
        wrote = true;
        persistedPage.current = true;
        if (pendingSave.current === p) pendingSave.current = null;
        setPages((cur) => cur.map((x) => (x.id === p.pageId ? { ...x, content: p.snapshot, updated_at: new Date().toISOString() } as any : x)));
        setBlocks((cur) => { if (cur === p.snapshot) setDirty(false); return cur; });
      }
    }
    const inl = pendingInline.current;
    if (inl) {
      const updated_at = new Date().toISOString();
      const { error } = await (supabase as any).from("pages").update({ inline_edits: inl.next, updated_at }).eq("id", inl.pageId);
      if (error) failed = failed ?? (error.message ?? "Could not save your changes");
      else {
        wrote = true;
        persistedPage.current = true;
        if (pendingInline.current === inl) pendingInline.current = null;
        setPages((cur) => cur.map((x) => (x.id === inl.pageId ? { ...x, inline_edits: inl.next, updated_at } : x)));
      }
    }
    for (const [scope, next] of Object.entries(pendingObjects.current)) {
      const id = objectRows.current[scope];
      if (!id) { delete pendingObjects.current[scope]; continue; }
      const { error } = await (supabase as any).from("object_registry").update({ inline_edits: next, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) failed = failed ?? (error.message ?? "Could not save the shared section");
      else { wrote = true; persistedObjects.current.add(scope); if (pendingObjects.current[scope] === next) delete pendingObjects.current[scope]; }
    }
    setTweaksPending(!!pendingInline.current || Object.keys(pendingObjects.current).length > 0);
    if (wrote) notifyContentEdited();
    if (failed) { toast.error(failed); return false; }
    return true;
  };
  const hasChangesRef = useRef<() => boolean>(() => false);
  hasChangesRef.current = () => !discarded.current && (dirty || tweaksPending || !!pendingSave.current || !!pendingInline.current || Object.keys(pendingObjects.current).length > 0);
  useEffect(() => {
    if (!embedded) return;
    registerSave(() => saveAllRef.current());
    registerDiscard(async () => {
      discarded.current = true;
      window.clearTimeout(inlineTimer.current);
      Object.values(objectTimers.current).forEach(window.clearTimeout);
      pendingSave.current = null; pendingInline.current = null; pendingObjects.current = {};
      const baseline = opening.current;
      const writes: Promise<any>[] = [];
      if (baseline && persistedPage.current) writes.push((supabase as any).from("pages").update({ content: baseline.content, inline_edits: baseline.inline_edits, updated_at: baseline.updated_at }).eq("id", baseline.id));
      for (const scope of persistedObjects.current) {
        const id = objectRows.current[scope];
        if (id) writes.push((supabase as any).from("object_registry").update({ inline_edits: originalObjects.current[scope] ?? {} }).eq("id", id));
      }
      const results = await Promise.all(writes);
      if (results.some((r) => r.error)) { discarded.current = false; toast.error("Couldn't restore your original page. Try discarding again."); throw new Error("Discard failed"); }
      if (baseline) {
        setPages((cur) => cur.map((p) => p.id === baseline.id ? baseline : p));
        setBlocks(parseBlocks(baseline.content)); setInlineEdits(baseline.inline_edits ?? {});
      }
      setObjectEdits(structuredClone(originalObjects.current));
      framedApi.current?.exit();
      setTweaksPending(false); setDirty(false); setActiveId("");
      setInlineSel(null); setFoldedChunks(new Set()); setResetKey((k) => k + 1); setClosed(true);
      if (writes.length) notifyContentEdited();
    });
    registerHasChanges(() => hasChangesRef.current());
    return () => { registerSave(null); registerDiscard(null); registerHasChanges(null); };
  }, [embedded, registerSave, registerDiscard, registerHasChanges]);

  // Embedded: ask before the browser leaves while changes are still held.
  const hasUnsaved = embedded && (dirty || tweaksPending);
  useEffect(() => {
    if (!hasUnsaved) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);

  const setBuildStatus = async (status: "draft" | "ready") => {
    if (!page?.id || page.build_status === status) return;
    const id = page.id;
    const { error } = await (supabase as any).from("pages").update({ build_status: status }).eq("id", id);
    if (error) { toast.error(error.message ?? "Could not change the status"); return; }
    setPages((cur) => cur.map((x) => (x.id === id ? { ...x, build_status: status } : x)));
    notifyContentEdited();
    toast.success(status === "ready"
      ? "Marked Ready. It will be included the next time you submit for review."
      : "Marked Draft. It will not be published.");
  };

  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) { setToolbarHidden(false); return; }
    const io = new IntersectionObserver(([e]) => setToolbarHidden(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const addButtons = (
    <>
              <Button variant="outline" size="sm" className="gap-2" title="Add an Object" onClick={() => insertAt("object", pageInsertPosition(blocks, activeId))}>
                <Boxes className="w-4 h-4" /> Object
              </Button>
              <Button variant="outline" size="sm" className="gap-2" title="Add an Image" onClick={() => addBlock("image")}>
                <ImageIcon className="w-4 h-4" /> Image
              </Button>
              <Button variant="outline" size="sm" className="gap-2" title="Add a Video" onClick={() => addBlock("video")}>
                <Film className="w-4 h-4" /> Video
              </Button>
    </>
  );

  // Manual Edit Mode: the top bar's Objects / Images / Videos open these pickers; choices go beneath the original.
  const addFromTopBar = useRef<(kind: AddKind) => void>(() => {});
  addFromTopBar.current = (kind) => {
    if (kind === "objects") insertAt("object", pageInsertPosition(blocks, activeId));
    else addBlock(kind === "images" ? "image" : "video");
  };
  useEffect(() => {
    if (!embedded || !registerAdd) return;
    registerAdd((kind) => addFromTopBar.current(kind));
    return () => registerAdd(null);
  }, [embedded, registerAdd]);

  const stylePanel = (
    <>
                    {inlineSel && inlineSel.scope !== "page" && (
                      <p className="mb-4 rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                        Part of the shared object <span className="font-medium text-foreground">{inlineSel.scope}</span>. Changes apply everywhere it's used.
                      </p>
                    )}
                    {inlineSel?.scope === "Header" && <>
                      <SharedObjectNotice componentKey="Header" />
                      <Button variant="outline" size="sm" onClick={async () => { const id = objectRows.current.Header; if (!id) return; if (embedded) { if (await saveAll()) chat?.openObject(id, inlineSel.key); } else navigate(`/manage/objects/design?object=${id}&returnPage=${selectedId}&section=${encodeURIComponent(inlineSel.key)}`); }}>Open in Object Editor</Button>
                    </>}
                    <InlineStylePanel
                      sel={inlineSel}
                      edits={inlineSel ? scopeEdits(inlineSel.scope) : inlineEdits}
                      onChange={(next) => changeScope(inlineSel?.scope ?? "page", next)}
                      onReplaceImage={async () => {
                        if (!inlineSel) return;
                        const url = await pickImage();
                        if (url) changeScope(inlineSel.scope, { ...scopeEdits(inlineSel.scope), [`img:${inlineSel.key}`]: url });
                      }}
                    />
                    <InlineDestinationPanel selection={inlineSel} editsFor={scopeEdits} onChange={changeScope} pages={pages} />
                    {/* Framed pages replay in the public frame; local reports would be stale, so show none until the frame reports. */}
                    <InlineEditSafetyPanel reports={framed ? framedReports : {}} selection={inlineSel} editsFor={scopeEdits}
                      discard={(scope, path) => changeScope(scope, withoutPath(scopeEdits(scope), path))}
                      record={async () => { if (!framed) return; const maps = await recordFramed(); if (maps) for (const [scope, next] of Object.entries(maps)) if (JSON.stringify(next) !== JSON.stringify(scopeEdits(scope))) changeScope(scope, next); if (embedded) void saveAllRef.current(); }}
                      resetAll={() => { changeInline({}); for (const scope of new Set([...Object.keys(framedReports), "Header"])) if (scope !== "page") changeScope(scope, {}); setInlineSel(null); }} />
    </>
  );
  const blockTools = (b: Block, i: number) => (
    <>
                          {b.type === "code" ? <span className="text-xs">{b.name}{b.locked ? " · Built in Code" : ""}</span> : b.type === "object" ? (
                            <>
                              <button
                                type="button"
                                title={collapsed[b.id] ? "Expand Object" : "Collapse Object"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCollapsed((c) => ({ ...c, [b.id]: !c[b.id] }));
                                }}
                                className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                              >
                                {collapsed[b.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span>Object: {b.name ?? "Saved Object"}</span>
                              </button>
                              <ToolButton title="Replace" onClick={() => setObjectFor(b.id)}>
                                <Boxes className="w-4 h-4" />
                                <span className="ml-1 text-xs">Replace</span>
                              </ToolButton>
                              <ToolButton
                                title="Edit"
                                onClick={async () => { if (embedded) { if (await saveAll()) chat?.openObject(b.objectId); return; } navigate(`/manage/objects/design?object=${b.objectId}&returnPage=${selectedId}`); }}
                              >
                                <Pencil className="w-4 h-4" />
                                <span className="ml-1 text-xs">Edit</span>
                              </ToolButton>
                            </>
                          ) : b.type === "heading" || b.type === "text" ? (
                            <>
                              <ToolButton
                                title={b.type === "heading" ? "Turn into Text" : "Turn into Heading"}
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
                                <ToolButton title="Replace Video" onClick={() => setVideoFor(b.id)}>
                                  <Film className="w-4 h-4" />
                                  <span className="ml-1 text-xs">Replace</span>
                                </ToolButton>
                              ) : (
                                <ToolButton title="Replace Image" onClick={() => setPickerFor(b.id)}>
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
                          {b.type !== "object" && b.type !== "code" && (
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
                          {i > 0 && (
                            <ToolButton title="Move Up" onClick={() => move(b.id, -1)}><ArrowUp className="w-4 h-4" /></ToolButton>
                          )}
                          {i < blocks.length - 1 && (
                            <ToolButton title="Move Down" onClick={() => move(b.id, 1)}><ArrowDown className="w-4 h-4" /></ToolButton>
                          )}
                          <ToolButton title="Delete Block" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></ToolButton>
    </>
  );

  const blockLabel = (b: Block) => b.type === "object" ? `Object: ${b.name ?? "Saved Object"}` : b.type === "code" ? b.name : b.type === "text" || b.type === "heading" ? b.text : b.type === "image" ? "Image" : "Video";
  const tools = <div className="space-y-4 p-3">
    {stylePanel}
    <p className="text-xs font-medium">Sections</p>
    <ol className="divide-y border rounded-md">
      <li className="px-2 py-2 text-xs">{page?.name}</li>
      {blocks.map((b,i) => <li key={b.id} data-section-row={b.id} aria-current={activeId === b.id || undefined} className={`flex items-center gap-1 px-2 py-2 ${activeId === b.id ? "bg-accent" : ""}`}>
        <Button variant="ghost" size="sm" className="min-w-0 flex-1 justify-start truncate" onClick={() => { setActiveId(b.id); if (heldInFrame) { void framedApi.current?.query("scrollTo", "held", b.id); return; } blockCanvasRef.current?.querySelector(`[data-page-block="${b.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }); }}>{blockLabel(b)}</Button>
        {i > 0 && <ToolButton title="Move Up" onClick={() => move(b.id,-1)}><ArrowUp className="h-4 w-4" /></ToolButton>}
        {i < blocks.length-1 && <ToolButton title="Move Down" onClick={() => move(b.id,1)}><ArrowDown className="h-4 w-4" /></ToolButton>}
        <ToolButton title="Delete Block" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></ToolButton>
      </li>)}
    </ol>
    {(() => { const i=blocks.findIndex(b=>b.id===activeId); return i < 0 ? null : <div className="flex flex-wrap gap-1">{blockTools(blocks[i],i)}</div>; })()}
  </div>;

  /** Framed pages: the public frame records fingerprints (withFingerprints per scope); invalid maps are dropped. */
  const recordFramed = async (): Promise<Record<string, InlineEdits>> => {
    const result = await framedApi.current?.query("record", "page", "");
    const out: Record<string, InlineEdits> = {};
    if (result && typeof result === "object") for (const [scope, map] of Object.entries(result as Record<string, unknown>)) { const ok = editMap(map); if (ok) out[scope] = ok; }
    return out;
  };
  const openInlineObject = async (key: string, section: string) => {
    const id = objectRows.current[key]; if (!id) return;
    if (embedded) { if (await saveAll()) chat?.openObject(id, section); }
    else navigate(`/manage/objects/design?object=${id}&returnPage=${selectedId}&section=${encodeURIComponent(section)}`);
  };
  if (closed) return null;
  return (<div className={embedded ? "h-full min-h-0" : "grid gap-4 lg:grid-cols-[240px_1fr]"}>
    {!embedded && <aside><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search pages" />{filtered.map(p=><Button key={p.id} variant="ghost" className="w-full justify-start" onClick={()=>select(p.id)}>{p.name}</Button>)}{tools}</aside>}
    {surface === "loading" && selectedId && <div role="status" className="flex items-center justify-center bg-muted p-6 text-sm text-muted-foreground">Loading the page editor…</div>}
    {page && surface !== "loading" && <EmbeddedBox chat={embedded ? chat : null}>
      <div ref={blockCanvasRef} className={`relative isolate h-full w-full ${heldInFrame && !deviceStyle ? "overflow-hidden" : "overflow-y-auto"} bg-background`} style={deviceStyle}>
        {!embedded && <div className="flex gap-2">{addButtons}</div>}
        <FramedPageEditor key={`public-${page.id}`} base={draftEmbedUrl()} path={page.path} edits={inlineEdits} objectEdits={objectEdits}
          sectionRevision={sectionRevision} heldBlocks={blocks} activeBlockId={activeId || null}
          onBlockSelect={(id) => { setActiveId(id); setInlineSel(null); requestAnimationFrame(() => document.querySelector(`[data-section-row="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" })); }} onHeldInFrame={setHeldInFrame} fill={!deviceStyle}
          collapsed={foldedChunks} selectedKey={inlineSel ? `${inlineSel.scope}|${inlineSel.key}` : null} apiRef={framedApi}
          onChange={(scope, next) => changeScope(scope, next, true)} onSelect={setInlineSel}
          onToggle={k => setFoldedChunks(cur => { const next = new Set(cur); if (next.has(k)) next.delete(k); else next.add(k); return next; })}
          onReorder={reorderChunks} onOpenObject={openInlineObject} onReport={setFramedReports} />
        {/* Held sections: full pane width, selected (never played or opened) until saved into the public page. */}
        {!heldInFrame && <div data-held-sections className="w-full">
          {blocks.map((b)=><section key={b.id} data-page-block={b.id} data-active={activeId === b.id || undefined}
            className={`relative ${embedded ? "cursor-pointer [&_iframe]:pointer-events-none [&_video]:pointer-events-none" : ""} ${embedded && activeId === b.id ? "outline outline-2 -outline-offset-2 outline-primary" : ""}`}
            onClickCapture={embedded ? (e) => { if ((e.target as HTMLElement).closest("[contenteditable=true],input,textarea,select")) return; e.preventDefault(); setActiveId(b.id); setInlineSel(null); } : undefined}>
            <BlockView block={b} />
          </section>)}
        </div>}
      </div>
    </EmbeddedBox>}
    {embedded && slot && createPortal(tools,slot)}
      <CreatePageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async (p) => { await load(); select(p.id); }}
      />
      <ObjectPickerDialog
        open={!!objectFor}
        onOpenChange={(v) => { if (!v) { setObjectFor(null); setObjectAt(null); } }}
        onPick={({ id, name }) => {
          if (objectFor === "new") {
            const block: ObjectBlock = { id: newId(), type: "object", objectId: id, name, align: "left" };
            addPickedBlock(block, pageInsertPosition(blocks, activeId, objectAt));
          } else if (objectFor) {
            update(objectFor, { objectId: id, name } as Partial<Block>);
          }
          setObjectFor(null);
          setObjectAt(null);
        }}
      />
      <VideoPickerDialog
        open={!!videoFor}
        onOpenChange={(v) => { if (!v) { setVideoFor(null); setVideoAt(null); } }}
        onPick={({ url, poster }) => {
          if (videoFor === "new") {
            addPickedBlock({ id: newId(), type: "video", align: "left", width: 100, url, poster: poster ?? undefined } as VideoBlock, pageInsertPosition(blocks, activeId, videoAt));
          } else if (videoFor) update(videoFor, { url, poster: poster ?? undefined } as Partial<Block>);
          setVideoFor(null);
          setVideoAt(null);
        }}
      />
      <ImagePickerDialog
        open={!!imgAsk}
        onOpenChange={(v) => { if (!v && imgAsk) { imgAsk(null); setImgAsk(null); } }}
        onPick={({ url }) => { imgAsk?.(url); setImgAsk(null); }}
      />
      <ImagePickerDialog
        open={!!pickerFor}
        onOpenChange={(v) => { if (!v) { setPickerFor(null); setImageAt(null); } }}
        onPick={({ url, alt }) => {
          if (pickerFor === "new") {
            addPickedBlock({ id: newId(), type: "image", align: "left", width: 100, url, alt: alt || "" } as ImageBlock, pageInsertPosition(blocks, activeId, imageAt));
          } else if (pickerFor) update(pickerFor, { url, alt: alt || "" } as Partial<Block>);
          setPickerFor(null);
          setImageAt(null);
        }}
      />
    </div>
  );
}

