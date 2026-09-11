import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, X, Tag, Palette, ChevronRight, Check } from "lucide-react";
import {
  useLabelsForScope,
  registerLabelPath,
  setLabelColorById,
  useInvalidateLabels,
  type LabelScope,
  type LabelRow,
} from "./useAllLabels";
import { colorFor, pickLeastUsedColor } from "./labelColors";
import ColorSwatchPicker from "./ColorSwatchPicker";
import { LABEL_SEP, MAX_DEPTH, leafOf, parentPath, validateLeafName, joinPath } from "./labelPath";

interface Props {
  scope: LabelScope;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  triggerLabel?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Label picker scoped to a single tool. Supports nested label paths — the
 * search box accepts a plain leaf name (creates under the picked parent)
 * or a "parent/child" path (creates the whole chain if needed).
 */
export default function LabelPicker({
  scope, value, onChange,
  placeholder = "Search labels…",
  triggerLabel = "Add label", className = "", compact = false,
}: Props) {
  const { data: allLabels = [] } = useLabelsForScope(scope);
  const invalidate = useInvalidateLabels(scope);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pendingColor, setPendingColor] = useState<number | null>(null);
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const byPath = useMemo(() => {
    const m = new Map<string, LabelRow>();
    for (const l of allLabels) m.set(l.path, l);
    return m;
  }, [allLabels]);

  const term = q.trim().toLowerCase();
  // Selected labels stay in the list (with a check) so the picker reads like a
  // checklist instead of making chosen labels disappear.
  const matches = allLabels
    .filter((l) => (term ? l.path.toLowerCase().includes(term) : true))
    .sort((a, b) => Number(value.includes(b.path)) - Number(value.includes(a.path)))
    .slice(0, 80);
  const exactMatch = term && allLabels.some((l) => l.path.toLowerCase() === term);

  const add = (path: string) => {
    if (!path || value.includes(path)) { setQ(""); return; }
    onChange([...value, path]);
    setQ("");
  };

  const toggle = (path: string) => {
    if (value.includes(path)) onChange(value.filter((x) => x !== path));
    else onChange([...value, path]);
    setQ("");
  };

  const createNew = async () => {
    setCreateError(null);
    if (!term) return;
    const parent = pendingParentId ? allLabels.find((r) => r.id === pendingParentId) ?? null : null;
    // Determine full path
    let newPath: string;
    if (term.includes(LABEL_SEP)) {
      // User typed a full path — ignore parent selection.
      const segs = term.split(LABEL_SEP).map((s) => s.trim()).filter(Boolean);
      for (const s of segs) {
        const err = validateLeafName(s);
        if (err) { setCreateError(err); return; }
      }
      if (segs.length > MAX_DEPTH) { setCreateError(`Max nesting depth is ${MAX_DEPTH}.`); return; }
      newPath = joinPath(segs);
    } else {
      const err = validateLeafName(term);
      if (err) { setCreateError(err); return; }
      newPath = parent ? parent.path + LABEL_SEP + term : term;
      if (parent && parent.depth + 1 > MAX_DEPTH - 1) {
        setCreateError(`Max nesting depth is ${MAX_DEPTH}.`); return;
      }
    }
    const color = pendingColor ?? pickLeastUsedColor(allLabels.map((l) => l.color_index));
    try {
      await registerLabelPath(newPath, scope, color);
    } catch (e: any) {
      setCreateError(e?.message ?? "Could not create label.");
      return;
    }
    invalidate();
    add(newPath);
    setPendingColor(null);
    setPendingParentId(null);
  };

  const changeColor = async (row: LabelRow, idx: number) => {
    await setLabelColorById(row.id, idx);
    invalidate();
  };

