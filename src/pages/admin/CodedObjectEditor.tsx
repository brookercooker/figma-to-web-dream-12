import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import InlineEditSurface, { pathOf, type InlineEditController, type InlineReports, type InlineSelection } from "@/components/InlineEditSurface";
import { objectRegistry } from "@/components/objects/registry";
import { resolvePath, withoutPath, type InlineEdits } from "@/lib/inlineEditCore";
import { Button } from "@/components/ui/button";
import { supabase } from "@/prototype/client";
import InlineStylePanel from "./InlineStylePanel";
import InlineDestinationPanel from "./InlineDestinationPanel";
import InlineEditSafetyPanel from "./InlineEditSafetyPanel";
import ImagePickerDialog from "./ImagePickerDialog";
import ConfirmDialog from "./ConfirmDialog";
import EmbeddedBox from "./designChat/EmbeddedBox";
import { useEditorSlot } from "./designChat/EditorSlot";
import { useDesignChatOptional } from "./designChat/DesignChatContext";
import { notifyContentEdited } from "./designChat/contentSync";

export interface CodedObjectRow { id: string; name: string; component_key: string; inline_edits?: InlineEdits }

/** Coded objects always edit the same object-root overrides as a page surface. */
export default function CodedObjectEditor({ object, embedded, focusSection, onConvert }: {
  object: CodedObjectRow; embedded: boolean; focusSection?: string; onConvert: () => void;
}) {
  const key = object.component_key;
  const C = objectRegistry[key].component;
  const chat = useDesignChatOptional();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { slot, registerSave, registerDiscard, registerHasChanges } = useEditorSlot();
  const [edits, setEdits] = useState<InlineEdits>(object.inline_edits ?? {});
  const current = useRef(edits); current.current = edits;
  const saved = useRef(edits);
  const pending = useRef(false);
  const version = useRef(0);
  const timer = useRef<number>();
  const api = useRef<InlineEditController | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<InlineSelection | null>(null);
  const [reports, setReports] = useState<InlineReports>({});
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState(true);
  const [pages, setPages] = useState<{ id: string; name: string; path: string }[]>([]);
  const [imageAsk, setImageAsk] = useState<((url: string | null) => void) | null>(null);
  const pickImage = () => new Promise<string | null>((resolve) => setImageAsk(() => resolve));
  const save = async () => {
    window.clearTimeout(timer.current);
    if (!pending.current) return true;
    const next = current.current;
    const revision = version.current;
    const { error } = await (supabase as any).from("object_registry")
      .update({ inline_edits: next, updated_at: new Date().toISOString() }).eq("component_key", key);
    if (error) { toast.error(error.message ?? "Could not save this object"); return false; }
    saved.current = next;
    if (revision === version.current) pending.current = false;
    notifyContentEdited();
    return true;
  };
  const saveRef = useRef(save); saveRef.current = save;
  const change = (scope: string, next: InlineEdits) => {
    if (scope !== key) return;
    next = api.current?.prepare(key, next) ?? next;
    current.current = next; setEdits(next); pending.current = true; version.current++;
    if (!embedded) { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => void saveRef.current(), 800); }
  };
  useEffect(() => {
    (supabase as any).from("pages").select("id,name,path").is("archived_at", null)
      .then(({ data }: any) => setPages(data ?? []));
  }, []);
  useEffect(() => {
    if (!embedded) return;
    registerSave(() => saveRef.current());
    registerDiscard(() => { window.clearTimeout(timer.current); version.current++; pending.current = false; current.current = saved.current; setEdits(saved.current); setSelection(null); });
    registerHasChanges(() => pending.current);
    return () => { registerSave(null); registerDiscard(null); registerHasChanges(null); };
  }, [embedded, registerSave, registerDiscard, registerHasChanges]);
  useEffect(() => () => { window.clearTimeout(timer.current); }, []);
  const focused = useRef(false);
  useEffect(() => {
    if (!editing || focusSection === undefined || focused.current) return;
    const root = canvas.current?.querySelector(".inline-edit-surface")?.firstElementChild;
    if (!root || root.querySelector(".animate-pulse")) return;
    const el = resolvePath(root, focusSection);
    if (!(el instanceof HTMLElement)) return;
    focused.current = true;
    const link = el.closest<HTMLElement>('a,button,[role="button"],[role="link"]');
    setSelection({ scope: key, key: focusSection, el, kind: el.tagName === "IMG" ? "image" : "text",
      ...(link && root.contains(link) ? { link: { el: link, scope: key, key: pathOf(root, link) } } : {}) });
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [editing, focusSection, reports, key]);
  const editsFor = (scope: string) => scope === key ? edits : {};
  const tools = <>
    <InlineStylePanel sel={selection} edits={edits} onChange={(next) => change(key, next)} onReplaceImage={async () => {
      if (!selection) return; const url = await pickImage();
      if (url) change(key, { ...current.current, [`img:${selection.key}`]: url });
    }} />
    <InlineDestinationPanel selection={selection} editsFor={editsFor} onChange={change} pages={pages} />
    <InlineEditSafetyPanel reports={reports} selection={selection} editsFor={editsFor}
      discard={(scope, path) => change(scope, withoutPath(current.current, path))}
      record={() => { const next = api.current?.record()[key]; if (next) { change(key, next); void saveRef.current(); } }}
      resetAll={() => { change(key, {}); setSelection(null); }} objectName={object.name} />
    <Button size="sm" variant="link" className="mt-4 h-auto whitespace-normal text-left" onClick={() => setConfirm(true)}>Convert to Blocks (Appearance May Change)</Button>
  </>;
  return <div className={embedded ? "h-full min-h-0 bg-background" : "min-h-screen bg-background"}>
    {!embedded && <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
      <Button asChild size="sm" variant="ghost"><Link to="/manage/objects" onClick={async (e) => { e.preventDefault(); if (await saveRef.current()) navigate("/manage/objects"); }}>Objects</Link></Button>
      <h1 className="font-serif text-base">{object.name}</h1>
      <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>{editing ? "Preview" : "Edit"}</Button>
    </header>}
    {!embedded && params.get("returnPage") && <Button size="sm" variant="ghost" onClick={async () => { if (await saveRef.current()) navigate(`/manage/design?page=${params.get("returnPage")}&mode=edit`); }}>Back to Page Editor</Button>}
    <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">Changes Here Apply Everywhere This Object Is Used.</div>
    <div className={embedded ? "h-full min-h-0" : "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]"}>
      <EmbeddedBox chat={embedded ? chat : null}><div ref={canvas} className="min-w-0 overflow-y-auto">
        <InlineEditSurface apiRef={api} edits={{}} objectEdits={{ [key]: edits }} editing={editing} sections={false}
          onReport={setReports} onChange={change} onPickImage={pickImage} onSelect={setSelection}
          selectedKey={selection ? `${selection.scope}|${selection.key}` : null}>
          <Suspense fallback={<div className="h-64 animate-pulse bg-muted" />}><C /></Suspense>
        </InlineEditSurface>
      </div></EmbeddedBox>
      {!embedded && editing && <aside className="overflow-y-auto border-l p-4">{tools}</aside>}
    </div>
    {embedded && slot && createPortal(<div className="p-3">{tools}</div>, slot)}
    <ImagePickerDialog open={!!imageAsk} onOpenChange={(open) => { if (!open) { imageAsk?.(null); setImageAsk(null); } }} onPick={(img) => { imageAsk?.(img.url); setImageAsk(null); }} />
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Convert to Blocks?" destructive={false} confirmLabel="Convert to Blocks"
      description="The converted version can look different from the original. Visitors will keep seeing the original coded version until the object is switched over."
      onConfirm={() => { void saveRef.current().then((ok) => { if (ok) onConvert(); }); }} />
  </div>;
}