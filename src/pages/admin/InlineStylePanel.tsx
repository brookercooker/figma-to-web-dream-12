import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, CaseUpper, ImageIcon, RotateCcw, Underline, Eraser, icons } from "lucide-react";
import { LINK_ICONS, readStyle, styleKey, type InlineEdits, type InlineSelection } from "@/components/InlineEditSurface";

const COLOURS = [
  ["Ink", "ink"], ["Stone", "stone"], ["Garnet", "garnet"], ["Tan", "brass"], ["White", "cream"],
] as const;
const WEIGHTS = [["Light", "300"], ["Regular", "400"], ["Medium", "500"], ["Bold", "700"]] as const;

const FONTS = [["Serif · Cormorant Garamond", "'Cormorant Garamond', Georgia, serif"], ["Sans · site body", "Inter, system-ui, sans-serif"], ["Georgia", "Georgia, serif"], ["Monospace", "ui-monospace, monospace"]] as const;


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
  // Words highlighted inside the selected text: style changes then apply to just those words.
  const range = useRef<Range | null>(null);
  const span = useRef<HTMLSpanElement | null>(null);
  const [highlighted, setHighlighted] = useState(false);
  useEffect(() => {
    range.current = null; span.current = null; setHighlighted(false);
    if (!sel || sel.kind !== "text") return;
    const onSel = () => {
      const s = window.getSelection();
      if (!s || !s.rangeCount) return;
      const r = s.getRangeAt(0);
      if (!sel.el.contains(r.commonAncestorContainer)) return; // e.g. typing in the panel
      if (r.collapsed) { range.current = null; span.current = null; setHighlighted(false); return; }
      range.current = r.cloneRange(); span.current = null; setHighlighted(true);
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [sel?.el, sel?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (sel.kind === "divider" && sel.side) {
    const side = sel.side;
    const cs = getComputedStyle(sel.el);
    const col = style[`border-${side}-color`];
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Line</p>
        <label className="space-y-1 block"><span className={label}>Thickness (px)</span>
          <Input type="number" min={1} max={12} placeholder={num(cs.getPropertyValue(`border-${side}-width`)) || "1"}
            value={num(style[`border-${side}-width`])} onChange={(e) => set(`border-${side}-width`, px(e.target.value))} />
        </label>
        <div className="space-y-1">
          <span className={label}>Colour</span>
          <div className="flex gap-2">
            {COLOURS.map(([l, c]) => {
              const v = `hsl(var(--nova-${c}))`;
              return (
                <button key={c} type="button" title={l} aria-label={l} aria-pressed={col === v}
                  onClick={() => set(`border-${side}-color`, col === v ? "" : v)}
                  className={`h-7 w-7 rounded-full border ${col === v ? "ring-2 ring-ring ring-offset-2" : ""}`}
                  style={{ background: v }} />
              );
            })}
          </div>
        </div>
        <div className="space-y-1">
          <span className={label}>Style</span>
          <div className="flex gap-1">
            {([["Solid", "solid"], ["Dashed", "dashed"], ["Dotted", "dotted"]] as const).map(([l, v]) => (
              <Button key={v} size="sm" variant={(style[`border-${side}-style`] ?? cs.getPropertyValue(`border-${side}-style`)) === v ? "default" : "outline"}
                className="flex-1" onClick={() => set(`border-${side}-style`, v)}>{l}</Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => set(`border-${side}-style`, style[`border-${side}-style`] === "none" ? "" : "none")}>
            {style[`border-${side}-style`] === "none" ? "Show line" : "Hide line"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="w-4 h-4" /> Reset</Button>
        </div>
      </div>
    );
  }

  if (sel.kind === "divider") {
    const r = sel.el.getBoundingClientRect();
    const vertical = r.height > r.width;
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Divider line</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className={label}>{vertical ? "Height" : "Length"} (px)</span>
            <Input type="number" min={4} placeholder={String(Math.round(vertical ? r.height : r.width))}
              value={num(style[vertical ? "height" : "width"])} onChange={(e) => set(vertical ? "height" : "width", px(e.target.value))} />
          </label>
          <label className="space-y-1"><span className={label}>Thickness (px)</span>
            <Input type="number" min={1} max={12} placeholder={String(Math.max(1, Math.round(vertical ? r.width : r.height)))}
              value={num(style[vertical ? "width" : "height"])} onChange={(e) => set(vertical ? "width" : "height", px(e.target.value))} />
          </label>
        </div>
        <div className="space-y-1">
          <span className={label}>Colour</span>
          <div className="flex gap-2">
            {COLOURS.map(([l, c]) => {
              const v = `hsl(var(--nova-${c}))`;
              return (
                <button key={c} type="button" title={l} aria-label={l} aria-pressed={style["background-color"] === v}
                  onClick={() => set("background-color", style["background-color"] === v ? "" : v)}
                  className={`h-7 w-7 rounded-full border ${style["background-color"] === v ? "ring-2 ring-ring ring-offset-2" : ""}`}
                  style={{ background: v }} />
              );
            })}
          </div>
        </div>
        <label className="space-y-1 block"><span className={label}>Space above and below (px)</span>
          <Input type="number" min={0} placeholder="Default" value={num(style["margin-top"])}
            onChange={(e) => { const v = px(e.target.value); const next = { ...style }; if (v) { next["margin-top"] = v; next["margin-bottom"] = v; } else { delete next["margin-top"]; delete next["margin-bottom"]; } const out = { ...edits }; if (Object.keys(next).length) out[styleKey(sel.key)] = JSON.stringify(next); else delete out[styleKey(sel.key)]; onChange(out); }} />
        </label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => set("visibility", style.visibility ? "" : "hidden")}>
            {style.visibility ? "Show line" : "Hide line"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="w-4 h-4" /> Reset</Button>
        </div>
      </div>
    );
  }

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

  /** Apply to highlighted words if any, otherwise to the whole text. */
  const apply = (prop: string, value: string) => {
    const r = range.current;
    if (!r || !sel.el.contains(r.commonAncestorContainer)) return set(prop, value);
    let s = span.current;
    if (!s || !sel.el.contains(s)) {
      s = document.createElement("span");
      s.appendChild(r.extractContents());
      r.insertNode(s);
      span.current = s;
      const nr = document.createRange(); nr.selectNodeContents(s); range.current = nr;
    }
    if (value) s.style.setProperty(prop, value); else s.style.removeProperty(prop);
    sel.el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const clearWords = () => {
    const r = range.current;
    if (!r) return;
    const text = r.extractContents().textContent ?? "";
    r.insertNode(document.createTextNode(text));
    span.current = null;
    sel.el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const hs = highlighted && span.current ? span.current.style : null;
  const linkEl = sel.el.closest("a,button") ?? (sel.el.querySelector("svg") ? sel.el : null);
  const iconNow = edits[`icon:${sel.key}`] ?? "";
  const bold = hs ? parseInt(hs.fontWeight) >= 600 : parseInt(style["font-weight"] ?? computed.fontWeight) >= 600;
  const italic = hs ? hs.fontStyle === "italic" : (style["font-style"] ?? computed.fontStyle) === "italic";
  const upper = hs ? hs.textTransform === "uppercase" : (style["text-transform"] ?? computed.textTransform) === "uppercase";
  const under = hs ? hs.textDecoration.includes("underline") : (style["text-decoration"] ?? computed.textDecorationLine).includes("underline");
  const align = style["text-align"] ?? computed.textAlign;
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Text style</p>
      {highlighted ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <span>Changes apply to the highlighted words only.</span>
          <button type="button" className="underline" onMouseDown={(e) => e.preventDefault()} onClick={clearWords} title="Remove styles from these words"><Eraser className="inline h-3.5 w-3.5" /> Clear</button>
        </div>
      ) : null}
      <div className="flex gap-1" onMouseDown={(e) => e.preventDefault()}>
        <Button size="icon" variant={bold ? "default" : "outline"} title="Bold" onClick={() => apply("font-weight", bold ? "400" : "700")}><Bold className="w-4 h-4" /></Button>
        <Button size="icon" variant={italic ? "default" : "outline"} title="Italic" onClick={() => (highlighted ? apply("font-style", italic ? "normal" : "italic") : toggle("font-style", "italic", italic))}><Italic className="w-4 h-4" /></Button>
        <Button size="icon" variant={under ? "default" : "outline"} title="Underline" onClick={() => apply("text-decoration", under ? "none" : "underline")}><Underline className="w-4 h-4" /></Button>
        <Button size="icon" variant={upper ? "default" : "outline"} title="Capitals" onClick={() => apply("text-transform", upper ? "none" : "uppercase")}><CaseUpper className="w-4 h-4" /></Button>
        <span className="w-2" />
        {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
          <Button key={a} size="icon" variant={align === a ? "default" : "outline"} title={`Align ${a}`} onClick={() => set("text-align", a)}><Icon className="w-4 h-4" /></Button>
        ))}
      </div>
      <label className="space-y-1 block"><span className={label}>Font</span>
        <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={style["font-family"] ?? ""} onChange={(e) => apply("font-family", e.target.value)}>
          <option value="">Default</option>
          {FONTS.map(([l, v]) => <option key={l} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1"><span className={label}>Size (px)</span>
          <Input type="number" min={8} placeholder={num(computed.fontSize)} value={num(style["font-size"])} onChange={(e) => apply("font-size", px(e.target.value))} />
        </label>
        <label className="space-y-1"><span className={label}>Letter spacing</span>
          <Input type="number" step={0.05} placeholder="0" value={num(style["letter-spacing"])} onChange={(e) => apply("letter-spacing", e.target.value ? `${e.target.value}em` : "")} />
        </label>
        <label className="space-y-1"><span className={label}>Line height</span>
          <Input type="number" step={0.1} min={0.8} placeholder={(parseFloat(computed.lineHeight) / parseFloat(computed.fontSize) || 1.4).toFixed(1)} value={style["line-height"] ?? ""} onChange={(e) => apply("line-height", e.target.value)} />
        </label>
        <label className="space-y-1"><span className={label}>Weight</span>
          <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={style["font-weight"] ?? ""} onChange={(e) => apply("font-weight", e.target.value)}>
            <option value="">Default</option>
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply("color", highlighted ? v : style.color === v ? "" : v)}
                className={`h-7 w-7 rounded-full border ${style.color === v ? "ring-2 ring-ring ring-offset-2" : ""}`}
                style={{ background: v }} />
            );
          })}
        </div>
      </div>
      {linkEl && (
        <div className="space-y-2 border-t pt-4">
          <span className={label}>Icon</span>
          <div className="grid grid-cols-6 gap-1">
            <button type="button" title="No icon" aria-pressed={iconNow === "none"}
              onClick={() => onChange({ ...edits, [`icon:${sel.key}`]: "none" })}
              className={`flex h-8 items-center justify-center rounded border text-[10px] ${iconNow === "none" ? "ring-2 ring-ring" : ""}`}>None</button>
            {LINK_ICONS.map((n) => {
              const I = icons[n as keyof typeof icons];
              return (
                <button key={n} type="button" title={n.replace(/([a-z])([A-Z])/g, "$1 $2")} aria-pressed={iconNow === n}
                  onClick={() => onChange({ ...edits, [`icon:${sel.key}`]: n })}
                  className={`flex h-8 items-center justify-center rounded border hover:bg-muted ${iconNow === n ? "ring-2 ring-ring" : ""}`}>
                  <I className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {iconNow && (
            <button type="button" className="text-xs underline text-muted-foreground" onClick={() => { const o = { ...edits }; delete o[`icon:${sel.key}`]; onChange(o); }}>Use original icon</button>
          )}
        </div>
      )}
      <Button variant="ghost" size="sm" className="gap-2" onClick={reset}><RotateCcw className="w-4 h-4" /> Reset text style</Button>
    </div>
  );
}
