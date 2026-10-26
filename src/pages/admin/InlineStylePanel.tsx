import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, CaseUpper, ImageIcon, RotateCcw, Underline, Eraser, Minus, Type, Eye, EyeOff, Palette, MoveVertical, Smile, Maximize2, SquareDashed, Film, TextCursorInput, icons } from "lucide-react";
import { ToolHeader, ToolGroup, ToolGrid, ToolField, ToolSegment, ToolNote } from "./designChat/ToolPanel";
import { LINK_ICONS, readStyle, styleKey, type InlineEdits, type InlineSelection } from "@/components/InlineEditSurface";
import { remoteSnapshot, selectionComputedStyle } from "./remoteSelection";

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
    if (remoteSnapshot(sel.el)) return; // Live Selection/Range belongs to the public frame.
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
      <ToolNote>
        Click any wording or picture on the page to change it. Wording can be typed over directly.
      </ToolNote>
    );
  }
  const style = readStyle(edits, sel.key);
  const computed = selectionComputedStyle(sel.el);
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
  if (sel.kind === "locked") return <div className="space-y-3">
    <ToolHeader icon={SquareDashed} title="Built in Code" />
    <Button variant="outline" size="sm" onClick={() => set("display", "none")}>Delete Element</Button>
    <Button variant="ghost" size="sm" onClick={reset}>Reset Element</Button>
  </div>;
  const swatches = (cur: string | undefined, pick: (v: string) => void, keepFocus = false) => (
    <div className="flex gap-2">
      {COLOURS.map(([l, c]) => {
        const v = `hsl(var(--nova-${c}))`;
        return (
          <button key={c} type="button" title={l} aria-label={l} aria-pressed={cur === v}
            onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
            onClick={() => pick(v)}
            className={`h-7 w-7 rounded-full border ${cur === v ? "ring-2 ring-ring ring-offset-2" : ""}`}
            style={{ background: v }} />
        );
      })}
    </div>
  );

  if (sel.kind === "divider" && sel.side) {
    return <BorderControls key={sel.key} style={style} computed={selectionComputedStyle(sel.el)} side={sel.side}
      swatches={swatches} reset={reset}
      write={(next) => {
        const out = { ...edits };
        if (Object.keys(next).length) out[styleKey(sel.key)] = JSON.stringify(next); else delete out[styleKey(sel.key)];
        onChange(out);
      }} />;
  }

  if (sel.kind === "divider") {
    const r = sel.el.getBoundingClientRect();
    const vertical = r.height > r.width;
    return (
      <div>
        <ToolHeader icon={Minus} title="Divider Line" menu={[
          { label: "Reset", icon: RotateCcw, onSelect: reset },
          { label: style.visibility ? "Show line" : "Hide line", icon: style.visibility ? Eye : EyeOff, onSelect: () => set("visibility", style.visibility ? "" : "hidden") },
        ]} />
        <ToolGroup title="Line" icon={Minus} defaultOpen>
          <ToolGrid>
            <ToolField label={`${vertical ? "Height" : "Length"} (px)`}>
              <Input type="number" min={4} placeholder={String(Math.round(vertical ? r.height : r.width))}
                value={num(style[vertical ? "height" : "width"])} onChange={(e) => set(vertical ? "height" : "width", px(e.target.value))} />
            </ToolField>
            <ToolField label="Thickness (px)">
              <Input type="number" min={1} max={12} placeholder={String(Math.max(1, Math.round(vertical ? r.width : r.height)))}
                value={num(style[vertical ? "width" : "height"])} onChange={(e) => set(vertical ? "width" : "height", px(e.target.value))} />
            </ToolField>
          </ToolGrid>
        </ToolGroup>
        <ToolGroup title="Colour" icon={Palette} defaultOpen>
          {swatches(style["background-color"], (v) => set("background-color", style["background-color"] === v ? "" : v))}
        </ToolGroup>
        <ToolGroup title="Spacing" icon={MoveVertical}>
          <ToolField label="Space Above and Below (px)">
            <Input type="number" min={0} placeholder="Default" value={num(style["margin-top"])}
              onChange={(e) => { const v = px(e.target.value); const next = { ...style }; if (v) { next["margin-top"] = v; next["margin-bottom"] = v; } else { delete next["margin-top"]; delete next["margin-bottom"]; } const out = { ...edits }; if (Object.keys(next).length) out[styleKey(sel.key)] = JSON.stringify(next); else delete out[styleKey(sel.key)]; onChange(out); }} />
          </ToolField>
        </ToolGroup>
      </div>
    );
  }

  if (sel.kind === "image") {
    return (
      <div>
        <ToolHeader icon={ImageIcon} title="Picture" menu={[{ label: "Reset Picture Size", icon: RotateCcw, onSelect: reset }]} />
        <ToolGroup title="Picture" icon={ImageIcon} defaultOpen>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onReplaceImage}>
            <ImageIcon className="w-4 h-4" /> Replace Picture
          </Button>
          <ToolField label="Fit">
            <ToolSegment className="flex w-full">
              {([["Fill", "cover"], ["Whole picture", "contain"]] as const).map(([l, v]) => (
                <Button key={v} size="sm" variant={(style["object-fit"] ?? computed.objectFit) === v ? "default" : "ghost"}
                  className="flex-1" onClick={() => set("object-fit", v)}>{l}</Button>
              ))}
            </ToolSegment>
          </ToolField>
        </ToolGroup>
        <ToolGroup title="Size" icon={Maximize2}>
          <ToolGrid>
            <ToolField label="Width (px)">
              <Input type="number" min={20} placeholder={String(Math.round(sel.el.getBoundingClientRect().width))}
                value={num(style.width)} onChange={(e) => set("width", px(e.target.value))} />
            </ToolField>
            <ToolField label="Height (px)">
              <Input type="number" min={20} placeholder={String(Math.round(sel.el.getBoundingClientRect().height))}
                value={num(style.height)} onChange={(e) => set("height", px(e.target.value))} />
            </ToolField>
          </ToolGrid>
        </ToolGroup>
        <ToolGroup title="Corners" icon={SquareDashed}>
          <ToolField label="Rounded Corners (px)">
            <Input type="number" min={0} placeholder={num(computed.borderRadius) || "0"}
              value={num(style["border-radius"])} onChange={(e) => set("border-radius", px(e.target.value))} />
          </ToolField>
        </ToolGroup>
      </div>
    );
  }

  if (sel.kind === "video") {
    const snap = remoteSnapshot(sel.el);
    const attr = (k: string) => snap?.attrs?.[k] ?? sel.el.getAttribute(k) ?? "";
    const ml = style["margin-left"], mr = style["margin-right"];
    const align = ml === "auto" && mr === "auto" ? "center" : ml === "auto" ? "right" : mr === "auto" ? "left" : "";
    const setAlign = (a: string) => {
      const next = { ...style };
      delete next["margin-left"]; delete next["margin-right"];
      if (a === "center") { next["margin-left"] = "auto"; next["margin-right"] = "auto"; }
      if (a === "right") next["margin-left"] = "auto";
      if (a === "left") next["margin-right"] = "auto";
      if (a) next.display = "block"; else delete next.display;
      const out = { ...edits };
      if (Object.keys(next).length) out[styleKey(sel.key)] = JSON.stringify(next); else delete out[styleKey(sel.key)];
      onChange(out);
    };
    return (
      <div>
        <ToolHeader icon={Film} title="Video" subtitle={attr("title") || undefined} menu={[{ label: "Reset Video Size", icon: RotateCcw, onSelect: reset }]} />
        <ToolGroup title="Size" icon={Maximize2} defaultOpen>
          <ToolGrid>
            <ToolField label="Width (px)">
              <Input type="number" min={20} placeholder={String(Math.round(sel.el.getBoundingClientRect().width))}
                value={num(style.width)} onChange={(e) => set("width", px(e.target.value))} />
            </ToolField>
            <ToolField label="Height (px)">
              <Input type="number" min={20} placeholder={String(Math.round(sel.el.getBoundingClientRect().height))}
                value={num(style.height)} onChange={(e) => set("height", px(e.target.value))} />
            </ToolField>
          </ToolGrid>
          <ToolField label="Alignment">
            <ToolSegment>
              {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                <Button key={a} size="icon" variant={align === a ? "default" : "ghost"} title={`Align ${a}`} aria-label={`Align ${a}`} onClick={() => setAlign(align === a ? "" : a)}><Icon className="w-4 h-4" /></Button>
              ))}
            </ToolSegment>
          </ToolField>
        </ToolGroup>
        <ToolGroup title="Corners" icon={SquareDashed}>
          <ToolField label="Rounded Corners (px)">
            <Input type="number" min={0} placeholder={num(computed.borderRadius) || "0"}
              value={num(style["border-radius"])} onChange={(e) => set("border-radius", px(e.target.value))} />
          </ToolField>
        </ToolGroup>
        <ToolGroup title="Details" icon={Film}>
          {([["Title", "title"], ["Poster", "poster"], ["Source", "src"]] as const).map(([label, k]) => (
            <ToolField key={k} label={label}><Input readOnly value={attr(k)} placeholder="None" aria-label={`Video ${label}`} /></ToolField>
          ))}
          <ToolNote>Changing the title, poster or video itself on a built page isn't available yet. To use a different video, add one from Videos in the top bar.</ToolNote>
        </ToolGroup>
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
  const fontName = (FONTS.find(([, v]) => v === style["font-family"])?.[0] ?? "Default").split(" · ")[0];
  const sizeNow = num(style["font-size"]) || num(computed.fontSize);
  const textPreview = (sel.el.textContent ?? "").trim().replace(/\s+/g, " ");
  const tagName = sel.el.tagName.toLowerCase();
  // A plain button label (no icon or other parts inside) can be retyped here; it saves as the element's wording.
  const labelEditable = (tagName === "button" || tagName === "a" || sel.el.getAttribute("role") === "button") && sel.el.children.length === 0;
  const labelNow = edits[sel.key] !== undefined ? (() => { const d = document.createElement("div"); d.innerHTML = edits[sel.key]; return d.textContent ?? ""; })() : textPreview;
  const setLabel = (v: string) => onChange({ ...edits, [sel.key]: v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") });
  const placeholderNow = remoteSnapshot(sel.el)?.attrs?.placeholder ?? sel.el.getAttribute("placeholder");
  return (
    <div>
      <ToolHeader icon={Type} title="Text" subtitle={textPreview.length > 40 ? `${textPreview.slice(0, 40)}…` : textPreview || undefined}
        menu={[{ label: "Reset Text Style", icon: RotateCcw, onSelect: reset }]} />
      {remoteSnapshot(sel.el) && <ToolNote>Text styles apply to the whole selected element. Highlighted-word formatting isn't available through this page connection.</ToolNote>}
      {highlighted ? (
        <div className="pb-3">
          <ToolNote>
            <span className="flex items-center justify-between gap-2">
              <span>Changes apply to the highlighted words only.</span>
              <button type="button" className="underline" onMouseDown={(e) => e.preventDefault()} onClick={clearWords} title="Remove styles from these words"><Eraser className="inline h-3.5 w-3.5" /> Clear</button>
            </span>
          </ToolNote>
        </div>
      ) : null}
      {(labelEditable || typeof placeholderNow === "string") && (
        <ToolGroup title="Wording" icon={TextCursorInput} defaultOpen>
          {labelEditable && <ToolField label="Button Label"><Input aria-label="Button Label" value={labelNow} onChange={(e) => setLabel(e.target.value)} /></ToolField>}
          {typeof placeholderNow === "string" && <>
            <ToolField label="Placeholder"><Input aria-label="Placeholder" readOnly value={placeholderNow} /></ToolField>
            <ToolNote>Changing a field's placeholder isn't available yet.</ToolNote>
          </>}
        </ToolGroup>
      )}
      <ToolGroup title="Text" icon={Type} defaultOpen summary={`${fontName} · ${sizeNow}px`}>
        <div className="flex flex-wrap gap-2">
          <ToolSegment onMouseDown={(e) => e.preventDefault()}>
            <Button size="icon" variant={bold ? "default" : "ghost"} title="Bold" onClick={() => apply("font-weight", bold ? "400" : "700")}><Bold className="w-4 h-4" /></Button>
            <Button size="icon" variant={italic ? "default" : "ghost"} title="Italic" onClick={() => (highlighted ? apply("font-style", italic ? "normal" : "italic") : toggle("font-style", "italic", italic))}><Italic className="w-4 h-4" /></Button>
            <Button size="icon" variant={under ? "default" : "ghost"} title="Underline" onClick={() => apply("text-decoration", under ? "none" : "underline")}><Underline className="w-4 h-4" /></Button>
            <Button size="icon" variant={upper ? "default" : "ghost"} title="Capitals" onClick={() => apply("text-transform", upper ? "none" : "uppercase")}><CaseUpper className="w-4 h-4" /></Button>
          </ToolSegment>
          <ToolSegment onMouseDown={(e) => e.preventDefault()}>
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
              <Button key={a} size="icon" variant={align === a ? "default" : "ghost"} title={`Align ${a}`} onClick={() => set("text-align", a)}><Icon className="w-4 h-4" /></Button>
            ))}
          </ToolSegment>
        </div>
        <ToolField label="Font">
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={style["font-family"] ?? ""} onChange={(e) => apply("font-family", e.target.value)}>
            <option value="">Default</option>
            {FONTS.map(([l, v]) => <option key={l} value={v}>{l}</option>)}
          </select>
        </ToolField>
        <ToolGrid>
          <ToolField label="Size (px)">
            <Input type="number" min={8} placeholder={num(computed.fontSize)} value={num(style["font-size"])} onChange={(e) => apply("font-size", px(e.target.value))} />
          </ToolField>
          <ToolField label="Weight">
            <select className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={style["font-weight"] ?? ""} onChange={(e) => apply("font-weight", e.target.value)}>
              <option value="">Default</option>
              {WEIGHTS.map(([l, v]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </ToolField>
        </ToolGrid>
      </ToolGroup>
      <ToolGroup title="Colour" icon={Palette} defaultOpen>
        {swatches(style.color, (v) => apply("color", highlighted ? v : style.color === v ? "" : v), true)}
      </ToolGroup>
      <ToolGroup title="Spacing" icon={MoveVertical}>
        <ToolGrid>
          <ToolField label="Letter Spacing">
            <Input type="number" step={0.05} placeholder="0" value={num(style["letter-spacing"])} onChange={(e) => apply("letter-spacing", e.target.value ? `${e.target.value}em` : "")} />
          </ToolField>
          <ToolField label="Line Height">
            <Input type="number" step={0.1} min={0.8} placeholder={(parseFloat(computed.lineHeight) / parseFloat(computed.fontSize) || 1.4).toFixed(1)} value={style["line-height"] ?? ""} onChange={(e) => apply("line-height", e.target.value)} />
          </ToolField>
        </ToolGrid>
      </ToolGroup>
      {linkEl && (
        <ToolGroup title="Icon" icon={Smile}>
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
            <button type="button" className="text-xs underline text-muted-foreground" onClick={() => { const o = { ...edits }; delete o[`icon:${sel.key}`]; onChange(o); }}>Use Original Icon</button>
          )}
        </ToolGroup>
      )}
    </div>
  );
}
