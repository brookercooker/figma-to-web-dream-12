import { useState, type ReactNode } from "react";
import { Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** One label list, with the same counts and actions at every content width. */
export default function LibraryLabels({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="nova-library-labels shrink-0">
    <Button type="button" variant="outline" size="sm" className="nova-library-label-button gap-1.5" onClick={() => setOpen(true)}><Tags className="h-4 w-4" />Labels</Button>
    <div className="nova-library-label-list">{children}</div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Labels</DialogTitle></DialogHeader>
        <div className="nova-library-label-dialog">{children}</div>
      </DialogContent>
    </Dialog>
  </div>;
}