import { Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { objectRegistry } from "@/components/objects/registry";
import { findObjectUsages, type ObjectUsage } from "./objectUsages";
import { regenerateThumbnail } from "./useThumbnailCapture";
import { CopyRefButton, buildObjectRef } from "./copyReference";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ObjectSections, { parseSections } from "@/components/ObjectSections";

/** Renders a single object and refreshes its saved previews. */
export default function ObjectRoute() {
  const { slug } = useParams();
  const [row, setRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [headerUsages, setHeaderUsages] = useState<ObjectUsage[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("object_registry")
        .select("*")
        .eq("slug_id", slug)
        .is("archived_at", null)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) setNotFound(true);
      else setRow(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!row?.component_key) { setHeaderUsages([]); return; }
    let cancelled = false;
    findObjectUsages(row.component_key)
      .then((rows) => { if (!cancelled) setHeaderUsages(rows); })
      .catch(() => { if (!cancelled) setHeaderUsages([]); });
    return () => { cancelled = true; };
  }, [row?.component_key]);

  if (loading) {
    return <div className="min-h-[60vh] bg-muted/10 animate-pulse" aria-hidden />;
  }

  if (notFound || !row) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone mb-2">Object</p>
          <h1 className="font-serif text-2xl text-ink">No object at /objects/{slug}</h1>
        </div>
      </div>
    );
  }

  const entry = row.component_key ? objectRegistry[row.component_key] : undefined;
  const designed = parseSections(row.content);
  const ref = buildObjectRef({
    id: row.slug_id, name: row.name, description: row.description,
  });
  const lastModified = row.updated_at
    ? new Date(row.updated_at).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      })
    : null;

  const openSaveDialog = () => {
    setSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {

      if (row.component_key) {
        regenerateThumbnail({
          kind: "object",
          id: row.id,
          path: `/preview/object/${encodeURIComponent(row.component_key)}`,
          updated_at: row.updated_at,
          thumbnail_url: row.thumbnail_url,
          thumbnail_updated_at: row.thumbnail_updated_at ?? null,
          thumbnail_build_version: row.thumbnail_build_version ?? null,
        }).catch(() => {/* non-fatal */});
      }

      const usages = row.component_key ? await findObjectUsages(row.component_key).catch(() => []) : [];
      for (const u of usages) {
        if (!u.pageId) continue;
        regenerateThumbnail({
          kind: "page",
          id: u.pageId,
          path: u.path,
          updated_at: u.updated_at ?? new Date().toISOString(),
          thumbnail_updated_at: u.thumbnail_updated_at ?? null,
          thumbnail_build_version: u.thumbnail_build_version ?? null,
          thumbnail_url: u.thumbnail_url ?? null,
        }).catch((e) => console.warn("page thumb refresh failed", u.path, e));
      }

      toast.success("Object saved.");
      setSaveOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background text-foreground">
      {/* Metadata bar — object-only info; NOT part of the object itself. */}
      <div
        data-render-exclude="true"
        className="border-b bg-muted/30 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Object</span>
          <span className="font-medium truncate">{row.name}</span>
        </div>
        <div className="text-muted-foreground truncate">
          {headerUsages.length === 0
            ? "Not on any page yet"
            : headerUsages.length === 1
              ? `On ${headerUsages[0].name}`
              : `On ${headerUsages.length} pages`}
        </div>
        {lastModified && (
          <div className="text-muted-foreground">Last Modified {lastModified}</div>
        )}
        <div className="ml-auto">
          <CopyRefButton
            reference={ref}
            label="Copy Reference"
          />
        </div>
      </div>

      {entry ? (
        <Suspense fallback={<div className="min-h-[400px] bg-muted animate-pulse" />}>
          {(() => { const C = entry.component as React.ComponentType; return <C />; })()}
        </Suspense>
      ) : designed.length ? (
        <ObjectSections sections={designed} />
      ) : (
        <div className="min-h-[60vh] bg-cream flex items-center justify-center p-8">
          <div className="max-w-md text-center border-2 border-dashed border-brass/40 bg-brass/5 rounded-md p-8">
            <p className="text-[10px] uppercase tracking-widest text-brass mb-2">Object</p>
            <h1 className="font-serif text-2xl text-ink mb-2">{row.name}</h1>
            {row.description && <p className="text-sm text-stone mb-3">{row.description}</p>}
            <p className="text-xs text-stone">
              This object hasn't been built yet.<br />
              Use the AI chat to describe what you want it to do.
            </p>
          </div>
        </div>
      )}

      {/* Floating Save — opens confirmation dialog. */}
      <button
        type="button"
        onClick={openSaveDialog}
        disabled={saving}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg px-5 py-3 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70"
      >
        <Save className="w-4 h-4" /> Save
      </button>

      <Dialog open={saveOpen} onOpenChange={(o) => { if (!saving) setSaveOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save This Object</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Your changes are saved and available to reference when you
                  chat with Lovable (via <b>Copy Reference</b>).
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>


          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={saving}>
              {saving ? (<><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving…</>) : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
