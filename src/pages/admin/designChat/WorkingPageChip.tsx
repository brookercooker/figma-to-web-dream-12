import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesignChat } from "./DesignChatContext";

/** The page the chat is pointed at. Desktop shows it above the mode switch; phones keep it in the chat composer. */
export default function WorkingPageChip({ className }: { className?: string }) {
  const { workingPage, clearWorkingPage } = useDesignChat();
  if (!workingPage) return null;
  return (
    <div className={cn("flex items-center gap-2 rounded-md border bg-muted py-1 pl-2.5 pr-1 text-xs", className)} aria-label="Page the chat is working on">
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        <span className="text-muted-foreground">Working on </span>
        <strong>{workingPage.name}</strong>
        <span className="ml-1.5 font-mono text-muted-foreground">{workingPage.path}</span>
      </span>
      <button type="button" aria-label="Stop Working on This Page" title="Stop Working on This Page" onClick={clearWorkingPage}
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
