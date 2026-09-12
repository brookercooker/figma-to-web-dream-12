import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toRouteSlug } from "./slug";
import { supabase } from "@/prototype/client";
import { useQueryClient } from "@tanstack/react-query";

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _\-]{0,79}$/;

/**
 * Guided add-object flow. Optionally accepts an `initialName` (used by the
 * "Make a copy" flow) and can auto-navigate to the new object's edit route.
 */
export default function CreateObjectDialog({
  open, onOpenChange, initialName, title = "Add an object",
  submitLabel = "Create object", navigateOnCreate = false, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialName?: string;
  title?: string;
  submitLabel?: string;
  navigateOnCreate?: boolean;
  onCreated?: (row: any) => void;
}) {
  const [name, setName] = useState("");
  const [takenSlugs, setTakenSlugs] = useState<Set<string>>(new Set());
  const [takenNames, setTakenNames] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) { setName(""); return; }
    setName(initialName ?? "");
    (async () => {
      const { data } = await (supabase as any)
        .from("object_registry").select("slug_id,name").is("archived_at", null);
      setTakenSlugs(new Set((data ?? []).map((r: any) => (r.slug_id ?? "").toLowerCase())));
      setTakenNames(new Set((data ?? []).map((r: any) => (r.name ?? "").trim().toLowerCase())));
    })();
  }, [open, initialName]);

  const nameError = useMemo(() => {
    const v = name.trim();
    if (!v) return "";
    if (!NAME_RE.test(v)) return "Use letters, numbers, spaces, hyphens or underscores.";
    return "";
  }, [name]);

  const slug = useMemo(() => toRouteSlug(name), [name]);
  const route = slug ? `/objects/${slug}` : "";
  const dupeSlug = !!slug && takenSlugs.has(slug.toLowerCase());
  const dupeName = !!name.trim() && takenNames.has(name.trim().toLowerCase());
  const valid = !!slug && !nameError && !dupeSlug && !dupeName;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const { data, error } = await (supabase as any).from("object_registry").insert({
        name: name.trim(),
        slug_id: slug,
        status: "Draft",
        component_key: null,
        description: "",
        intended_pages: [],
        labels: [],
      }).select("*").single();
      if (error) throw error;
      toast.success(`Object "${data.name}" created at ${route}`);
      qc.invalidateQueries({ queryKey: ["admin", "object_registry"] });
      onOpenChange(false);
      onCreated?.(data);
      if (navigateOnCreate) navigate(`/objects/${data.slug_id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create object");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Give your object a name and we'll create it as a Draft — you can
            build it out next.
          </p>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Object name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hot Deal Product"
              className={nameError || dupeName ? "border-destructive" : ""} autoFocus />
            {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
            {dupeName && (
              <p className="text-xs text-destructive mt-1">
                An object named "{name.trim()}" already exists. Please choose a different name.
              </p>
            )}
          </div>
          <div className="text-xs">
            <div className="text-muted-foreground mb-1">Object address</div>
            <div className={`font-mono px-2 py-1.5 rounded border ${dupeSlug ? "border-destructive text-destructive" : "bg-muted/40"}`}>
              {route ? `yoursite.com${route}` : <span className="opacity-60">—</span>}
            </div>
            {dupeSlug && <p className="text-xs text-destructive mt-1">An object with this address already exists.</p>}
            {!!name && !slug && <p className="text-xs text-destructive mt-1">Please use at least one letter or number.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!valid || saving}>
              {saving ? "Creating…" : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
