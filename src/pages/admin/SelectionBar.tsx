import { ReactNode } from "react";
import { X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  count: number;
  itemLabel?: string; // e.g. "page", "image", "link"
  onClear: () => void;
  children?: ReactNode; // action buttons
  hint?: ReactNode;
};

/**
 * Consistent selection action bar used across Site Manager tabs
 * (Pages, Images, Link Audit, etc.). Renders inline; sticks to the
 * top of its scroll container so actions remain reachable.
 */
export default function SelectionBar({ count, itemLabel = "item", onClear, children, hint }: Props) {
  if (count <= 0) return null;
  const plural = count === 1 ? itemLabel : `${itemLabel}s`;
  return (
    <div className="sticky top-14 z-20 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 backdrop-blur px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2 pr-3 border-r border-primary/20">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium tabular-nums">
          {count} <span className="text-muted-foreground font-normal">{plural} selected</span>
        </span>
      </div>
      {hint && <span className="text-xs text-muted-foreground hidden md:inline">{hint}</span>}
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="ml-auto h-8 text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5 mr-1" /> Clear
      </Button>
    </div>
  );
}
