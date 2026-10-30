import { Suspense, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/prototype/client";
import { objectRegistry } from "@/components/objects/registry";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type ObjectRegistryRow,
} from "./useObjectRegistry";
import { CopyRefButton, buildObjectRef } from "./copyReference";
import ObjectSections, { parseSections } from "@/components/ObjectSections";
import { regenerateThumbnail } from "./useThumbnailCapture";
import { notifyContentEdited } from "./designChat/contentSync";

/**
 * Full-page workspace for a single object.
 *
 * Purpose: give the user a distraction-free full-size canvas to iterate on
 * one Object with Lovable. "Save" kicks off a thumbnail/preview capture so the row shows in the list.
 */
export default function ObjectWorkspace() {
  const { slugId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const { data: obj, isLoading } = useQuery({
    queryKey: ["admin", "object_registry", "one", slugId],
    queryFn: async (): Promise<ObjectRegistryRow | null> => {
      if (!slugId) return null;
      const { data, error } = await (supabase as any)
        .from("object_registry")
        .select("*")
        .eq("slug_id", slugId)
        .maybeSingle();
      if (error) throw error;
      return data as ObjectRegistryRow | null;
    },
    enabled: !!slugId,
  });

  const entry = useMemo(
    () => (obj?.component_key ? objectRegistry[obj.component_key] : undefined),
    [obj?.component_key],
  );

  if (isLoading) {
    return <div className="min-h-screen bg-muted/20 animate-pulse" />;
  }

  if (!obj) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg">Object not found.</p>
        <Button asChild variant="outline">
          <Link to="/manage/objects">Back to Objects</Link>
        </Button>
      </div>
    );
  }

  const ref = buildObjectRef({
    id: obj.slug_id,
    name: obj.name,
    description: obj.description,
  });

  const openSaveDialog = () => {
    setSaveOpen(true);
  };

  const onConfirmSave = async () => {
    setSaving(true);
    try {
      notifyContentEdited();
      toast.success(`Saved "${obj.name}"`);
      // Fire off thumbnail regeneration only when a component exists; don't block.
      if (obj.component_key) {
        regenerateThumbnail({
          kind: "object",
          id: obj.id,
          path: `/preview/object/${encodeURIComponent(obj.component_key)}`,
          updated_at: new Date().toISOString(),
          thumbnail_url: obj.thumbnail_url,
          thumbnail_updated_at: obj.thumbnail_updated_at,
          thumbnail_build_version: obj.thumbnail_build_version,
        })
          .then(() =>
            qc.invalidateQueries({ queryKey: ["admin", "object_registry"] }),
          )
          .catch(() => {/* silent — auto-capture will retry */});
      }
      setSaveOpen(false);
      navigate("/manage/objects");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/manage/objects">
              <ArrowLeft className="w-4 h-4" /> Objects
            </Link>
          </Button>

          <div className="flex flex-col min-w-0">
            <span className="font-serif text-base truncate">{obj.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              id: {obj.slug_id}
            </span>
          </div>


          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to={`/manage/objects/design?object=${obj.id}`}>Design</Link>
            </Button>
            <CopyRefButton reference={ref} label="Copy Reference" />
            <Button
              size="sm"
              className="gap-1.5"
              onClick={openSaveDialog}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              Save…
            </Button>
          </div>
        </div>
        {!obj.component_key && (
          <div className="flex items-start gap-2 border-t bg-brass/5 px-4 py-2 text-xs text-brass">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              This object doesn&apos;t have a component yet. Click{" "}
              <b>Copy Reference</b>, paste it into a Lovable chat, and ask
              Lovable to build the component. When you&apos;re happy with it,
              come back here and hit <b>Save</b>.
            </p>
          </div>
        )}
      </header>

      <main className="flex-1">
        {entry ? (
          <div className="w-full">
            <Suspense
              fallback={<div className="h-[600px] bg-muted animate-pulse" />}
            >
              {(() => {
                const C = entry.component as React.ComponentType;
                return <C />;
              })()}
            </Suspense>
          </div>
        ) : parseSections((obj as any).content).length ? (
          <ObjectSections sections={parseSections((obj as any).content)} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-16 space-y-6">
            <div className="rounded-lg border-2 border-dashed border-brass/40 bg-brass/5 p-10 text-center">
              <p className="font-serif text-2xl text-ink mb-2">
                {obj.name}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                No component built yet.
              </p>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Copy this object&apos;s reference and paste it into a Lovable
                chat to have the component built. Once built, it will render in
                this workspace and you can Save it to publish a thumbnail.
              </p>
            </div>
            {obj.description && (
              <div className="rounded border bg-muted/20 p-4 text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p>{obj.description}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save This Object</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Saving stores this object so you can reference it when
                  chatting with Lovable (via <b>Copy Reference</b>).
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>


          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={onConfirmSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
