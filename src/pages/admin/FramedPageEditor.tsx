import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import type { InlineChunk, InlineEdits, InlineReports, InlineSelection } from "@/components/InlineEditSurface";
import { parseObjectClick, type ObjectClick } from "./objectClick";
import { clampEditSize, editFrameUrl, editMap, heldBlocksPayload, objectScopePayload, objectSwapPayload, type ObjectEditTarget, trustedEditMessage, type HeldObjectData } from "./framedPageProtocol";
import { remoteSelection, validSnapshot, type EditQuery, type SelectionSnapshot } from "./remoteSelection";
import { manualNavigationPath } from "./designChat/manualPageNavigation";
import { acceptFrameScroll, restoreFrameScroll } from "./designChat/frameScroll";

export interface FramedEditorController { exit: () => void; query: EditQuery; scrollToSlot?: (slot: string) => void }
export interface FramedPageEditorProps {
  base: string | null;
  path: string;
  edits: InlineEdits;
  objectEdits: Record<string, InlineEdits>;
  collapsed: Set<string>;
  selectedKey: string | null;
  sectionRevision?: number;
  apiRef?: MutableRefObject<FramedEditorController | null>;
  onChange: (scope: string, next: InlineEdits) => void;
  onSelect: (selection: InlineSelection | null) => void;
  onToggle: (key: string) => void;
  onReorder: (from: InlineChunk, to: InlineChunk, after: boolean, all: InlineChunk[]) => void;
  onOpenObject: (key: string, section: string) => void;
  /** What the public frame reports after each replay; {} until it reports, so stale or local numbers never show. */
  onReport?: (reports: InlineReports) => void;
  /** Held blocks (complete ordered list); drawn inside frames that announce capabilities.heldBlocks. */
  heldBlocks?: readonly unknown[];
  heldObjects?: Record<string, HeldObjectData>;
  activeBlockId?: string | null;
  onBlockSelect?: (id: string) => void;
  onBlockMove?: (id: string, toIndex: number) => void;
  onNavigate?: (path: string) => void;
  /** Shared object clicked in the frame; the Manager asks before editing it. */
  onObjectClick?: (click: ObjectClick) => void;
  /** Page-only copies: slot → copied object id, sent so the frame renders the copy straight away. */
  objectSwaps?: Record<string, string>;
  onUndo?: () => void;
  onRedo?: () => void;
  /** True while this frame draws the held blocks itself, so the caller hides its local list. */
  onHeldInFrame?: (inFrame: boolean) => void;
  /** Fill the editing area (one scroll inside the frame) when the frame draws held sections. */
  fill?: boolean;
  /** Editing one object alone (/__object/<id>): edit-init/update carry scope "object"; page navigation and object clicks are ignored. */
  objectScope?: ObjectEditTarget | null;
  /** After opening, ask the page frame to scroll to this object (used when coming back from the object editor). */
  scrollToSlot?: { slot: string | null; objectId: string } | null;
}
export default function FramedPageEditor(props: FramedPageEditorProps) {
  // A refreshed signed address must not replace an already open editor. Retry may explicitly adopt it.
  const [opening, setOpening] = useState(() => ({ path: props.path, base: props.base }));
  const openingBase = opening.path === props.path ? opening.base ?? props.base : props.base;
  const target = editFrameUrl(openingBase, props.path);
  useEffect(() => { if (opening.path !== props.path || (!opening.base && props.base)) setOpening({ path: props.path, base: props.base }); }, [opening.path, opening.base, props.path, props.base]);
  const origin = target ? new URL(target).origin : null;
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(props); latest.current = props;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [height, setHeight] = useState(1200);
  const [heldCapable, setHeldCapable] = useState(false);
  const [moveCapable, setMoveCapable] = useState(false);
  const moveCapableRef = useRef(false);
  const [sized, setSized] = useState(false);
  // Section changes reload only frames that cannot draw held blocks themselves.
  const [frameRevision, setFrameRevision] = useState(props.sectionRevision ?? 0);
  useEffect(() => { if (status === "ready" && !heldCapable) setFrameRevision(props.sectionRevision ?? 0); }, [props.sectionRevision, heldCapable, status]);
  const heldPayload = heldBlocksPayload(props.heldBlocks ?? [], moveCapable && !props.objectScope, props.heldObjects);
  const heldInFrame = heldCapable && heldPayload !== null;
  const capableRef = useRef(false);
  const ready = useRef(false);
  const exited = useRef(false);
  const queries = useRef(new Map<string, { resolve: (value: unknown) => void; timer: ReturnType<typeof setTimeout> }>());
  const sequence = useRef(0);
  const selectionVersion = useRef(0);
  const destination = useRef<Window | null>(null);
  const post = (type: string, payload: Record<string, unknown> = {}) => {
    const current = frame.current?.contentWindow ?? destination.current;
    destination.current = current;
    if (origin) current?.postMessage({ source: "nova-manager", type, ...payload }, origin);
  };
  const state = () => {
    const base = { edits: latest.current.edits, objectEdits: latest.current.objectEdits, collapsed: [...latest.current.collapsed], selectedKey: latest.current.selectedKey, objectSwaps: objectSwapPayload(latest.current.objectSwaps ?? {}, latest.current.heldObjects) };
    const scoped = latest.current.objectScope ? { ...base, ...objectScopePayload(latest.current.objectScope, latest.current.objectEdits) } : base;
    if (!capableRef.current) return scoped;
    // Too large: send an empty list so the frame draws nothing while the local list shows them.
    return { ...scoped, heldBlocks: heldBlocksPayload(latest.current.heldBlocks ?? [], moveCapableRef.current && !latest.current.objectScope, latest.current.heldObjects) ?? [], activeBlockId: latest.current.activeBlockId || null };
  };
  const query: EditQuery = (op, scope, key, props) => {
    if (!ready.current || exited.current) return Promise.resolve(null);
    const id = `edit-${++sequence.current}`;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { queries.current.delete(id); resolve(null); }, 3000);
      queries.current.set(id, { resolve, timer });
      post("edit-query", { id, op, scope, key, ...(props ? { props } : {}) });
    });
  };
  useLayoutEffect(() => {
    if (!origin || !target) { setStatus("failed"); return; }
    ready.current = false; exited.current = false; setStatus("loading"); setFailure(null);
    capableRef.current = false; setHeldCapable(false);
    moveCapableRef.current = false; setMoveCapable(false);
    latest.current.onReport?.({});
    destination.current = frame.current?.contentWindow ?? null;
    const timeout = setTimeout(() => setStatus("failed"), 15000);
    const exit = () => {
      if (exited.current) return;
      post("edit-exit"); exited.current = true; ready.current = false;
      selectionVersion.current++;
      queries.current.forEach(({ resolve, timer }) => { clearTimeout(timer); resolve(null); });
      queries.current.clear();
    };
    if (props.apiRef) props.apiRef.current = { exit, query, scrollToSlot: (slot) => { if (ready.current && !exited.current) post("scroll-to-slot", { slot }); } };
    const receive = (event: MessageEvent) => {
      if (!trustedEditMessage(event, frame.current, origin) || exited.current) return;
      const data = event.data;
      if (data.type === "edit-ready") {
        if (ready.current) return;
        if (latest.current.objectScope && data.capabilities?.objectEditing !== true) { clearTimeout(timeout); setFailure("This public site can't open objects for editing yet."); setStatus("failed"); return; }
        destination.current = frame.current?.contentWindow ?? null;
        capableRef.current = data.capabilities?.heldBlocks === true; setHeldCapable(capableRef.current);
        moveCapableRef.current = data.capabilities?.blockMove === true; setMoveCapable(moveCapableRef.current);
        clearTimeout(timeout); ready.current = true; setStatus("ready"); post("edit-init", state()); restoreFrameScroll(frame.current, latest.current.path); if (latest.current.scrollToSlot?.slot) post("scroll-to-slot", { slot: latest.current.scrollToSlot.slot }); return;
      }
      if (data.type === "edit-error") {
        clearTimeout(timeout); ready.current = false;
        setFailure(typeof data.reason === "string" && data.reason.trim() ? data.reason.trim().slice(0, 200) : "The public page couldn't open this for editing.");
        setStatus("failed"); return;
      }
      if (!ready.current) return;
      if (data.type === "page-scroll") {
        acceptFrameScroll(event, frame.current, latest.current.path);
      } else if (data.type === "edit-change" && typeof data.scope === "string" && data.scope) {
        const next = editMap(data.next); if (next) latest.current.onChange(data.scope, next);
      } else if (data.type === "edit-select") {
        const version = ++selectionVersion.current;
        if (data.selection === null) { latest.current.onSelect(null); return; }
        if (!validSnapshot(data.selection)) return;
        const snapshot: SelectionSnapshot = structuredClone(data.selection);
        latest.current.onSelect(remoteSelection(snapshot, query));
        // Query only missing read-only data; replies cannot overwrite a later selection.
        if (!snapshot.style || !snapshot.rect) void Promise.all([
          snapshot.style ? Promise.resolve(snapshot.style) : query("computed", snapshot.scope, snapshot.key),
          snapshot.rect ? Promise.resolve(snapshot.rect) : query("measure", snapshot.scope, snapshot.key),
        ]).then(([style, rect]) => {
          if (version !== selectionVersion.current || exited.current) return;
          if (style && typeof style === "object") snapshot.style = style as Record<string, string>;
          if (rect && typeof rect === "object") snapshot.rect = rect as DOMRectInit;
          latest.current.onSelect(remoteSelection(snapshot, query));
        });
      } else if (data.type === "edit-reply" && typeof data.id === "string") {
        const pending = queries.current.get(data.id);
        if (pending) { clearTimeout(pending.timer); queries.current.delete(data.id); pending.resolve(data.ok ? data.result : null); }
      } else if (data.type === "edit-toggle" && typeof data.key === "string") {
        latest.current.onToggle(data.key);
      } else if (data.type === "edit-open-object" && typeof (data.key ?? data.scope) === "string") {
        latest.current.onOpenObject(data.key ?? data.scope, data.section ?? data.selectedKey ?? "");
      } else if (data.type === "edit-reorder" && Array.isArray(data.all)) {
        const chunk = (c: { key?: unknown; parent?: unknown }): InlineChunk | null =>
          c && typeof c.key === "string" && typeof c.parent === "string" && editMap({ [`style:${c.key}`]: "{}", [`style:${c.parent}`]: "{}" }) ? { key: c.key, parent: c.parent, el: document.createElement("section") } : null;
        const all = data.all.map(chunk);
        const from = typeof data.from === "string" ? all.find((c: InlineChunk | null) => c?.key === data.from) : chunk(data.from);
        const to = typeof data.to === "string" ? all.find((c: InlineChunk | null) => c?.key === data.to) : chunk(data.to);
        if (from && to && from.parent === to.parent && all.every(Boolean) && from.key !== to.key) latest.current.onReorder(from, to, data.after === true, all);
      } else if (data.type === "edit-applied") {
        const reports = replayReports(data.reports); if (reports) latest.current.onReport?.(reports);
      } else if (data.type === "edit-undo") {
        latest.current.onUndo?.();
      } else if (data.type === "edit-redo") {
        latest.current.onRedo?.();
      } else if (latest.current.objectScope && (data.type === "edit-object-click" || data.type === "edit-navigate")) {
        return; // Not meaningful while one object is open on its own.
      } else if (data.type === "edit-object-click") {
        const click = parseObjectClick(data); if (click) latest.current.onObjectClick?.(click);
      } else if (data.type === "edit-navigate") {
        const path = manualNavigationPath(data.path);
        if (path !== null) latest.current.onNavigate?.(path);
      } else if (data.type === "edit-block-select" && typeof data.id === "string") {
        // Origin, window and id are the safety checks; the capability only governs what we send.
        if ((latest.current.heldBlocks ?? []).some((b) => (b as { id?: unknown; type?: unknown })?.id === data.id && (b as { type?: unknown }).type !== "page")) latest.current.onBlockSelect?.(data.id);
      } else if (data.type === "edit-block-move" && moveCapableRef.current && typeof data.id === "string" && Number.isFinite(data.toIndex)) {
        const blocks = latest.current.heldBlocks ?? [];
        if (blocks.some(b => (b as { id?: unknown })?.id === data.id && (b as { type?: unknown }).type !== "page")) {
          const count = blocks.length + (latest.current.objectScope || blocks.some(b => (b as { type?: unknown }).type === "page") ? 0 : 1);
          latest.current.onBlockMove?.(data.id, Math.max(0, Math.min(count - 1, Math.trunc(data.toIndex))));
        }
      } else if (data.type === "edit-size" && typeof data.height === "number" && Number.isFinite(data.height)) {
        setHeight(clampEditSize(data.height)); setSized(true);
      } else if (data.type === "edit-height" && Number.isFinite(data.height)) {
        setHeight(Math.max(320, Math.min(30000, data.height)));
      }
    };
    window.addEventListener("message", receive);
    return () => { clearTimeout(timeout); exit(); window.removeEventListener("message", receive); if (props.apiRef) props.apiRef.current = null; };
  }, [target, attempt, frameRevision]); // Only section actions on frames without heldBlocks reload; everything else travels through edit-update.
  useEffect(() => { if (ready.current && !exited.current) post("edit-update", state()); }, [props.edits, props.objectEdits, props.collapsed, props.selectedKey, props.heldBlocks, props.heldObjects, props.activeBlockId, props.objectSwaps, props.objectScope, heldCapable, moveCapable]);
  useEffect(() => { latest.current.onHeldInFrame?.(heldInFrame); }, [heldInFrame]);
  useEffect(() => { setSized(false); }, [target, attempt, frameRevision]);
  // Capable frames fill the canvas so their own scroll is the only one; edit-size still wins once received.
  const filling = !!props.fill && heldInFrame && !sized;
  return <div className={`relative w-full ${filling ? "h-full" : ""}`}>
    {status !== "ready" && <div role="status" className="flex items-center justify-center gap-3 bg-muted p-6 text-sm text-muted-foreground">
      {status === "loading" && target ? (props.objectScope ? "Loading the object editor…" : "Loading the page editor…") : (failure ?? (props.objectScope ? "Couldn't reach the public object page" : "Couldn't reach the public page"))}
      {(status === "failed" || !target) && <Button variant="outline" size="sm" onClick={() => { setOpening({ path: props.path, base: props.base }); setAttempt((n) => n + 1); }}>Retry</Button>}
    </div>}
    {target && <iframe key={`${target}|${attempt}|${frameRevision}`} ref={frame} src={target} title="Public Page Editor" data-site-editor="true" className={`w-full border-0 ${status !== "ready" ? "invisible absolute" : filling ? "block h-full" : "block"}`} height={filling ? "100%" : height} onError={() => setStatus("failed")} />}
  </div>;
}
const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === "string");
/** Accepts only a well-formed { [scope]: ReplayReport } from the frame; anything else is ignored. */
export function replayReports(value: unknown): InlineReports | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: InlineReports = {};
  for (const [scope, r] of Object.entries(value as Record<string, any>)) {
    if (!scope || !r || typeof r !== "object" || !strings(r.applied) || !strings(r.unchecked) || !Array.isArray(r.orphaned) || !Array.isArray(r.rejected)) return null;
    if (!r.orphaned.every((o: any) => o && typeof o.path === "string" && strings(o.kinds) && typeof o.reason === "string")) return null;
    if (!r.rejected.every((o: any) => o && typeof o.key === "string" && typeof o.reason === "string")) return null;
    out[scope] = { applied: [...r.applied], unchecked: [...r.unchecked], orphaned: r.orphaned.map((o: any) => ({ path: o.path, kinds: [...o.kinds], reason: o.reason })), rejected: r.rejected.map((o: any) => ({ key: o.key, reason: o.reason })) };
  }
  return out;
}
