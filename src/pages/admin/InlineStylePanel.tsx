import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fontMenu, inheritedFont, inheritedWeight } from "./designChat/fontOptions";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Strikethrough, ImageIcon, RotateCcw, Trash2, Underline, Eraser, Minus, Type, Eye, EyeOff, Palette, MoveVertical, Smile, Maximize2, SquareDashed, Film, TextCursorInput, icons } from "lucide-react";
import { ToolHeader, ToolGroup, ToolGrid, ToolField, ToolSegment, ToolNote } from "./designChat/ToolPanel";
import { LINK_ICONS, readStyle, styleKey, type InlineEdits, type InlineSelection } from "@/components/InlineEditSurface";
import { remoteSnapshot, remoteFormatting, selectionComputedStyle, type FormatCommand } from "./remoteSelection";
import SelectionColourPicker from "./SelectionColourPicker";
import { selectionDescription } from "./selectionDescription";
import SelectedWording from "./SelectedWording";
import MaterialIconField from "./MaterialIconField";
import { spacingPixels, lineHeightMultiplier } from "./textUnits";
import { SIDES, commonValue, isMixed, setAllSides, setBorderPart, sideValues, type BorderPart, type Side } from "./borderEdit";

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
  // Words highlighted inside the selected text: style changes then apply to just those words.
  const range = useRef<Range | null>(null);
  const span = useRef<HTMLSpanElement | null>(null);
  const [localHighlighted, setHighlighted] = useState(false);
  useEffect(() => {
    if (sel?.kind !== "image") return;
    const remove = (event: KeyboardEvent) => {
      const el = event.target instanceof Element ? event.target : null;
      if (event.defaultPrevented || !["Delete", "Backspace"].includes(event.key) || el?.closest("input,textarea,select,[contenteditable=true],[role=dialog],[role=alertdialog]")) return;
      event.preventDefault(); onChange({ ...edits, [`hidden:${sel.key}`]: "1" });
    };
    window.addEventListener("keydown", remove);
    return () => window.removeEventListener("keydown", remove);
  }, [sel, edits, onChange]);
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
  const words = remoteFormatting(sel.el);
  const marks = words?.range && !words.range.collapsed && words.range.text ? words.range.marks : null;
  const highlighted = !!marks || localHighlighted;
  const description = selectionDescription(sel);
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
    <Button variant="ghost" size="sm" title="Put this item back the way it was built." onClick={reset}>Restore Original</Button>
  </div>;
  const swatches = (cur: string | undefined, pick: (v: string) => void) => <SelectionColourPicker value={cur} onChange={pick} />;

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
        <ToolHeader icon={ImageIcon} {...description} menu={[{ label: "Reset Picture Size", icon: RotateCcw, onSelect: reset }]} />
        <ToolGroup title="Picture" icon={ImageIcon} defaultOpen>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onReplaceImage}>
            <ImageIcon className="w-4 h-4" /> Replace Picture
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={() => { const next = { ...edits }; if (next[`hidden:${sel.key}`] === "1") delete next[`hidden:${sel.key}`]; else next[`hidden:${sel.key}`] = "1"; onChange(next); }}><Trash2 className="h-4 w-4" />{edits[`hidden:${sel.key}`] === "1" ? "Restore Image" : "Delete Image"}</Button>
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

  if (sel.kind === "input") {
    const pKey = `placeholder:${sel.key}`;
    const original = remoteSnapshot(sel.el)?.attrs?.placeholder ?? sel.el.getAttribute("placeholder") ?? "";
    const value = edits[pKey] ?? original;
    const setPlaceholder = (v: string) => {
      const next = { ...edits };
      if (v) next[pKey] = v.slice(0, 300); else delete next[pKey];
      onChange(next);
    };
    return (
      <div>
        <ToolHeader icon={TextCursorInput} {...description} />
        <ToolGroup title="Wording" icon={TextCursorInput} defaultOpen>
          <ToolField label="Placeholder Text">
            <Input aria-label="Placeholder Text" maxLength={300} value={value} onChange={(e) => setPlaceholder(e.target.value)} />
          </ToolField>
          <ToolNote>The grey hint shown inside the empty box. Clear it to go back to the original hint.</ToolNote>
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
        <ToolHeader icon={Film} {...description} menu={[{ label: "Reset Video Size", icon: RotateCcw, onSelect: reset }]} />
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
    const commands: Record<string, FormatCommand> = { "font-weight": "weight", "font-style": "italic", "text-decoration": "underline", color: "color", "font-size": "size", "font-family": "font" };
    if (marks && commands[prop]) { words?.format(commands[prop], value); return; }
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
    if (marks) { words?.format("clear"); return; }
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
  const bold = marks?.bold ?? (hs ? parseInt(hs.fontWeight) >= 600 : parseInt(style["font-weight"] ?? computed.fontWeight) >= 600);
  const italic = marks?.italic ?? (hs ? hs.fontStyle === "italic" : (style["font-style"] ?? computed.fontStyle) === "italic");
  const decoration = hs ? hs.textDecoration : style["text-decoration"] ?? computed.textDecorationLine;
  const under = marks?.underline ?? decoration.includes("underline");
  const strike = marks?.strike ?? decoration.includes("line-through");
  const toggleMark = (command: "bold" | "italic" | "underline" | "strike") => {
    if (marks) { words?.format(command); return; }
    if (command === "bold") apply("font-weight", bold ? "400" : "700");
    else if (command === "italic") highlighted ? apply("font-style", italic ? "normal" : "italic") : toggle("font-style", "italic", italic);
    else { const active = new Set(decoration.split(/\s+/).filter(v => v && v !== "none")); const mark = command === "strike" ? "line-through" : "underline"; if (active.has(mark)) active.delete(mark); else active.add(mark); apply("text-decoration", [...active].join(" ") || "none"); }
  };
  const align = style["text-align"] ?? computed.textAlign;
  const inherited = inheritedFont(computed.fontFamily, sel.el.tagName);
  const fontValue = marks ? marks.font : style["font-family"] || "";
  const fontName = fontValue ? inheritedFont(fontValue, sel.el.tagName).name : inherited.name;
  const sizeNow = marks ? num(String(marks.size)) : num(style["font-size"]) || num(computed.fontSize);
  const weightNow = marks ? String(marks.weight) : style["font-weight"] ?? "";
  const colourNow = marks ? marks.color : style.color || computed.color;
  return (
    <div>
      <ToolHeader icon={Type} {...description}
        menu={[{ label: "Restore Original", icon: RotateCcw, onSelect: reset }]}><SelectedWording sel={sel} edits={edits} onChange={onChange} /></ToolHeader>
      {highlighted ? (
        <div className="pb-3">
          <ToolNote>
            <span className="flex items-center justify-between gap-2">
              <span>Changes apply to the highlighted words only.</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Clear Word Formatting" onMouseDown={(e) => e.preventDefault()} onClick={clearWords} title="Clear Word Formatting"><Eraser className="h-3.5 w-3.5" /></Button>
            </span>
          </ToolNote>
        </div>
      ) : null}
      <ToolGroup title="Text" icon={Type} defaultOpen summary={`${fontName} · ${sizeNow}px`}>
        <div data-text-toolbar className="flex items-center gap-1">
          <ToolSegment className="shrink-0 [&>button]:w-6" onMouseDown={(e) => e.preventDefault()}>
            {([["bold", Bold, bold], ["italic", Italic, italic], ["underline", Underline, under], ["strike", Strikethrough, strike]] as const).map(([command, Icon, active]) => <Button key={command} size="icon" variant={active ? "default" : "ghost"} title={command === "strike" ? "Strikethrough" : command[0].toUpperCase() + command.slice(1)} aria-label={command === "strike" ? "Strikethrough" : command[0].toUpperCase() + command.slice(1)} aria-pressed={active} onClick={() => toggleMark(command)}><Icon className="h-3.5 w-3.5" /></Button>)}
          </ToolSegment>
          <div className="relative w-14 shrink-0"><Input aria-label="Size (px)" className="h-8 px-1 pr-5 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" type="number" min={8} placeholder={num(computed.fontSize)} value={marks ? sizeNow : num(style["font-size"])} onChange={e => apply("font-size", px(e.target.value))} /><span className="pointer-events-none absolute right-1 top-2 text-[10px] text-muted-foreground">px</span></div>
          <SelectionColourPicker value={colourNow} onChange={v => apply("color", v)} />
        </div>
        <div className="flex items-center gap-2">
          <Select value={fontValue || "inherited"} onValueChange={value => apply("font-family", value === "inherited" ? "" : value)}>
            <SelectTrigger className="h-8 min-w-0 flex-1" aria-label="Font" style={{ fontFamily: fontValue || inherited.family }}><SelectValue>{fontName}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="inherited" style={{ fontFamily: inherited.family }}>{inherited.name}</SelectItem>
              {fontValue && !fontMenu(inherited.name).others.some(([, value]) => value === fontValue) && <SelectItem value={fontValue} style={{ fontFamily: fontValue }}>{fontName}</SelectItem>}
              {fontMenu(inherited.name).others.map(([name, family]) => <SelectItem key={family} value={family} style={{ fontFamily: family }}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={weightNow || "inherited"} onValueChange={value => apply("font-weight", value === "inherited" ? "" : value)}>
            <SelectTrigger aria-label="Weight" className="h-8 w-28 min-w-0 gap-0 px-1 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="inherited">{inheritedWeight(computed.fontWeight)}</SelectItem>{weightNow && !WEIGHTS.some(([, v]) => v === weightNow) && <SelectItem value={weightNow}>{inheritedWeight(weightNow)}</SelectItem>}{WEIGHTS.filter(([l, v]) => l !== inheritedWeight(computed.fontWeight) || weightNow === v).map(([l, v]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </ToolGroup>
      <ToolGroup title="Position" icon={MoveVertical}>
        <div className="flex flex-wrap items-end gap-2">
          <ToolField label="Alignment"><ToolSegment className="shrink-0 [&>button]:w-7" onMouseDown={(e) => e.preventDefault()}>
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
              <Button key={a} size="icon" variant={align === a ? "default" : "ghost"} title={`Align ${a[0].toUpperCase() + a.slice(1)}`} aria-label={`Align ${a[0].toUpperCase() + a.slice(1)}`} onClick={() => set("text-align", a)}><Icon className="h-3.5 w-3.5" /></Button>
            ))}
          </ToolSegment></ToolField>
          <ToolField label="Letter Spacing">
            <div className="relative w-20"><Input aria-label="Letter Spacing (px)" className="h-8 pr-6" type="number" step={0.1} placeholder={spacingPixels(computed.letterSpacing, computed.fontSize) || "0"} value={spacingPixels(style["letter-spacing"], computed.fontSize)} onChange={(e) => set("letter-spacing", px(e.target.value))} /><span className="pointer-events-none absolute right-2 top-2 text-xs text-muted-foreground">px</span></div>
          </ToolField>
          <ToolField label="Line Height">
            <div className="relative w-20"><Input aria-label="Line Height (Multiplier)" className="h-8 pr-6" type="number" step={0.1} min={0.8} placeholder={lineHeightMultiplier(computed.lineHeight, computed.fontSize) || "1.4"} value={lineHeightMultiplier(style["line-height"], computed.fontSize)} onChange={(e) => set("line-height", e.target.value)} /><span className="pointer-events-none absolute right-2 top-2 text-xs text-muted-foreground">×</span></div>
          </ToolField>
        </div>
      </ToolGroup>
      {linkEl && (
        <ToolGroup title="Icon" icon={Smile}>
          <MaterialIconField value={iconNow} onChange={value => onChange({ ...edits, [`icon:${sel.key}`]: value })} />
          <div className="grid grid-cols-6 gap-1">
            <Button variant="outline" size="icon" type="button" title="No Icon" aria-pressed={iconNow === "none"}
              onClick={() => onChange({ ...edits, [`icon:${sel.key}`]: "none" })}
              className={`flex h-8 items-center justify-center rounded border text-[10px] ${iconNow === "none" ? "ring-2 ring-ring" : ""}`}>None</Button>
            {LINK_ICONS.map((n) => {
              const I = icons[n as keyof typeof icons];
              return (
                <Button variant="outline" size="icon" key={n} type="button" title={n.replace(/([a-z])([A-Z])/g, "$1 $2")} aria-pressed={iconNow === n}
                  onClick={() => onChange({ ...edits, [`icon:${sel.key}`]: n })}
                  className={`flex h-8 items-center justify-center rounded border hover:bg-muted ${iconNow === n ? "ring-2 ring-ring" : ""}`}>
                  <I className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
          {iconNow && (
            <Button variant="link" size="sm" className="text-xs underline text-muted-foreground" onClick={() => { const o = { ...edits }; delete o[`icon:${sel.key}`]; onChange(o); }}>Use Original Icon</Button>
          )}
        </ToolGroup>
      )}
    </div>
  );
}

const BORDER_STYLES = [["None", "none"], ["Solid", "solid"], ["Dashed", "dashed"], ["Dotted", "dotted"]] as const;

/** Whole-border controls: All sides by default, optional Individual sides. */
function BorderControls({ style, computed, side, swatches, reset, write }: {
  style: Record<string, string>; computed: CSSStyleDeclaration; side: Side;
  swatches: (cur: string | undefined, pick: (v: string) => void) => JSX.Element;
  reset: () => void; write: (next: Record<string, string>) => void;
}) {
  const [mode, setMode] = useState<"all" | "individual">("all");
  const [active, setActive] = useState<Side>(side);
  const read = (p: string) => computed.getPropertyValue(p);
  const mixed = isMixed(style, read);
  const value = (part: BorderPart) => mode === "all" ? commonValue(sideValues(style, read, part)) : sideValues(style, read, part)[active];
  const change = (part: BorderPart, v: string) =>
    write(mode === "all" ? setAllSides(style, read, part, v) : setBorderPart(style, part, v, [active]));
  const width = value("width"), bstyle = value("style"), colour = value("color");
  return (
    <div>
      <ToolHeader icon={SquareDashed} title="Border" menu={[{ label: "Restore Original", icon: RotateCcw, onSelect: reset }]} />
      <ToolGroup title="Border" icon={SquareDashed} defaultOpen>
        <ToolSegment className="flex w-full">
          {([["All Sides", "all"], ["Individual Sides", "individual"]] as const).map(([l, v]) => (
            <Button key={v} size="sm" aria-pressed={mode === v} variant={mode === v ? "default" : "ghost"} className="flex-1" onClick={() => setMode(v)}>{l}</Button>
          ))}
        </ToolSegment>
        {mode === "all" && mixed && <ToolNote>Mixed: the sides currently differ. Any change here applies to all four sides.</ToolNote>}
        {mode === "individual" && (
          <ToolSegment className="flex w-full">
            {SIDES.map((s) => (
              <Button key={s} size="sm" aria-pressed={active === s} variant={active === s ? "default" : "ghost"} className="flex-1" onClick={() => setActive(s)}>{s[0].toUpperCase() + s.slice(1)}</Button>
            ))}
          </ToolSegment>
        )}
        <ToolField label="Width (px)">
          <Input type="number" min={0} max={24} aria-label="Border Width" placeholder={width === null ? "Mixed" : num(width) || "0"}
            value={num(mode === "all" ? (width !== null ? style["border-top-width"] : "") : style[`border-${active}-width`])}
            onChange={(e) => change("width", px(e.target.value))} />
        </ToolField>
        <ToolField label={bstyle === null ? "Style (Mixed)" : "Style"}>
          <ToolSegment className="flex w-full">
            {BORDER_STYLES.map(([l, v]) => (
              <Button key={v} size="sm" variant={bstyle === v ? "default" : "ghost"} className="flex-1" onClick={() => change("style", v)}>{l}</Button>
            ))}
          </ToolSegment>
        </ToolField>
      </ToolGroup>
      <ToolGroup title={colour === null ? "Colour (Mixed)" : "Colour"} icon={Palette} defaultOpen>
        {swatches(colour ?? undefined, (v) => change("color", v))}
      </ToolGroup>
    </div>
  );
}
