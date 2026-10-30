import { Copy, PencilRuler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { otherPagesUsing, siteWideLabel, type ObjectClick, type ObjectClickKind } from "./objectClick";

export interface ObjectAsk extends ObjectClick { kind: ObjectClickKind; usedOn: string[] | null }

/** Asks before a shared object clicked on the page is edited: open the shared object, or make a page-only copy. */
export default function ObjectClickDialog({ ask, pageName, busy, onOpen, onCopy, onCancel }: {
  ask: ObjectAsk | null; pageName: string; busy: boolean;
  onOpen: () => void; onCopy: () => void; onCancel: () => void;
}) {
  const label = ask ? siteWideLabel(ask.componentKey) : "Header";
  const title = !ask ? "" : ask.kind === "site" ? `Edit the Site ${label}?` : `Edit ${ask.name}?`;
  const others = ask ? otherPagesUsing(ask.usedOn, pageName) : [];
  const elsewhere = others === null ? "other pages" : others.join(", ");
  return (
    <Dialog open={!!ask} onOpenChange={(open) => { if (!open && !busy) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {ask?.kind === "site" && `The ${label.toLowerCase()} appears on every page. Changes made in the object editor change it across the whole site.`}
            {ask?.kind === "shared" && `${ask.name} is also used on ${elsewhere}. Edit it everywhere, or make a copy just for ${pageName}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start sm:space-x-0">
          <Button className="gap-2" disabled={busy} onClick={onOpen}><PencilRuler className="h-4 w-4" aria-hidden />Edit Object</Button>
          {ask?.kind === "shared" && <Button variant="outline" className="gap-2" disabled={busy} onClick={onCopy}><Copy className="h-4 w-4" aria-hidden />{busy ? "Copying…" : "Make a Copy for This Page"}</Button>}
          <Button variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
