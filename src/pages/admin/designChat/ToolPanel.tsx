import { useState, type ReactNode } from "react";
import { ChevronDown, MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Shared building blocks for the editing tools in the Site Manager's left column. */

export type ToolMenuItem = { label: string; icon?: LucideIcon; onSelect: () => void; destructive?: boolean };

export function ToolHeader({ icon: Icon, title, subtitle, thumbnail, menu }: {
  icon?: LucideIcon; title: string; subtitle?: string; thumbnail?: string; menu?: ToolMenuItem[];
}) {
  return (
    <div className="flex items-center gap-2 pb-3">
      {thumbnail ? <img src={thumbnail} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium leading-tight">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground" title={subtitle}>{subtitle}</p>}
      </div>
      {menu && menu.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label={`${title} options`} title="More">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menu.map((m) => (
              <DropdownMenuItem key={m.label} onSelect={m.onSelect} className={cn("gap-2", m.destructive && "text-destructive focus:text-destructive")}>
                {m.icon && <m.icon className="h-4 w-4" />} {m.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function ToolGroup({ title, icon: Icon, summary, children }: {
  title: string; icon?: LucideIcon; defaultOpen?: boolean; summary?: ReactNode; children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const flip = () => setOpen((o) => !o);
  return (
    <div className="border-t">
      <button type="button" aria-expanded={open} onClick={flip} className="flex w-full items-center gap-2 py-2.5 text-left">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />}
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">{!open && summary}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="space-y-3 pb-4 pt-1">{children}</div>}
    </div>
  );
}

export function ToolRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ToolGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function ToolField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** Segmented control: pass Button children; the active one uses variant "default". */
export function ToolSegment({ children, className, onMouseDown }: {
  children: ReactNode; className?: string; onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        "inline-flex overflow-hidden rounded-md border",
        "[&>button]:h-8 [&>button]:rounded-none [&>button]:border-0 [&>button]:shadow-none [&>button+button]:border-l [&>button+button]:border-solid",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ToolNote({ children }: { children: ReactNode }) {
  return <div className="rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">{children}</div>;
}
