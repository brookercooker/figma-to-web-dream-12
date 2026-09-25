import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from "lucide-react";
import { pathOf, readStyle, styleKey, type InlineEdits } from "@/components/InlineEditSurface";
import { pageChunks, chunkName } from "./codedPages";

interface Chunk { key: string; parent: string; name: string; el: HTMLElement }

/**
 * Breaks an in-place page into its sections so they can be reordered or hidden.
 * Sections stay where they are in the page's code; the new order is applied
 * with style overrides, so wording edits keep lining up with the right spot.
 */
export default function InlineSectionsPanel({
  surface, edits, onChange,
}: {
  surface: () => HTMLElement | null;
  edits: InlineEdits;
  onChange: (next: InlineEdits) => void;
}) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [dragKey, setDragKey] = useState<string | null>(null);

  useEffect(() => {
    let tries = 0;
    const scan = () => {
      const root = surface();
      if (!root || !root.firstElementChild) return false;
      const found = pageChunks(root.firstElementChild as HTMLElement)
        .filter((el) => el !== root.firstElementChild)
        .map((el, i) => ({ key: pathOf(root, el), parent: pathOf(root, el.parentElement!), name: chunkName(el, `Section ${i + 1}`), el }));
      if (found.length > 1) { setChunks(found); return true; }
      return false;
    };
    const id = window.setInterval(() => { if (scan() || ++tries > 15) window.clearInterval(id); }, 400);
    return () => window.clearInterval(id);
  }, [surface]);

  const orderOf = (c: Chunk, fallback: number) => {
    const o = parseInt(readStyle(edits, c.key).order ?? "");
    return Number.isFinite(o) ? o : fallback;
  };
  const sorted = chunks.map((c, i) => ({ c, o: orderOf(c, i) })).sort((a, b) => a.o - b.o).map((x) => x.c);

  const writeOrder = (list: Chunk[]) => {
    const out = { ...edits };
    const patch = (key: string, props: Record<string, string>) => {
      const cur = readStyle(out, key);
      out[styleKey(key)] = JSON.stringify({ ...cur, ...props });
    };
    new Set(list.map((c) => c.parent)).forEach((p) => patch(p, { display: "flex", "flex-direction": "column" }));
    list.forEach((c, i) => patch(c.key, { order: String(i) }));
    onChange(out);
  };
  const move = (key: string, to: number) => {
    const list = sorted.filter((c) => c.key !== key);
    const item = sorted.find((c) => c.key === key)!;
    // Sections can only move among siblings that share the same container.
    list.splice(Math.max(0, Math.min(list.length, to)), 0, item);
    writeOrder(list);
  };
  const hidden = (c: Chunk) => readStyle(edits, c.key).display === "none";
  const toggleHide = (c: Chunk) => {
    const cur = readStyle(edits, c.key);
    const next = { ...cur };
    if (hidden(c)) delete next.display; else next.display = "none";
    const out = { ...edits };
    if (Object.keys(next).length) out[styleKey(c.key)] = JSON.stringify(next); else delete out[styleKey(c.key)];
    onChange(out);
  };

  if (chunks.length < 2) return null;
  return (
    <div className="mb-6">
      <p className="text-sm font-medium mb-1">Sections</p>
      <p className="text-xs text-muted-foreground mb-3">Drag to change the order, or hide a section.</p>
      <ul className="space-y-1">
        {sorted.map((c, i) => (
          <li
            key={c.key}
            draggable
            onDragStart={() => setDragKey(c.key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragKey && dragKey !== c.key && sorted.find((x) => x.key === dragKey)?.parent === c.parent) move(dragKey, i); setDragKey(null); }}
            onDragEnd={() => setDragKey(null)}
            className={`group flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs bg-background ${dragKey === c.key ? "opacity-50" : ""} ${hidden(c) ? "text-muted-foreground" : ""}`}
          >
            <GripVertical className="w-3.5 h-3.5 shrink-0 text-muted-foreground cursor-grab" />
            <button type="button" className="flex-1 min-w-0 truncate text-left" title={c.name}
              onClick={() => c.el.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {c.name}
            </button>
            <button type="button" title="Move up" aria-label="Move up" disabled={i === 0 || sorted[i - 1].parent !== c.parent}
              onClick={() => move(c.key, i - 1)} className="p-0.5 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button type="button" title="Move down" aria-label="Move down" disabled={i === sorted.length - 1 || sorted[i + 1].parent !== c.parent}
              onClick={() => move(c.key, i + 1)} className="p-0.5 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
            <button type="button" title={hidden(c) ? "Show" : "Hide"} aria-label={hidden(c) ? "Show" : "Hide"}
              onClick={() => toggleHide(c)} className="p-0.5">{hidden(c) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
