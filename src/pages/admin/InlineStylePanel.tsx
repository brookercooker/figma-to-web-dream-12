import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, CaseUpper, ImageIcon, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readStyle, styleKey, type InlineEdits, type InlineSelection, type InlineStyle } from "@/components/InlineEditSurface";

const COLORS: [string, string][] = [
  ["Ink", "hsl(var(--nova-ink))"],
  ["Stone", "hsl(var(--nova-stone))"],
  ["Tan", "hsl(var(--nova-brass))"],
  ["Garnet", "hsl(var(--nova-garnet))"],
  ["White", "hsl(var(--nova-cream))"],
];

const px = (v: string | undefined) => (v ? String(parseFloat(v)) : "");

export default function InlineStylePanel({
  sel, edits, onChange, onReplaceImage, onClose,
}: {
  sel: InlineSelection;
  edits: InlineEdits;
  onChange: (next: InlineEdits) => void;
  onReplaceImage: () => void;
  onClose: () => void;
}) {
  const st = readStyle(edits, sel.path);
  const cs = window.getComputedStyle(sel.el);
  const set = (patch: InlineStyle) => {
    const next: InlineStyle = { ...st, ...patch };
    Object.keys(next).forEach((k) => { if (!next[k as keyof InlineStyle]) delete next[k as keyof InlineStyle]; });
    // Clearing a value restores the original on the next render.
    if (Object.entries(patch).some(([, v]) => !v)) Object.keys(patch).forEach((k) => ((sel.el.style as any)[k] = ""));
    onChange({ ...edits, [styleKey(sel.path)]: JSON.stringify(next) });
  };
  const reset = () => {
    const next = { ...edits };
    delete next[styleKey(sel.path)];
    delete next[sel.path];
    delete next[`img:${sel.path}`];
    sel.el.removeAttribute("style");
    onChange(next);
  };
  const toggleBtn = (on: boolean) => `h-8 w-8 p-0 ${on ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`;

  return (
    <aside className="border-l bg-background w-[260px] shrink-0 overflow-y-auto h-[70vh] p-4 space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">{sel.kind === "image" ? "Picture" : "Text"}</p>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></Button>
      </div>

      {sel.kind === "text" ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Size (px)</label>
            <Input type="number" min={8} max={160} className="h-8" placeholder={px(cs.fontSize)}
              value={px(st.fontSize)} onChange={(e) => set({ fontSize: e.target.value ? `${e.target.value}px` : "" })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Style</label>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className={toggleBtn(st.fontWeight === "600")} title="Bold"
                onClick={() => set({ fontWeight: st.fontWeight === "600" ? "" : "600" })}><Bold className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className={toggleBtn(st.fontStyle === "italic")} title="Italic"
                onClick={() => set({ fontStyle: st.fontStyle === "italic" ? "" : "italic" })}><Italic className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className={toggleBtn(st.textTransform === "uppercase")} title="Capitals"
                onClick={() => set({ textTransform: st.textTransform === "uppercase" ? "" : "uppercase" })}><CaseUpper className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Alignment</label>
            <div className="flex gap-1">
              {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                <Button key={a} variant="outline" size="sm" className={toggleBtn(st.textAlign === a)} title={a}
                  onClick={() => set({ textAlign: st.textAlign === a ? "" : a })}><Icon className="w-4 h-4" /></Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Letter spacing (em)</label>
            <Input type="number" step={0.01} min={-0.1} max={1} className="h-8" placeholder="Original"
              value={st.letterSpacing ? String(parseFloat(st.letterSpacing)) : ""}
              onChange={(e) => set({ letterSpacing: e.target.value ? `${e.target.value}em` : "" })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Colour</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(([name, c]) => (
                <button key={name} type="button" title={name} aria-label={name} onClick={() => set({ color: st.color === c ? "" : c })}
                  className={`h-7 w-7 rounded-full border ${st.color === c ? "ring-2 ring-ring ring-offset-1" : ""}`} style={{ background: c }} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onReplaceImage}>
            <ImageIcon className="w-4 h-4" /> Replace picture
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Width (px)</label>
              <Input type="number" min={40} className="h-8" placeholder={String(Math.round(sel.el.getBoundingClientRect().width))}
                value={px(st.width)} onChange={(e) => set({ width: e.target.value ? `${e.target.value}px` : "", maxWidth: e.target.value ? "100%" : "" })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Height (px)</label>
              <Input type="number" min={40} className="h-8" placeholder={String(Math.round(sel.el.getBoundingClientRect().height))}
                value={px(st.height)} onChange={(e) => set({ height: e.target.value ? `${e.target.value}px` : "" })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Fit</label>
            <div className="flex gap-1">
              {([["cover", "Fill"], ["contain", "Whole picture"]] as const).map(([f, label]) => (
                <Button key={f} variant="outline" size="sm" className={`h-8 flex-1 text-xs ${st.objectFit === f ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  onClick={() => set({ objectFit: st.objectFit === f ? "" : f })}>{label}</Button>
              ))}
            </div>
          </div>
        </>
      )}

      <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={reset}>
        <RotateCcw className="w-4 h-4" /> Reset this {sel.kind === "image" ? "picture" : "text"}
      </Button>
    </aside>
  );
}
