import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Copy, PencilRuler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { otherPagesUsing, siteWideLabel, type ObjectClick, type ObjectClickKind } from "./objectClick";

export interface ObjectAsk extends ObjectClick { kind: ObjectClickKind; usedOn: string[] | null }

/**
 * Every object clicked on the page goes through two steps, so it's clear objects are edited separately:
 * 1. "Shared Object": it's edited in the object editor, not on this page → Open in Object Editor.
 * 2. The warning: where its changes will show up (whole site, other pages, or only this page), then open it,
 *    or for objects used elsewhere, make a page-only copy instead.
 */
export default function ObjectClickDialog({ ask, pageName, busy, onOpen, onCopy, onCancel }: {
  ask: ObjectAsk | null; pageName: string; busy: boolean;
  onOpen: () => void; onCopy: () => void; onCancel: () => void;
}) {
  const [step, setStep] = useState<"intro" | "warn">("intro");
  // A new click always starts at the first step.
  useEffect(() => { setStep("intro"); }, [ask?.slot, ask?.objectId, ask?.kind]);
  const label = ask ? siteWideLabel(ask.componentKey) : "Header";
  const site = ask?.kind === "site";
  const others = ask ? (ask.kind === "copy" ? [] : otherPagesUsing(ask.usedOn, pageName)) : [];
  const sharedElsewhere = !site && others !== null && others.length > 0;
  const mayBeShared = !site && others === null;
  const name = ask?.name ?? "";

  const introTitle = site ? `Site ${label}` : ask?.kind === "copy" || (!sharedElsewhere && !mayBeShared) ? "Object" : "Shared Object";
  const introText = site
    ? `The ${label.toLowerCase()} is shared by every page. It's edited separately in the object editor, not here on the page.`
    : `${name} is an object, so it's edited separately in the object editor, not here on the page.`;
  const warnTitle = site ? `Before You Open the Site ${label}` : `Before You Open ${name}`;
  const warning = site
    ? `Changes you make in the object editor change the ${label.toLowerCase()} on every page of the site.`
    : sharedElsewhere
      ? `${name} is also used on ${others!.join(", ")}. Changes you make in the object editor will show up on those pages too. To change it only on ${pageName}, make a copy instead.`
      : mayBeShared
        ? `${name} may also be used on other pages. Changes you make in the object editor will show up everywhere it's used. To change it only on ${pageName}, make a copy instead.`
        : `${name} is only used on ${pageName}, so changes you make in the object editor only affect this page.`;
  const canCopy = ask?.kind === "shared" && (sharedElsewhere || mayBeShared);
  const openLabel = sharedElsewhere || mayBeShared || site ? "Open and Edit Everywhere" : "Open Object Editor";

  return (
    <Dialog open={!!ask} onOpenChange={(open) => { if (!open && !busy) onCancel(); }}>
      <DialogContent data-object-dialog={step}>
        {step === "intro" ? <>
          <DialogHeader>
            <DialogTitle>{introTitle}</DialogTitle>
            {!site && <p className="text-sm font-medium">{name}</p>}
            <DialogDescription>{introText}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start sm:space-x-0">
            <Button className="gap-2" onClick={() => setStep("warn")}><PencilRuler className="h-4 w-4" aria-hidden />Open in Object Editor</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </DialogFooter>
        </> : <>
          <DialogHeader>
            <DialogTitle>{warnTitle}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p role="alert" data-object-warning className="flex gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <span>{warning}</span>
                </p>
                <p className="text-xs">If you have unsaved edits on this page, you'll be asked to save them first.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start sm:space-x-0">
            <Button className="gap-2" disabled={busy} onClick={onOpen}><PencilRuler className="h-4 w-4" aria-hidden />{openLabel}</Button>
            {canCopy && <Button variant="outline" className="gap-2" disabled={busy} onClick={onCopy}><Copy className="h-4 w-4" aria-hidden />{busy ? "Copying…" : "Make a Copy for This Page"}</Button>}
            <Button variant="ghost" className="gap-1" disabled={busy} onClick={() => setStep("intro")}><ArrowLeft className="h-4 w-4" aria-hidden />Back</Button>
            <Button variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button>
          </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>
  );
}
