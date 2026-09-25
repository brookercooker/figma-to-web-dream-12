import { Suspense, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/prototype/client";
import InlineEditSurface, { type InlineEdits, type InlineSelection } from "@/components/InlineEditSurface";
import { objectRegistry } from "@/components/objects/registry";
import InlineStylePanel from "./InlineStylePanel";
import ImagePickerDialog from "./ImagePickerDialog";
import SiteManagerLogo from "./SiteManagerLogo";

/**
 * Edits one shared object in place, rendered from its real code so it looks
 * exactly like it does on the page. Opened from a page section's
 * "Open in object editor" button; `section` limits the view to that part.
 */
export default function ObjectInPlaceEditor() {
  const [params] = useSearchParams();
  const id = params.get("object") ?? "";
  const returnPage = params.get("returnPage");
  const section = params.get("section") ?? "";
  const [row, setRow] = useState<{ name: string; component_key: string } | null>(null);
  const [edits, setEdits] = useState<InlineEdits>({});
  const [sel, setSel] = useState<InlineSelection | null>(null);
  const [imgAsk, setImgAsk] = useState<((url: string | null) => void) | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    (supabase as any).from("object_registry").select("name,component_key,inline_edits").eq("id", id).maybeSingle()
      .then(({ data }: any) => {
        if (!data) return;
        setRow(data);
        setEdits(data.inline_edits ?? {});
      });
  }, [id]);

  const key = row?.component_key ?? "";
  const change = (next: InlineEdits) => {
    setEdits(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      (supabase as any).from("object_registry").update({ inline_edits: next, updated_at: new Date().toISOString() }).eq("id", id);
    }, 800);
  };
  const pickImage = () => new Promise<string | null>((resolve) => setImgAsk(() => resolve));
  const Comp = key ? objectRegistry[key]?.component : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur">
        <div className="w-full px-6 py-3 flex items-center gap-4">
          <h1 className="whitespace-nowrap"><SiteManagerLogo /></h1>
          <div aria-hidden className="h-9 w-px bg-border shrink-0" />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={returnPage ? `/manage/design?page=${returnPage}&mode=edit` : "/manage/objects"}>
              <ArrowLeft className="w-4 h-4" /> {returnPage ? "Back to page editor" : "Back to objects"}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/manage/objects/design?object=${id}${returnPage ? `&returnPage=${returnPage}` : ""}`}>Open full object editor</Link>
          </Button>
        </div>
      </header>
      <main className="w-full px-6 py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-serif text-2xl">{row?.name ?? "Object"}</p>
            <p className="text-sm text-muted-foreground">Changes apply everywhere this object is used.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setSel(null); change({}); }}>
            <RotateCcw className="w-4 h-4" /> Undo all changes
          </Button>
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <div className="flex-1 min-w-0 bg-background">
            {!Comp ? (
              <div className="p-10 text-sm text-muted-foreground">{row ? "This object can't be edited in place." : "Loading…"}</div>
            ) : (
              <Suspense fallback={<div className="h-64 animate-pulse bg-muted" />}>
                <InlineEditSurface
                  edits={{}}
                  objectEdits={{ [key]: edits }}
                  editing
                  sections={false}
                  isolate={section}
                  onChange={(scope, next) => { if (scope !== "page") change(next); }}
                  onPickImage={pickImage}
                  onSelect={setSel}
                  selectedKey={sel ? `${sel.scope}|${sel.key}` : null}
                >
                  <Comp />
                </InlineEditSurface>
              </Suspense>
            )}
          </div>
          <aside className="w-72 shrink-0 border-l p-4">
            {sel && sel.scope !== "page" ? (
              <InlineStylePanel
                sel={sel}
                edits={edits}
                onChange={change}
                onReplaceImage={async () => {
                  const url = await pickImage();
                  if (url) change({ ...edits, [`img:${sel.key}`]: url });
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Click wording, a picture or a line to change it.</p>
            )}
          </aside>
        </div>
      </main>
      <ImagePickerDialog
        open={!!imgAsk}
        onOpenChange={(v) => { if (!v && imgAsk) { imgAsk(null); setImgAsk(null); } }}
        onPick={({ url }) => { imgAsk?.(url); setImgAsk(null); }}
      />
    </div>
  );
}
