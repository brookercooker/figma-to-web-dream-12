import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import type { InlineChunk, InlineEdits, InlineReports, InlineSelection } from "@/components/InlineEditSurface";
import { editFrameUrl, editMap, trustedEditMessage } from "./framedPageProtocol";
import { remoteSelection, validSnapshot, type EditQuery, type SelectionSnapshot } from "./remoteSelection";

export interface FramedEditorController { exit: () => void; query: EditQuery }
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
}
export default function FramedPageEditor(props: FramedPageEditorProps) {
  const target = editFrameUrl(props.base, props.path);
  const origin = target ? new URL(target).origin : null;
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(props); latest.current = props;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const [height, setHeight] = useState(1200);
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
  const state = () => ({ edits: latest.current.edits, objectEdits: latest.current.objectEdits, collapsed: [...latest.current.collapsed], selectedKey: latest.current.selectedKey });
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
    ready.current = false; exited.current = false; setStatus("loading");
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
    if (props.apiRef) props.apiRef.current = { exit, query };
    const receive = (event: MessageEvent) => {
      if (!trustedEditMessage(event, frame.current, origin) || exited.current) return;
      const data = event.data;
      if (data.type === "edit-ready") {
        if (ready.current) return;
        destination.current = frame.current?.contentWindow ?? null;
        clearTimeout(timeout); ready.current = true; setStatus("ready"); post("edit-init", state()); return;
      }
      if (!ready.current) return;
      if (data.type === "edit-change" && typeof data.scope === "string" && data.scope) {
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
      } else if (data.type === "edit-height" && Number.isFinite(data.height)) {
        setHeight(Math.max(320, Math.min(30000, data.height)));
      }
    };
    window.addEventListener("message", receive);
    return () => { clearTimeout(timeout); exit(); window.removeEventListener("message", receive); if (props.apiRef) props.apiRef.current = null; };
  }, [target, attempt, props.sectionRevision]); // Only explicit section actions reload; inline edits travel through latest.
  useEffect(() => { if (ready.current && !exited.current) post("edit-update", state()); }, [props.edits, props.objectEdits, props.collapsed, props.selectedKey]);
  return <div className="relative w-full">
    {status !== "ready" && <div role="status" className="flex items-center justify-center gap-3 bg-muted p-6 text-sm text-muted-foreground">
      {status === "loading" && target ? "Loading the page editor…" : "Couldn't reach the public page"}
      {(status === "failed" || !target) && <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>}
    </div>}
    {target && <iframe key={`${target}|${attempt}|${props.sectionRevision ?? 0}`} ref={frame} src={target} title="Public Page Editor" data-site-preview="true" className={`w-full border-0 ${status !== "ready" ? "invisible absolute" : "block"}`} height={height} onError={() => setStatus("failed")} />}
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