  return (
    <div className={`min-w-0 max-w-full ${className}`}>
      <div className="flex flex-wrap gap-1 mb-1 min-w-0 max-w-full">
        {value.map((path) => {
          const row = byPath.get(path);
          const c = colorFor(path, row?.color_index ?? null);
          const label = row ? row.path.split(LABEL_SEP).join(" › ") : path;
          return (
            <Popover key={path}>
              <span
                className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 border min-w-0 max-w-full"
                style={{ background: c.bg, borderColor: c.border, color: c.text }}
              >
                <PopoverTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-1 min-w-0 focus:outline-none" title={`Change color — ${c.name}`}>
                    <Tag className="w-3.5 h-3.5" style={{ color: c.iconStroke, fill: c.iconFill }} />
                    <span className="truncate">{label}</span>
                  </button>
                </PopoverTrigger>
                <button type="button" onClick={() => onChange(value.filter((x) => x !== path))}
                  className="hover:text-destructive shrink-0" aria-label={`Remove ${label}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
              <PopoverContent align="start" className="w-auto p-2" collisionPadding={16}>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Color for &ldquo;{label}&rdquo;</div>
                {row && (
                  <ColorSwatchPicker
                    value={(row.color_index ?? c.idx) as number}
                    onChange={(idx) => changeColor(row, idx)}
                  />
                )}
              </PopoverContent>
            </Popover>
          );
        })}
        {value.length === 0 && !compact && (
          <span className="text-xs text-muted-foreground">No labels applied</span>
        )}
      </div>

      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPendingColor(null); setPendingParentId(null); setCreateError(null); } }}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={value.length > 0 ? "secondary" : "outline"}
            size="sm"
            className={compact ? "h-8 min-w-8 px-1.5 gap-1" : "gap-1.5"}
            title={triggerLabel}
            aria-label={triggerLabel}
          >
            <Tag className="w-3.5 h-3.5" />
            {!compact && triggerLabel}
            {value.length > 0 && (
              <span className="text-[10px] font-medium rounded-full bg-primary text-primary-foreground px-1.5 leading-4">
                {value.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,340px)] p-0" align="start" collisionPadding={16}>
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
            <div className="text-xs font-medium">
              Labels
              <span className="text-muted-foreground font-normal">
                {value.length > 0 ? ` · ${value.length} selected` : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {value.length > 0 && (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs"
                  onClick={() => onChange([])}>
                  Clear
                </Button>
              )}
              <Button type="button" size="sm" className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setOpen(false)} aria-label="Done — close label picker">
                <Check className="w-3.5 h-3.5" /> Done
              </Button>
            </div>
          </div>
          <Command shouldFilter={false}>
            <CommandInput placeholder={placeholder} value={q} onValueChange={setQ} />
            <CommandList>
              {matches.length === 0 && !term && (
                <CommandEmpty>Start typing to search…</CommandEmpty>
              )}
              {matches.length === 0 && term && !exactMatch && (
                <CommandEmpty>No matching labels.</CommandEmpty>
              )}
              {matches.length > 0 && (
                <CommandGroup heading="Tap to select · picker stays open">
                  {matches.map((l) => {
                    const c = colorFor(l.path, l.color_index);
                    const segs = l.path.split(LABEL_SEP);
                    const selected = value.includes(l.path);
                    return (
                      <CommandItem
                        key={l.id}
                        value={l.path}
                        onSelect={() => toggle(l.path)}
                        aria-selected={selected}
                        className={`min-h-11 ${selected ? "font-medium" : ""}`}
                      >
                        <span
                          className={`w-4 h-4 mr-2 shrink-0 rounded border flex items-center justify-center ${selected ? "" : "border-muted-foreground/40"}`}
                          style={selected ? { background: c.border, borderColor: c.border } : undefined}
                          aria-hidden
                        >
                          {selected && <Check className="w-3 h-3 text-background" />}
                        </span>
                        <Tag className="w-3.5 h-3.5 mr-2 shrink-0" style={{ color: c.iconStroke, fill: c.iconFill }} />
                        <span className="truncate">
                          {segs.map((s, i) => (
                            <span key={i}>
                              {i > 0 && <ChevronRight className="inline w-3 h-3 mx-0.5 text-muted-foreground align-[-2px]" />}
                              <span className={i === segs.length - 1 ? "" : "text-muted-foreground"}>{s}</span>
                            </span>
                          ))}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {term && !exactMatch && (
                <CommandGroup heading="Create">
                  <div className="px-2 pb-2 space-y-2">
                    {!term.includes(LABEL_SEP) && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Nest Label Under:</div>
                        <select
                          value={pendingParentId ?? ""}
                          onChange={(e) => setPendingParentId(e.target.value || null)}
                          className="w-full h-7 border rounded px-1 text-xs bg-background"
                        >
                          <option value="">— Top level —</option>
                          {allLabels.filter((l) => l.depth < MAX_DEPTH - 1).map((l) => (
                            <option key={l.id} value={l.id}>{l.path.split(LABEL_SEP).join(" › ")}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Color (auto if unset)
                      </div>
                      <ColorSwatchPicker
                        value={pendingColor ?? pickLeastUsedColor(allLabels.map((l) => l.color_index))}
                        onChange={setPendingColor}
                      />
                    </div>
                    {createError && <div className="text-[11px] text-destructive">{createError}</div>}
                  </div>
                  <CommandItem value={`__create__${term}`} onSelect={createNew}>
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Create &ldquo;{term.includes(LABEL_SEP) ? term.split(LABEL_SEP).join(" › ") : term}&rdquo;
                  </CommandItem>
                </CommandGroup>
              )}
              {term && exactMatch && (
                <CommandGroup heading="Already exists">
                  <CommandItem
                    value={`__exists__${term}`}
                    onSelect={() => add(term)}
                  >
                    <Tag className="w-3.5 h-3.5 mr-2 opacity-60" />
                    Apply &ldquo;{term}&rdquo;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
