import { useState } from "react";
import { Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type InsertType = "object" | "heading" | "text" | "image" | "video";

const items: [InsertType, string][] = [["object", "Object"], ["heading", "Heading"], ["text", "Text"], ["image", "Image"], ["video", "Video"]];

/** Hover strip between sections — shows a + that inserts a new item at that spot. */
export default function InsertGap({ edge, onAdd }: { edge: "top" | "bottom"; onAdd: (t: InsertType) => void }) {
  const [open, setOpen] = useState(false);
  const shown = open ? "opacity-100" : "opacity-0 group-hover/gap:opacity-100";
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`group/gap absolute inset-x-0 z-30 flex h-6 items-center justify-center ${edge === "top" ? "-top-3" : "-bottom-3"}`}
    >
      <div className={`absolute inset-x-3 h-px bg-primary/50 transition-opacity ${shown}`} aria-hidden />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Insert here"
            title="Insert here"
            className={`relative flex h-6 w-6 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted focus-visible:opacity-100 ${shown}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {items.map(([t, label]) => (
            <DropdownMenuItem key={t} onSelect={() => onAdd(t)}>{label}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
