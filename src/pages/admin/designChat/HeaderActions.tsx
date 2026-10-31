import { ClipboardList, CircleHelp, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDesignChat } from "./DesignChatContext";

/** Relay publish.open is authoritative; chat messages are not a pending-change ledger. */
export default function HeaderActions({ onExpand }: { onExpand?: () => void }) {
  const { state, editing, previewLocation, workingPage, reviewOpen, setReviewOpen } = useDesignChat();
  const count = state?.publish?.open ?? 0;
  const copySummary = async () => {
    const latest = [...(state?.history ?? [])].reverse().find((entry) => entry.role === "user" || entry.role === "assistant");
    const page = previewLocation?.path ?? workingPage?.path ?? "No page selected";
    try {
      await navigator.clipboard.writeText(`Site Manager problem report\nPage: ${page}\nMode: ${editing ? "Manual Edit Mode" : "Chat Mode"}\nLast action: ${latest?.text ?? "No action recorded"}\nWaiting for review: ${count}`);
      toast.success("Problem summary copied. Share it with the site owner.");
    } catch { toast.error("The summary couldn't be copied. Try again."); }
  };
  return <TooltipProvider delayDuration={200}>
    <div className="flex max-w-full shrink-0 flex-wrap items-center justify-center gap-1">
      <Tooltip><TooltipTrigger asChild>
        <span tabIndex={editing ? 0 : undefined}>
          <Button variant={reviewOpen ? "secondary" : "ghost"} size="icon" className="relative h-8 w-8 shrink-0" aria-label={`Review Status${count ? `: ${count} Waiting` : ""}`} aria-pressed={reviewOpen} disabled={editing} onClick={() => { onExpand?.(); setReviewOpen(!reviewOpen); }}>
            <ClipboardList className="h-4 w-4" aria-hidden />
            {count > 0 && <span aria-hidden className="absolute -right-1 -top-1 min-w-4 rounded-full bg-review px-1 text-center text-[10px] leading-4 text-review-foreground">{count > 99 ? "99+" : count}</span>}
          </Button>
        </span>
      </TooltipTrigger><TooltipContent>{editing ? "Finish editing before reviewing your changes." : reviewOpen ? "Back to Chat" : "Review Status"}</TooltipContent></Tooltip>
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
            <li>Save Changes (top right) saves your hand edits and returns to Chat Mode. The Review Status button lists the changes waiting for review.</li>
            <li>If something looks wrong, pause and share a problem summary with the site owner before submitting.</li>
          </ul>
          <Button variant="outline" size="sm" onClick={() => void copySummary()}><Copy className="h-4 w-4" aria-hidden />Copy Problem Summary</Button>
        </PopoverContent>
      </Popover>
    </div>
  </TooltipProvider>;
}