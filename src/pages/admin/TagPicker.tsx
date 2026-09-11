import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, X } from "lucide-react";

interface Props {
  all: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function TagPicker({ all, selected, onChange, placeholder = "Filter by tags", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = all.filter((t) => t.toLowerCase().includes(q.toLowerCase()));
  const toggle = (t: string) => onChange(selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 min-w-[180px] border rounded px-2 text-sm flex items-center gap-1 justify-between bg-background"
      >
        <span className="truncate text-left flex-1">
          {selected.length === 0 ? <span className="text-muted-foreground">{placeholder}</span> : `${selected.length} tag${selected.length === 1 ? "" : "s"}`}
        </span>
        {selected.length > 0 && (
          <span onClick={(e) => { e.stopPropagation(); onChange([]); }} className="hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-64 bg-background border rounded shadow-lg">
          <div className="p-2 border-b">
            <Input autoFocus placeholder="Search tags…" aria-label="Search tags" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 text-xs" />
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-b flex flex-wrap gap-1">
              {selected.map((t) => (
                <span key={t} className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded flex items-center gap-1">
                  {t}<button onClick={() => toggle(t)}>×</button>
                </span>
              ))}
            </div>
          )}
          <div className="max-h-56 overflow-auto">
            {filtered.length === 0 && <div className="text-xs text-muted-foreground p-2">No tags</div>}
            {filtered.map((t) => {
              const on = selected.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggle(t)}
                  className={`w-full text-left text-xs px-2 py-1 flex items-center gap-2 hover:bg-muted ${on ? "bg-muted/50" : ""}`}>
                  <input type="checkbox" readOnly checked={on} className="pointer-events-none" />
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
