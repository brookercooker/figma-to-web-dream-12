import { Suspense, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/prototype/client";
import { objectRegistry } from "@/components/objects/registry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useSetObjectStatus,
  type ObjectRegistryRow,
} from "./useObjectRegistry";
import { CopyRefButton, buildObjectRef } from "./copyReference";
import ObjectSections, { parseSections } from "@/components/ObjectSections";
import { regenerateThumbnail } from "./useThumbnailCapture";

/**
 * Full-page workspace for a single object.
 *
 * Purpose: give the user a distraction-free full-size canvas to iterate on
 * one Object with Lovable. When it's finished, "Save" flips status to Built
 * and kicks off a thumbnail/preview capture so the row shows in the list.
 */
export default function ObjectWorkspace() {
  const { slugId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const setStatus = useSetObjectStatus();
  const [saveOpen, setSaveOpen] = useState(false);
  const [chosenStatus, setChosenStatus] = useState<"Draft" | "Ready">("Draft");

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

  const isReady = obj.status === "Ready";
  const statusLabel = isReady ? "Ready" : "Draft";
  const ref = buildObjectRef({
    id: obj.slug_id,
    name: obj.name,
    status: obj.status,
    description: obj.description,
  });

  const openSaveDialog = () => {
    setChosenStatus((obj.status as "Draft" | "Ready") ?? "Draft");
    setSaveOpen(true);
  };

  const onConfirmSave = async () => {
    try {
      if (chosenStatus !== obj.status) {
        await setStatus.mutateAsync({ id: obj.id, status: chosenStatus });
      }
      toast.success(`Saved "${obj.name}" as ${chosenStatus}`);
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
    }
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

          <Badge
            variant={isReady ? "default" : "secondary"}
            className={
              isReady
                ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 hover:bg-emerald-500/15"
                : "bg-amber-400/20 text-amber-800 border border-amber-500/40 hover:bg-amber-400/20"
            }
          >
            {statusLabel}
          </Badge>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to={`/manage/objects/design?object=${obj.id}`}>Design</Link>
            </Button>
            <CopyRefButton reference={ref} label="Copy Reference" />
            <Button
              size="sm"
              className="gap-1.5"
              onClick={openSaveDialog}
              disabled={setStatus.isPending}
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
                Draft object — no component built yet.
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
            <DialogTitle>Save this object</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Saving stores this object so you can reference it when
                  chatting with Lovable (via <b>Copy Reference</b>).
                </p>
                <p>
                  This does <b>not</b> publish it to your live site. To publish
                  changes to the live site, click the <b>Publish</b> button
                  inside Lovable.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium">Work status</p>
            <p className="text-xs text-muted-foreground">
              This is just your work-tracking marker for whether the object is
              finished being built. It is independent of publishing — Draft vs
              Ready is not the same as live vs not-live.
            </p>
            <RadioGroup
              value={chosenStatus}
              onValueChange={(v) => setChosenStatus(v as "Draft" | "Ready")}
              className="gap-2"
            >
              <label
                htmlFor="status-ready"
                className="flex items-start gap-3 rounded border p-3 cursor-pointer hover:bg-muted/40"
              >
                <RadioGroupItem value="Ready" id="status-ready" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Mark as Ready</div>
                  <div className="text-xs text-muted-foreground">
                    Complete — safe to reference.
                  </div>
                </div>
              </label>
              <label
                htmlFor="status-draft"
                className="flex items-start gap-3 rounded border p-3 cursor-pointer hover:bg-muted/40"
              >
                <RadioGroupItem value="Draft" id="status-draft" className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Keep as Draft</div>
                  <div className="text-xs text-muted-foreground">
                    Still being built.
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveOpen(false)}
              disabled={setStatus.isPending}
            >
              Cancel
            </Button>
            <Button onClick={onConfirmSave} disabled={setStatus.isPending}>
              {setStatus.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
