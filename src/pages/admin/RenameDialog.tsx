import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { normalizeSlug, isValidSlug, isValidName } from "./renameHelpers";

/**
 * Reusable rename dialog for Objects and Landing Pages.
 * Shows a name input and a live-derived URL slug that the user may override.
 */
export function RenameDialog({
  open,
  onOpenChange,
  title,
  description,
  pathPrefix,
  currentName,
  currentSlug,
  onSubmit,
  submitLabel = "Rename",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  pathPrefix: string; // e.g. "/objects/" or "/landing/"
  currentName: string;
  currentSlug: string;
  onSubmit: (name: string, slug: string) => Promise<void>;
  submitLabel?: string;
}) {
  const [name, setName] = useState(currentName);
  const [slug, setSlug] = useState(currentSlug);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setSlug(currentSlug);
      setSlugEdited(false);
      setSaving(false);
    }
  }, [open, currentName, currentSlug]);

  const derivedSlug = useMemo(() => normalizeSlug(name), [name]);
  const effectiveSlug = slugEdited ? slug : derivedSlug;

  const nameOk = isValidName(name);
  const slugOk = isValidSlug(effectiveSlug);
  const unchanged =
    name.trim() === currentName.trim() && effectiveSlug === currentSlug;
  const canSubmit = nameOk && slugOk && !unchanged && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit(name.trim(), effectiveSlug);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Rename failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rename-name">Name</Label>
            <Input
              id="rename-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {!nameOk && name.length > 0 && (
              <p className="text-xs text-destructive">
                Name is empty, too long, or contains invalid characters.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rename-slug">URL</Label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">{pathPrefix}</span>
              <Input
                id="rename-slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(normalizeSlug(e.target.value));
                }}
                className="h-8"
              />
            </div>
            {!slugOk && (
              <p className="text-xs text-destructive">
                Slug must be lowercase letters, numbers, and dashes only.
              </p>
            )}
            {slugOk && effectiveSlug !== currentSlug && (
              <p className="text-xs text-muted-foreground">
                Old links to <span className="font-mono">{pathPrefix}{currentSlug}</span> will keep working via redirect.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving…</>) : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
