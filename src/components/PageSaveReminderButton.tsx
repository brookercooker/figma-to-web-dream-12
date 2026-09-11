import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Floating "Save" button shown on rendered static and landing pages.
 *
 * Mirrors the Save affordance on the Object workspace, but pages have no
 * server-side row to flip — the real persistence step for page content is
 * a Lovable Publish. Clicking opens a dialog reminding the admin of that.
 *
 * Hidden on admin surfaces, object routes, previews, and the Coming Soon
 * shell. The public landing subdomain uses `PublicLandingApp`, so this
 * component is never mounted there.
 */
export default function PageSaveReminderButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const path = location.pathname;
  const hidden =
    path === "/" ||
    path.startsWith("/manage") ||
    path.startsWith("/admin") ||
    path.startsWith("/objects/") ||
    path.startsWith("/preview/") ||
    path === "/coming-soon";
  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 text-white shadow-lg px-5 py-3 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70"
      >
        <Save className="w-4 h-4" /> Save
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this page</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-ink/80 space-y-2">
            <p>
              To save this page <b>permanently</b>, click{" "}
              <b>Publish</b> in Lovable. Publishing snapshots the current code
              and makes it the live version on your published URL.
            </p>
            <p className="text-xs text-stone">
              Until you publish, any changes exist only in the current preview
              and can be lost.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
