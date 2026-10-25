import { useState } from "react";
import { ClipboardList, CircleHelp, Copy, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDesignChat } from "./DesignChatContext";
import { SubmitButton } from "./PreviewTools";

/** Relay publish.open is authoritative; chat messages are not a pending-change ledger. */
export default function HeaderActions() {
  const { state, editing, previewLocation, workingPage } = useDesignChat();
  const [undoOpen, setUndoOpen] = useState(false);
  const count = state?.publish?.open ?? 0;
  const latestRequest = [...(state?.history ?? [])].reverse().find((entry) => entry.role === "user");
  const undoReason = count === 0 ? "There is no unsubmitted change to undo." : "Undo is not available from the design service yet.";
  const copySummary = async () => {
    const latest = [...(state?.history ?? [])].reverse().find((entry) => entry.role === "user" || entry.role === "assistant");
    const page = previewLocation?.path ?? workingPage?.path ?? "No page selected";
    try {
      await navigator.clipboard.writeText(`Site Manager problem report\nPage: ${page}\nMode: ${editing ? "Manual Edit Mode" : "Chat Mode"}\nLast action: ${latest?.text ?? "No action recorded"}\nWaiting for review: ${count}`);
      toast.success("Problem summary copied. Share it with the site owner.");
    } catch { toast.error("The summary couldn't be copied. Try again."); }
  };
  return <TooltipProvider delayDuration={200}>
    <div className="flex shrink-0 items-center gap-1">
      <Popover>
        <Tooltip><TooltipTrigger asChild><PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0" aria-label={`Review Status${count ? `: ${count} Waiting` : ""}`}>
            <ClipboardList className="h-4 w-4" aria-hidden />
            {count > 0 && <span aria-hidden className="absolute -right-1 -top-1 min-w-4 rounded-full bg-review px-1 text-center text-[10px] leading-4 text-review-foreground">{count > 99 ? "99+" : count}</span>}
          </Button>
        </PopoverTrigger></TooltipTrigger><TooltipContent>Review Status</TooltipContent></Tooltip>
        <PopoverContent align="start" collisionPadding={12} className="w-80 max-w-[calc(100vw-24px)] space-y-3">
          <h2 className="font-sans text-sm font-semibold">Waiting for Review</h2>
          <p className="text-sm text-muted-foreground">{count ? `${count} ${count === 1 ? "change is" : "changes are"} waiting for review. Individual change details aren't available from the design service yet.` : "No changes are waiting for review."}</p>
          {editing ? <p className="text-sm text-muted-foreground">Finish editing before submitting your changes.</p> : <SubmitButton />}
        </PopoverContent>
      </Popover>
      <Tooltip><TooltipTrigger asChild>
        <span tabIndex={count === 0 || !latestRequest ? 0 : undefined} aria-label={count === 0 || !latestRequest ? `Undo Last Change: ${undoReason}` : undefined}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Undo Last Change" disabled={count === 0 || !latestRequest || editing || state?.busy} onClick={() => setUndoOpen(true)}><Undo2 className="h-4 w-4" aria-hidden /></Button>
        </span>
      </TooltipTrigger><TooltipContent className="max-w-64">{editing ? "Single-change undo isn't available in Manual Edit Mode. Discard Changes restores the entire editing session." : undoReason}</TooltipContent></Tooltip>
      <Popover>
        <Tooltip><TooltipTrigger asChild><PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Help"><CircleHelp className="h-4 w-4" aria-hidden /></Button>
        </PopoverTrigger></TooltipTrigger><TooltipContent>Help</TooltipContent></Tooltip>
        <PopoverContent align="start" collisionPadding={12} className="w-80 max-w-[calc(100vw-24px)] space-y-3">
          <h2 className="font-sans text-sm font-semibold">Help</h2>
          <ul className="list-disc space-y-2 pl-4 text-sm">
            <li>In Chat Mode, describe what you want changed. In Manual Edit Mode, change text, pictures and links yourself.</li>
            <li>To add a section, open Manual Edit Mode and choose an Object, Image or Video under Add to This Page.</li>
            <li>Discard Changes restores the page to how it was when you opened the editor.</li>
            <li>Finish Editing saves your hand edits. Submit for Review sends waiting changes for review.</li>
            <li>If something looks wrong, pause and share a problem summary with the site owner before submitting.</li>
          </ul>
          <Button variant="outline" size="sm" onClick={() => void copySummary()}><Copy className="h-4 w-4" aria-hidden />Copy Problem Summary</Button>
        </PopoverContent>
      </Popover>
    </div>
    <AlertDialog open={undoOpen} onOpenChange={setUndoOpen}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Undo Last Change?</AlertDialogTitle><AlertDialogDescription asChild><div className="space-y-2 text-sm text-muted-foreground"><p>Latest request: {latestRequest?.text}</p><p>The design service doesn't identify the last unsubmitted change or provide an undo action yet. Nothing will be undone.</p></div></AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><Button disabled>Undo Change</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </TooltipProvider>;
}