import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDesignChat } from "./DesignChatContext";

/**
 * Which page the person is on. Manual Edit Mode shows the page being edited; Chat Mode shows the picked
 * working page (which can be cleared), or else the page currently open in the preview.
 * Desktop shows it at the top of the left panel above the mode switch; phones keep it in the chat composer.
 */
export default function WorkingPageChip({ className }: { className?: string }) {
  const { workingPage, clearWorkingPage, previewPage, previewLocation, mode } = useDesignChat();
  const manual = mode === "manual";
  const viewing = !workingPage && !manual && previewLocation && !previewLocation.notFound
    ? previewPage ?? { name: previewLocation.path === "/" ? "Home" : previewLocation.path, path: previewLocation.path }
    : null;
  const page = workingPage ?? viewing;
  if (!page) return null;
  const verb = manual ? "Editing " : workingPage ? "Working on " : "Viewing ";
  return (
    <div className={cn("flex items-center gap-2 rounded-md border bg-muted py-1 pl-2.5 pr-1 text-xs", className)} aria-label="Page the chat is working on" data-page-chip={manual ? "editing" : workingPage ? "working" : "viewing"}>
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate py-0.5">
        <span className="text-muted-foreground">{verb}</span>
        <strong>{page.name}</strong>
        <span className="ml-1.5 font-mono text-muted-foreground">{page.path}</span>
      </span>
      {/* Only a picked page can be cleared, and never while editing it. */}
      {workingPage && !manual && (
        <button type="button" aria-label="Stop Working on This Page" title="Stop Working on This Page" onClick={clearWorkingPage}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
