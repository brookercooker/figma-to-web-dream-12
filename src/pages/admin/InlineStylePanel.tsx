import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, CaseUpper, ImageIcon, RotateCcw } from "lucide-react";
import { readStyle, styleKey, type InlineEdits, type InlineSelection } from "@/components/InlineEditSurface";

const COLOURS = [
  ["Ink", "ink"], ["Stone", "stone"], ["Garnet", "garnet"], ["Tan", "brass"], ["White", "cream"],
] as const;
const WEIGHTS = [["Light", "300"], ["Regular", "400"], ["Medium", "500"], ["Bold", "700"]] as const;

const px = (v: string) => (v ? `${v}px` : "");
const num = (v?: string) => (v ? String(parseFloat(v)) : "");

export default function InlineStylePanel({
  sel, edits, onChange, onReplaceImage,
}: {
  sel: InlineSelection | null;
  edits: InlineEdits;
  onChange: (next: InlineEdits) => void;
  onReplaceImage: () => void;
}) {
  if (!sel) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        Click any wording or picture on the page to change it. Wording can be typed over directly.
      </p>
    );
  }
  const style = readStyle(edits, sel.key);
  const computed = getComputedStyle(sel.el);
  const set = (prop: string, value: string) => {
    const next = { ...style };
    if (value) next[prop] = value; else delete next[prop];
    const out = { ...edits };
    if (Object.keys(next).length) out[styleKey(sel.key)] = JSON.stringify(next);
    else delete out[styleKey(sel.key)];
    onChange(out);
  };
  const toggle = (prop: string, on: string, current: boolean) => set(prop, current ? (style[prop] ? "" : "normal") : on);
  const reset = () => {
    const out = { ...edits };
    delete out[styleKey(sel.key)];
    onChange(out);
  };
  const label = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

  if (sel.kind === "image") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Picture</p>
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onReplaceImage}>
          <ImageIcon className="w-4 h-4" /> Replace picture
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className={label}>Width (px)</span>
            <Input type="number" min={20} placeholder={String(Math.round(sel.el.getBoundingClientRect().width))}
              value={num(style.width)} onChange={(e) => set("width", px(e.target.value))} />
          </label>
          <label className="space-y-1"><span className={label}>Height (px)</span>
            <Input type="number" min={20} placeholder={String(Math.round(sel.el.getBoundingClientRect().height))}
              value={num(style.height)} onChange={(e) => set("height", px(e.target.value))} />
          </label>
        </div>
        <div className="space-y-1">
          <span className={label}>Fit</span>
          <div className="flex gap-1">
            {([["Fill", "cover"], ["Whole picture", "contain"]] as const).map(([l, v]) => (
              <Button key={v} size="sm" variant={(style["object-fit"] ?? computed.objectFit) === v ? "default" : "outline"}
                className="flex-1" onClick={() => set("object-fit", v)}>{l}</Button>
            ))}
          </div>
        </div>
        <label className="space-y-1 block"><span className={label}>Rounded corners (px)</span>
          <Input type="number" min={0} placeholder={num(computed.borderRadius) || "0"}
            value={num(style["border-radius"])} onChange={(e) => set("border-radius", px(e.target.value))} />
        </label>
        <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="w-4 h-4" /> Reset picture size</Button>
      </div>
    );
  }

  const bold = parseInt(style["font-weight"] ?? computed.fontWeight) >= 600;
  const italic = (style["font-style"] ?? computed.fontStyle) === "italic";
  const upper = (style["text-transform"] ?? computed.textTransform) === "uppercase";
  const align = style["text-align"] ?? computed.textAlign;
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Text style</p>
      <div className="flex gap-1">
        <Button size="icon" variant={bold ? "default" : "outline"} title="Bold" onClick={() => set("font-weight", bold ? "400" : "700")}><Bold className="w-4 h-4" /></Button>
        <Button size="icon" variant={italic ? "default" : "outline"} title="Italic" onClick={() => toggle("font-style", "italic", italic)}><Italic className="w-4 h-4" /></Button>
        <Button size="icon" variant={upper ? "default" : "outline"} title="Capitals" onClick={() => set("text-transform", upper ? "none" : "uppercase")}><CaseUpper className="w-4 h-4" /></Button>
        <span className="w-2" />
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
          <Button key={a} size="icon" variant={align === a ? "default" : "outline"} title={`Align ${a}`} onClick={() => set("text-align", a)}><Icon className="w-4 h-4" /></Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1"><span className={label}>Size (px)</span>
          <Input type="number" min={8} placeholder={num(computed.fontSize)} value={num(style["font-size"])} onChange={(e) => set("font-size", px(e.target.value))} />
        </label>
        <label className="space-y-1"><span className={label}>Letter spacing</span>
          <Input type="number" step={0.05} placeholder="0" value={num(style["letter-spacing"])} onChange={(e) => set("letter-spacing", e.target.value ? `${e.target.value}em` : "")} />
        </label>
        <label className="space-y-1"><span className={label}>Line height</span>
          <Input type="number" step={0.1} min={0.8} placeholder={(parseFloat(computed.lineHeight) / parseFloat(computed.fontSize) || 1.4).toFixed(1)} value={style["line-height"] ?? ""} onChange={(e) => set("line-height", e.target.value)} />
        </label>
        <label className="space-y-1"><span className={label}>Weight</span>
          <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={style["font-weight"] ?? ""} onChange={(e) => set("font-weight", e.target.value)}>
            <option value="">As designed</option>
            {WEIGHTS.map(([l, v]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="space-y-1">
        <span className={label}>Colour</span>
        <div className="flex gap-2">
          {COLOURS.map(([l, c]) => {
            const v = `hsl(var(--nova-${c}))`;
            return (
              <button key={c} type="button" title={l} aria-label={l} aria-pressed={style.color === v}
                onClick={() => set("color", style.color === v ? "" : v)}
                className={`h-7 w-7 rounded-full border ${style.color === v ? "ring-2 ring-ring ring-offset-2" : ""}`}
                style={{ background: v }} />
            );
          })}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="w-4 h-4" /> Reset text style</Button>
    </div>
  );
}
