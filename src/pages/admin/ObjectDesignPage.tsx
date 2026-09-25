import { Fragment, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowDown, ArrowUp, Eye, Pencil, Plus, Save, Trash2,
  Tag, Heading, AlignLeft, Image as ImageIcon, MousePointerClick,
  AlignCenter, AlignRight, Rows2, Columns2, Layers, PanelLeft, PanelRight,
  LayoutGrid, GalleryHorizontal, Bold, Italic, Underline, ChevronDown, ChevronsDownUp, ChevronsUpDown, GripVertical,
  Video as VideoIcon, Minus, Link as LinkIcon, Copy, PanelLeftClose, PanelLeftOpen,
  PanelTop, PanelBottom,
  Monitor, Tablet, Smartphone,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Baseline,
  Sparkles, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  type LucideIcon,
} from "lucide-react";
import CreateObjectDialog from "./CreateObjectDialog";

const ICON_LABEL_SIDES: { value: "before" | "after" | "above" | "below"; label: string; icon: LucideIcon }[] = [
  { value: "before", label: "Before", icon: PanelLeft },
  { value: "after", label: "After", icon: PanelRight },
  { value: "above", label: "Above", icon: PanelTop },
  { value: "below", label: "Below", icon: PanelBottom },
];
import { objectRegistry } from "@/components/objects/registry";
import ImagePickerDialog from "./ImagePickerDialog";
import ImageResizeHandles from "./ImageResizeHandles";
import TextResizeHandles, { isTextPart } from "./TextResizeHandles";
import VideoPickerDialog from "./VideoPickerDialog";
import ObjectMiniPreview from "./ObjectMiniPreview";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SectionEditing, partRotation, BG_COLORS, BODY_PX, FREE_TEXT_KINDS, isCustomColor, HEADING_PX, IMAGE_HEIGHTS, IMAGE_TEXT_DEFAULTS, IMAGE_TEXT_KINDS, IMAGE_FOCUS_OPTIONS, imageZoom, IMAGE_SCRIMS, IMAGE_SHADOWS, MAX_TEXT_PX, MIN_TEXT_PX, SECTION_ICONS, SECTION_ICON_NAMES, SECTION_LABEL, SectionFlowList, SectionView, TEXT_COLORS, TEXT_FONTS, TEXT_SIZES, cleanEditedHtml, imageGroupPart, imageGroups, makeSection, orderParts, newSectionId, parseSections, withEyebrowDefaults,
  type FreeDivider, type FreeSection, type FreeTextKind, type SectionFlow, type ImageText, type ImageTextKind, type Section, type SectionAlign, type SectionImage, type SectionVideo, type SectionType,
  type RowVAlign, type ImageHeight, type PartVAlign,
  type TextColor, type TextFont, type TextSize, type TextStyle,
  ContainedBgContext,
  bgColorCss,
  segmentColorCss,
} from "@/components/ObjectSections";

/** Paints a block's own background inside its editor frame. */
function blockBgStyle(sec: object): React.CSSProperties | undefined {
  const s = sec as { bgImage?: string };
  const bg = (s as { bg?: Parameters<typeof bgColorCss>[0] }).bg;
  if (!bg && !s.bgImage) return undefined;
  return {
    ...(bg ? { backgroundColor: bgColorCss(bg) } : {}),
    ...(s.bgImage ? { backgroundImage: `url(${s.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
  };
}

/** Icon shown on the icon-only "add item" row inside an image editor. */
const IMAGE_TEXT_ICONS: Record<ImageTextKind, LucideIcon> = {
  eyebrow: Tag,
  title: Heading,
  subheading: Baseline,
  text: AlignLeft,
  divider: Minus,
  button: MousePointerClick,
  icon: Sparkles,
};

/**
 * When part of a text element is selected inside an inline editor, apply the
 * format to just that selection instead of the whole element.
 */
function formatSelection(command: "bold" | "italic" | "underline") {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const node = sel.anchorNode;
  const el = (node instanceof HTMLElement ? node : node?.parentElement) ?? null;
  const host = el?.closest<HTMLElement>('[contenteditable="true"]');
  if (!host) return false;
  document.execCommand(command);
  host.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

/** Wraps the highlighted text in a span carrying its own colour or font. */
function styleSelection(attr: "data-color" | "data-font", value: string | null) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const host = (node instanceof HTMLElement ? node : node.parentElement)?.closest<HTMLElement>('[contenteditable="true"]');
  if (!host) return;
  const frag = range.extractContents();
  // A new choice replaces the same setting on anything inside the selection.
  frag.querySelectorAll<HTMLElement>(`span[${attr}]`).forEach((sp) => {
    sp.removeAttribute(attr);
    if (attr === "data-color") sp.style.color = "";
    else sp.classList.remove("font-serif", "font-light", "font-sans");
  });
  const span = document.createElement("span");
  if (value) {
    span.setAttribute(attr, value);
    if (attr === "data-color") span.style.color = segmentColorCss(value) ?? "";
    else span.className = value === "serif" ? "font-serif font-light" : "font-sans";
  }
  span.appendChild(frag);
  range.insertNode(span);
  const next = document.createRange();
  next.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(next);
  host.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Side-panel controls for just the highlighted part of a text element. */
function SelectionStylePanel() {
  const keep = (e: React.MouseEvent) => e.preventDefault();
  const btn = "h-8 rounded-md border bg-background px-2.5 text-xs hover:bg-muted";
  return (
    <div className="space-y-3 border-b bg-muted/30 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Highlighted text</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onMouseDown={keep} onClick={() => formatSelection("bold")} className={`${btn} font-bold`}>B</button>
        <button type="button" onMouseDown={keep} onClick={() => formatSelection("italic")} className={`${btn} italic`}>I</button>
        <button type="button" onMouseDown={keep} onClick={() => formatSelection("underline")} className={`${btn} underline`}>U</button>
        {TEXT_FONTS.map((f) => (
          <button key={f.value} type="button" onMouseDown={keep} onClick={() => styleSelection("data-font", f.value)} className={`${btn} ${f.value === "serif" ? "font-serif" : "font-sans"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            aria-label={`${c.label} colour`}
            onMouseDown={keep}
            onClick={() => styleSelection("data-color", c.value)}
            className="h-7 w-7 rounded-full border shadow-sm"
            style={{ background: c.swatch }}
          />
        ))}
        <button type="button" onMouseDown={keep} onClick={() => styleSelection("data-color", null)} className={btn}>
          Default colour
        </button>
      </div>
    </div>
  );
}

/** True while part of a text element being edited in place is highlighted. */
function useInlineSelection() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => {
      const sel = window.getSelection();
      const node = sel && sel.rangeCount && !sel.isCollapsed ? sel.anchorNode : null;
      const el = node instanceof HTMLElement ? node : node?.parentElement;
      setOn(!!el?.closest('[contenteditable="true"][data-text-body], [contenteditable="true"][data-part]'));
    };
    document.addEventListener("selectionchange", check);
    return () => document.removeEventListener("selectionchange", check);
  }, []);
  return on;
}

interface ObjectRow {
  id: string;
  slug_id: string;
  name: string;
  status: string;
  component_key: string | null;
  content: unknown;
  updated_at: string;
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Choice<T extends string | number>({
  value, options, onChange, hideLabels,
}: { value: T; options: { value: T; label: string; icon?: LucideIcon }[]; onChange: (v: T) => void; hideLabels?: boolean }) {
  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          title={o.label}
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
            o.value === value ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
          }`}
        >
          {o.icon ? <o.icon className="h-3.5 w-3.5" /> : null}
          {hideLabels && o.icon ? <span className="sr-only">{o.label}</span> : o.label}
        </button>
      ))}
    </div>
  );
}

/** Screen widths the editor can preview at. */
type ViewportKey = "desktop" | "tablet" | "mobile";
const VIEWPORTS: { key: ViewportKey; label: string; width?: number; icon: LucideIcon }[] = [
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { key: "mobile", label: "Mobile", width: 390, icon: Smartphone },
];

/** Tiny previews so each button style shows what it looks like. */
const SolidStyleIcon = ((props: { className?: string }) => (
  <svg viewBox="0 0 24 14" fill="none" className={props.className} aria-hidden="true">
    <rect x="1" y="1" width="22" height="12" rx="3" fill="currentColor" />
  </svg>
)) as unknown as LucideIcon;

const OutlineStyleIcon = ((props: { className?: string }) => (
  <svg viewBox="0 0 24 14" fill="none" className={props.className} aria-hidden="true">
    <rect x="1.5" y="1.5" width="21" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)) as unknown as LucideIcon;

const LinkStyleIcon = ((props: { className?: string }) => (
  <svg viewBox="0 0 24 14" fill="none" className={props.className} aria-hidden="true">
    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 11h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
)) as unknown as LucideIcon;

const BUTTON_STYLE_OPTIONS = [
  { value: "solid" as const, label: "Solid", icon: SolidStyleIcon },
  { value: "outline" as const, label: "Outline", icon: OutlineStyleIcon },
  { value: "link" as const, label: "Text link", icon: LinkStyleIcon },
];

/**
 * Any color is allowed. The brand palette sits first, with a custom picker
 * after it so bespoke colors stay a deliberate second step.
 */
function CustomColorSwatch({
  value, onChange, size = "h-5 w-5",
}: { value: TextColor | undefined; onChange: (v: TextColor) => void; size?: string }) {
  const custom = isCustomColor(value);
  const current = custom ? (value as string) : "#212121";
  return (
    <label
      title="Custom color"
      className={`relative inline-flex cursor-pointer items-center justify-center rounded-full border border-border transition-transform hover:scale-110 ${size} ${
        custom ? "ring-2 ring-offset-1 ring-foreground/60" : ""
      }`}
      style={{
        background: custom
          ? current
          : "conic-gradient(#e8453c,#f9bc15,#3bb143,#25b2e8,#6a45c4,#e8453c)",
      }}
    >
      <input
        type="color"
        aria-label="Custom color"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

function ColorSwatches({ value, onChange }: { value: TextColor; onChange: (v: TextColor) => void }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      {TEXT_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          aria-label={c.label}
          aria-pressed={value === c.value}
          onClick={() => onChange(c.value)}
          className={`h-5 w-5 rounded-full border border-border transition-transform hover:scale-110 ${
            value === c.value ? "ring-2 ring-offset-1 ring-foreground/60" : ""
          }`}
          style={{ background: c.swatch }}
        />
      ))}
      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
      <CustomColorSwatch value={value} onChange={onChange} />
    </div>
  );
}

/** Common sizes offered in a dropdown, with a free-typed px value allowed. */
const COMMON_TEXT_PX = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 80];

function SizeControl({
  style, defaultSize, heading, set,
}: { style: TextStyle; defaultSize: TextSize; heading?: boolean; set: (changes: Partial<TextStyle>) => void }) {
  const preset = (heading ? HEADING_PX : BODY_PX)[style.size ?? defaultSize];
  const px = style.sizePx ?? preset;
  const [draft, setDraft] = useState(String(px));
  useEffect(() => { setDraft(String(px)); }, [px]);

  const commit = (raw: string) => {
    const v = Number(raw);
    if (!v || Number.isNaN(v)) { setDraft(String(px)); return; }
    set({ sizePx: Math.min(MAX_TEXT_PX, Math.max(MIN_TEXT_PX, Math.round(v))) });
  };

  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center rounded-md border bg-background">
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => { commit(e.target.value); setTimeout(() => setOpen(false), 120); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit((e.target as HTMLInputElement).value); setOpen(false); }
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-14 bg-transparent px-2 py-1 text-xs outline-none"
        aria-label="Text size in pixels"
      />
      <span className="pr-2 text-[11px] text-muted-foreground">px</span>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-56 min-w-[5rem] overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {COMMON_TEXT_PX.map((v) => (
            <button
              key={v}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); set({ sizePx: v }); setOpen(false); }}
              className={`block w-full rounded px-2 py-1 text-left text-xs hover:bg-accent ${v === px ? "bg-accent/60" : ""}`}
            >
              {v} px
            </button>
          ))}
        </div>
      )}
    </span>
  );

}


function TextStyleFields({
  label, value, defaults, onChange, colorOnly,
}: {
  label: string;
  value: TextStyle | undefined;
  defaults: { font: TextFont; color: TextColor; size: TextSize };
  onChange: (next: TextStyle) => void;
  colorOnly?: boolean;
}) {
  const style = value ?? {};
  const set = (changes: Partial<TextStyle>) => onChange({ ...style, ...changes });
  return (
    <div className="rounded-md border p-3 space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-4">
        {!colorOnly && (
          <Field label="Font">
            <div>
              <Choice
                value={style.font ?? defaults.font}
                options={TEXT_FONTS}
                onChange={(v) => set({ font: v })}
              />
            </div>
          </Field>
        )}
        {!colorOnly && (
          <Field label="Size">
            <div className="flex items-center gap-2">
              <SizeControl
                style={style}
                defaultSize={defaults.size}
                heading={defaults.font === "serif"}
                set={set}
              />
            </div>
          </Field>
        )}
        <Field label="Emphasis">
          <div className="pt-1">
            <EmphasisToggles style={style} set={set} />
          </div>
        </Field>
        <Field label="Color">
          <ColorSwatches
            value={style.color ?? defaults.color}
            onChange={(v) => set({ color: v })}
          />
        </Field>
        {!colorOnly && (
          <Field label="Max lines">
            <Input
              className="w-20"
              type="number"
              min={0}
              placeholder="All"
              value={style.lines ?? ""}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const n = Number(raw);
                set({ lines: raw === "" || !Number.isFinite(n) || n <= 0 ? undefined : n });
              }}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

/** Optional symbol shown before or after a button label. */
function ButtonIconField({
  icon, side, onChange,
}: {
  icon?: string;
  side?: "before" | "after";
  onChange: (next: { icon?: string; iconSide?: "before" | "after" }) => void;
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Symbol</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={icon ? "outline" : "secondary"}
          onClick={() => onChange({ icon: undefined, iconSide: side })}
        >
          None
        </Button>
        <Choice
          value={side ?? "before"}
          options={[
            { value: "before" as const, label: "Before" },
            { value: "after" as const, label: "After" },
          ]}
          onChange={(v) => onChange({ icon, iconSide: v })}
        />
      </div>
      <div className="grid grid-cols-8 gap-1">
        {SECTION_ICON_NAMES.map((name) => {
          const Icon = SECTION_ICONS[name];
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              onClick={() => onChange({ icon: name, iconSide: side ?? "before" })}
              className={`flex h-8 items-center justify-center rounded border ${name === icon ? "border-primary bg-accent" : "border-transparent hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Optional symbol shown with a piece of text. */
function TextIconField({
  icon, side, onChange,
}: {
  icon?: string;
  side?: "before" | "after" | "above" | "below";
  onChange: (next: { icon?: string; iconSide?: "before" | "after" | "above" | "below" }) => void;
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Symbol</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={icon ? "outline" : "secondary"}
          onClick={() => onChange({ icon: undefined, iconSide: side })}
        >
          None
        </Button>
        {icon ? (
          <Choice
            value={side ?? "before"}
            options={ICON_LABEL_SIDES}
            hideLabels
            onChange={(v) => onChange({ icon, iconSide: v })}
          />
        ) : null}
      </div>
      <div className="grid grid-cols-8 gap-1">
        {SECTION_ICON_NAMES.map((name) => {
          const Icon = SECTION_ICONS[name];
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              onClick={() => onChange({ icon: name, iconSide: side ?? "before" })}
              className={`flex h-8 items-center justify-center rounded border ${name === icon ? "border-primary bg-accent" : "border-transparent hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}



/** Pick a symbol, its size, and whether it sits inside a circle. */
function IconPicker({
  value, style, onPick, onStyle,
}: {
  value: string;
  style: TextStyle | undefined;
  onPick: (name: string) => void;
  onStyle: (next: TextStyle) => void;
}) {
  const current = (value || "sparkles").trim();
  const s = style ?? {};
  return (
    <div className="rounded-md border p-3 space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Symbol</p>
      <div className="grid grid-cols-8 gap-1">
        {SECTION_ICON_NAMES.map((name) => {
          const Icon = SECTION_ICONS[name];
          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={name}
              onClick={() => onPick(name)}
              className={`flex h-8 items-center justify-center rounded border ${name === current ? "border-primary bg-accent" : "border-transparent hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Size">
          <Input
            className="w-20"
            type="number"
            placeholder="28"
            value={s.sizePx ?? ""}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const n = Number(raw);
              onStyle({ ...s, sizePx: raw === "" || !Number.isFinite(n) ? undefined : n });
            }}
          />
        </Field>
        <Field label="Circle">
          <Button
            type="button"
            variant={s.iconRing ? "secondary" : "outline"}
            size="sm"
            onClick={() => onStyle({ ...s, iconRing: s.iconRing ? undefined : true })}
          >
            {s.iconRing ? "On" : "Off"}
          </Button>
        </Field>
      </div>
    </div>
  );
}

// Which style field on a section each clickable text part maps to.
const STYLE_FIELD: Record<string, keyof FreeSection | undefined> = {
  eyebrow: "eyebrowStyle",
  heading: "textStyle",
  body: "bodyStyle",
  button: "labelStyle",
  caption: "captionStyle",
};

const STYLE_FIELD_LABEL: Record<string, string> = {
  eyebrowStyle: "Eyebrow",
  textStyle: "Title",
  bodyStyle: "Text",
  labelStyle: "Button label",
  captionStyle: "Caption",
};

const SIZE_WORD: Record<string, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra Large",
};

function EmphasisToggles({
  style, set, underlineDefault = false,
}: { style: TextStyle; set: (changes: Partial<TextStyle>) => void; underlineDefault?: boolean }) {
  const underlined = style.underline ?? underlineDefault;
  const items: {
    key: string; on: boolean; icon: LucideIcon; label: string; cmd: "bold" | "italic" | "underline"; toggle: () => void;
  }[] = [
    { key: "b", on: !!style.bold, icon: Bold, label: "Bold", cmd: "bold", toggle: () => set({ bold: !style.bold || undefined }) },
    { key: "i", on: !!style.italic, icon: Italic, label: "Italic", cmd: "italic", toggle: () => set({ italic: !style.italic || undefined }) },
    { key: "u", on: underlined, icon: Underline, label: "Underline", cmd: "underline", toggle: () => set({ underline: !underlined }) },
  ];
  return (
    <span className="inline-flex overflow-hidden rounded-md border">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          title={it.label}
          aria-label={it.label}
          aria-pressed={it.on}
          // keep the text selection alive so the format can target just that part
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { if (!formatSelection(it.cmd)) it.toggle(); }}
          className={`px-2 py-1.5 transition-colors ${
            it.on ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
          }`}
        >
          <it.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </span>
  );
}

function IconSelect<T extends string>({
  label, value, options, onChange,
}: { label?: string; value: T; options: { value: T; label: string; icon?: LucideIcon }[]; onChange: (v: T) => void }) {
  const current = options.find((o) => o.value === value) ?? options[0];
  const Current = current?.icon;
  return (
    <span className="flex items-center gap-1.5 text-xs">
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs hover:bg-muted">
          {Current ? <Current className="h-3.5 w-3.5" /> : null}
          {current?.label}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
          {options.map((o) => {
            const Icon = o.icon;
            return (
              <DropdownMenuItem key={o.value} onSelect={() => onChange(o.value)} className="gap-2 text-xs">
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {o.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

function Dropdown({
  label, value, options, onChange,
}: { label: string; value: string; options: { value: string; label: string; icon?: LucideIcon }[]; onChange: (v: string) => void }) {
  if (options.length > 0 && options.every((o) => o.icon)) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="inline-flex overflow-hidden rounded-md border">
          {options.map((o) => {
            const Icon = o.icon!;
            return (
              <button
                key={o.value}
                type="button"
                title={o.label}
                aria-label={o.label}
                onClick={() => onChange(o.value)}
                className={`px-2 py-1.5 transition-colors ${
                  o.value === value ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </span>
      </span>
    );
  }
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-md border bg-background px-2 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ColorDot({ swatch }: { swatch?: string }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-foreground/50 ring-1 ring-inset ring-white/60"
      style={swatch ? { background: swatch } : { background: "transparent" }}
    />
  );
}

function ColorDropdown({
  label, value, fallback, options, onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  options: { value: string; label: string; swatch: string }[];
  onChange: (v: string) => void;
}) {
  const active = value || fallback;
  const current = options.find((o) => o.value === active);
  const custom = !current && isCustomColor(active);
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs"
          >
            <ColorDot swatch={current?.swatch ?? (custom ? active : undefined)} />
            <span>{current?.label ?? (custom ? "Custom" : "")}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[9rem]">
          <div className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Brand palette
          </div>
          {options.map((o) => (
            <DropdownMenuItem key={o.value} className="gap-2 text-xs" onSelect={() => onChange(o.value)}>
              <ColorDot swatch={o.swatch} />
              {o.label}
            </DropdownMenuItem>
          ))}
          <div className="mt-1 flex items-center gap-2 border-t px-2 py-2">
            <CustomColorSwatch
              value={custom ? active : undefined}
              onChange={(v) => onChange(v as string)}
              size="h-4 w-4"
            />
            <span className="text-xs">Custom color</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Floating toolbar that keeps itself fully inside the viewport.
function FloatingToolbar({
  top, left, children,
}: { top: number; left: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top, left, ready: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      const r = el.getBoundingClientRect();
      const m = 8;
      const maxLeft = Math.max(m, window.innerWidth - r.width - m);
      const maxTop = Math.max(m, window.innerHeight - r.height - m);
      const nextLeft = Math.min(Math.max(m, left), maxLeft);
      // if there is no room above the element, drop the toolbar below it
      const nextTop = top < m ? Math.min(top + 104, maxTop) : Math.min(Math.max(m, top), maxTop);
      setPos({ top: nextTop, left: nextLeft, ready: true });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [top, left]);

  return (
    <div
      ref={ref}
      className="fixed z-50 flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-3 rounded-lg border bg-background px-3 py-2 shadow-lg"
      style={{ top: pos.top, left: pos.left, visibility: pos.ready ? "visible" : "hidden" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

/** The block preview area in the editor: drag handles on images, drag-and-drop to reorder items. */
function BlockCanvas({
  section,
  showHandles,
  activePart,
  onResize,
  onResizeText,
  onClick,
  onDoubleClick,
  onPointerDown,

  draggableParts,
  partKeyOf,
  onMovePart,
  children,
}: {
  section: Section;
  showHandles: boolean;
  activePart: string;
  onResize: (groupKey: number, size: { imageHeightPx?: number; imageWidthPx?: number }) => void;
  onResizeText?: (part: string, size: { width?: number; height?: number }) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;

  /** Item names that can be reordered in this block. */
  draggableParts: string[];
  /** Map a rendered element's data-part to the item name that can be reordered. */
  partKeyOf: (raw: string) => string | null;
  onMovePart: (from: string, to: string, before: boolean, side?: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState("");
  const [drop, setDrop] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const canReorder = draggableParts.length > 1;

  // Mark the rendered items as draggable so they can be picked up in the preview.
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const touched: HTMLElement[] = [];
    for (const el of [...host.querySelectorAll<HTMLElement>("[data-part]")]) {
      const key = partKeyOf(el.dataset.part ?? "");
      if (!canReorder || !key || !draggableParts.includes(key) || el.isContentEditable) continue;
      el.draggable = true;
      touched.push(el);
    }
    return () => { for (const el of touched) el.draggable = false; };
  });

  /** Find the reorderable item under the pointer. */
  const targetOf = (e: React.DragEvent) => {
    let el = e.target as HTMLElement | null;
    while (el && el !== ref.current) {
      const key = partKeyOf(el.dataset?.part ?? "");
      if (key && draggableParts.includes(key)) return { el, key };
      el = el.parentElement;
    }
    return null;
  };

  /** Where the dragged item would land relative to the item under the pointer. */
  const placeAt = (el: HTMLElement, e: React.DragEvent) => {
    const r = el.getBoundingClientRect();
    // Near the left/right edge means "put these side by side"; otherwise stack above/below.
    const edge = Math.max(24, Math.min(r.width * 0.3, 160));
    const side = e.clientX < r.left + edge || e.clientX > r.right - edge;
    const before = side ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2;
    return { r, vertical: side, side, before };
  };

  return (
    <div
      ref={ref}
      className="relative px-4 cursor-pointer [&_img]:!scale-100 [&_img]:!transition-none [&_[data-part]]:cursor-pointer [&_[data-part]]:rounded-sm [&_[data-part]]:transition-shadow [&_[data-part]:hover]:ring-2 [&_[data-part]:hover]:ring-primary/50 [&_[data-part]:hover]:ring-offset-2"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}

      onDragStart={(e) => {
        const t = targetOf(e);
        if (!t) return;
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        setFrom(t.key);
      }}
      onDragEnd={() => { setFrom(""); setDrop(null); }}
      onDragOver={(e) => {
        if (!from) return;
        const t = targetOf(e);
        const host = ref.current;
        if (!t || !host || t.key === from) { setDrop(null); return; }
        e.preventDefault();
        const base = host.getBoundingClientRect();
        const { r, vertical, before } = placeAt(t.el, e);
        setDrop(
          vertical
            ? { left: (before ? r.left : r.right) - base.left - 1, top: r.top - base.top, width: 2, height: r.height }
            : { left: r.left - base.left, top: (before ? r.top : r.bottom) - base.top - 1, width: r.width, height: 2 },
        );
      }}
      onDrop={(e) => {
        if (!from) return;
        const t = targetOf(e);
        if (t && t.key !== from) {
          e.preventDefault();
          e.stopPropagation();
          const at = placeAt(t.el, e);
          onMovePart(from, t.key, at.before, at.side);
        }
        setFrom("");
        setDrop(null);
      }}
    >
      <SectionEditing.Provider value>{children}</SectionEditing.Provider>
      {drop && (
        <div
          className="pointer-events-none absolute z-30 rounded bg-primary"
          style={{ left: drop.left, top: drop.top, width: drop.width, height: drop.height }}
        />
      )}
      {showHandles && section.type === "free" && (
        <ImageResizeHandles section={section} containerRef={ref} activePart={activePart} onResize={onResize} />
      )}
      {showHandles && section.type === "free" && isTextPart(activePart) && onResizeText && (
        <TextResizeHandles section={section} containerRef={ref} activePart={activePart} rotation={partRotation(section, activePart)} onResize={onResizeText} />
      )}
    </div>
  );
}


export default function ObjectDesignPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("object") ?? "";

  const [objects, setObjects] = useState<ObjectRow[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const canvasRef = useRef<HTMLElement>(null);
  const inlineSel = useInlineSelection();
  const [viewport, setViewport] = useState<ViewportKey>("desktop");
  const viewportWidth = VIEWPORTS.find((v) => v.key === viewport)?.width;
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(!selectedId);
  // { sectionId, index } — index -1 means the section's single image
  const [picker, setPicker] = useState<{ sectionId: string; index: number } | null>(null);
  // which block is choosing a background image
  const [bgPicker, setBgPicker] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState<Record<string, boolean>>({});
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});
  // which video slot the video chooser is filling
  const [videoPicker, setVideoPicker] = useState<{ sectionId: string; index: number } | null>(null);
  // which element of the active section the user clicked on in the preview
  const [focusPart, setFocusPart] = useState("");
  const [optionsFor, setOptionsFor] = useState("");
  // collapsible editing blocks: explicit overrides plus an expand/collapse-all default
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [blocksExpanded, setBlocksExpanded] = useState(false);
  const [dragPart, setDragPart] = useState<{ sectionId: string; part: string } | null>(null);
  const [dropAt, setDropAt] = useState<{ sectionId: string; part: string; before: boolean } | null>(null);
  // hovered group container (or "none" for the leave-group strip) while dragging an item
  // drag and drop for the text boxes attached to an image
  const [dragText, setDragText] = useState<{ sectionId: string; index: number; ti: number } | null>(null);
  const [dropText, setDropText] = useState<{ sectionId: string; index: number; ti: number; before: boolean } | null>(null);
  // floating font / size / color toolbar for the clicked text element
  const [toolbar, setToolbar] = useState<
    { sectionId: string; field?: keyof FreeSection; imageIndex?: number; top: number; left: number; width: number } | null
  >(null);

  useEffect(() => {
    if (!toolbar) return;
    const close = () => setToolbar(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [toolbar]);

  // Undo history: Ctrl+Z (Cmd+Z) steps back through edits to the blocks.
  const historyRef = useRef<Section[][]>([]);
  const lastSectionsRef = useRef<Section[]>(sections);
  const histObjRef = useRef(selectedId);
  const undoingRef = useRef(false);

  useEffect(() => {
    if (histObjRef.current !== selectedId) {
      histObjRef.current = selectedId;
      historyRef.current = [];
      lastSectionsRef.current = sections;
      return;
    }
    if (undoingRef.current) {
      undoingRef.current = false;
      lastSectionsRef.current = sections;
      return;
    }
    const prev = lastSectionsRef.current;
    if (prev !== sections) {
      historyRef.current = [...historyRef.current.slice(-49), prev];
      lastSectionsRef.current = sections;
    }
  }, [sections, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== "z") return;
      const el = e.target as HTMLElement | null;
      // let the browser handle undo while typing in a field
      if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const prev = historyRef.current.pop();
      if (!prev) return;
      e.preventDefault();
      undoingRef.current = true;
      setSections(prev);
      setDirty(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Delete / Backspace removes the element selected in the preview.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (!focusPart || !activeId) return;
      const part = focusPart;
      const id = activeId;
      const n = (i: number) => Number(part.split(":")[i]);
      if (part.startsWith("imagetext:")) removeImageText(id, n(1), n(2));
      else if (part.startsWith("caption:")) patchImage(id, n(1), { caption: undefined } as Partial<SectionImage>);
      else if (part.startsWith("image:")) removeImageSlot(id, n(1));
      else if (part.startsWith("video:")) removeVideo(id, n(1));
      else if (part === "videos") patch(id, { videos: [] } as Partial<Section>);
      else if (part.startsWith("divider:")) removeDivider(id, n(1));
      else if (part.startsWith("text:")) removeExtra(id, n(1));
      else if (part === "eyebrow") patch(id, { eyebrow: undefined } as Partial<Section>);
      else if (part === "heading") patch(id, { heading: undefined } as Partial<Section>);
      else if (part === "body") patch(id, { body: undefined } as Partial<Section>);
      else if (part === "button") patch(id, { buttonLabel: undefined } as Partial<Section>);
      else return;
      e.preventDefault();
      setFocusPart("");
      setToolbar(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });




  // Clicking an element in the preview jumps to (and focuses) its controls.
  useEffect(() => {
    if (!focusPart || !activeId) return;
    // Selecting an image shouldn't yank the view down into its alt/link fields.
    if (focusPart.startsWith("image:")) return;
    const t = window.setTimeout(() => {
      const group = document.querySelector<HTMLElement>(
        `[data-inspector-section="${activeId}"] [data-inspector-part="${focusPart}"]`,
      );
      if (!group) return;
      // Scroll the controls into view but never steal focus into a field.
      group.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);

    return () => window.clearTimeout(t);
  }, [focusPart, activeId]);

  // Holding down on a selected cropped picture lets you drag it to choose what shows.
  const startFocusDrag = (
    sectionId: string,
    index: number,
    el: HTMLElement,
    e: { clientX: number; clientY: number; pointerId?: number },
  ) => {
    const img = el.querySelector("img");
    if (!img) return;
    // The crop window is the picture's box; the picture itself may be zoomed inside it.
    const box = el.getBoundingClientRect();
    const nw = img.naturalWidth || box.width;
    const nh = img.naturalHeight || box.height;
    if (!nw || !nh || !box.width || !box.height) return;
    const section = sections.find((s) => s.id === sectionId);
    const zoom = imageZoom(section?.type === "free" ? section.images[index]?.zoom : undefined) / 100;
    const scale = Math.max(box.width / nw, box.height / nh) * zoom;
    const overflowX = Math.max(0, nw * scale - box.width);
    const overflowY = Math.max(0, nh * scale - box.height);
    // Nothing is hidden, so there is nothing to reposition.
    if (overflowX < 1 && overflowY < 1) return;

    // When zoomed, the picture is scaled by its wrapper, so we steer the wrapper's origin.
    const wrapper =
      zoom > 1 && img.parentElement && img.parentElement !== el && img.parentElement.style.transform
        ? (img.parentElement as HTMLElement)
        : null;
    const current = wrapper ? wrapper.style.transformOrigin : img.style.objectPosition;
    const parts = (current || "50% 50%").split(/\s+/);
    let x = parseFloat(parts[0]);
    let y = parseFloat(parts[1] ?? parts[0]);
    if (!Number.isFinite(x)) x = 50;
    if (!Number.isFinite(y)) y = 50;

    const startX = e.clientX;
    const startY = e.clientY;
    const prevCursor = img.style.cursor;
    const prevOutline = el.style.outline;
    const prevTouch = el.style.touchAction;
    img.style.cursor = "grabbing";
    el.style.outline = "2px solid hsl(var(--primary))";
    el.style.outlineOffset = "2px";
    // Stop the page from scrolling while the finger drags the picture.
    el.style.touchAction = "none";
    if (e.pointerId !== undefined) {
      try { el.setPointerCapture(e.pointerId); } catch { /* capture is best effort */ }
    }
    let next = `${x}% ${y}%`;

    const clamp = (n: number) => Math.min(100, Math.max(0, n));
    const onMove = (ev: PointerEvent) => {
      if (e.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
      if (ev.cancelable) ev.preventDefault();
      const nx = overflowX > 1 ? clamp(x - ((ev.clientX - startX) / overflowX) * 100) : x;
      const ny = overflowY > 1 ? clamp(y - ((ev.clientY - startY) / overflowY) * 100) : y;
      next = `${Math.round(nx)}% ${Math.round(ny)}%`;
      if (wrapper) wrapper.style.transformOrigin = next;
      else img.style.objectPosition = next;

    };
    const onUp = (ev: PointerEvent) => {
      if (e.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (e.pointerId !== undefined) {
        try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      }
      img.style.cursor = prevCursor;
      el.style.outline = prevOutline;
      el.style.outlineOffset = "";
      el.style.touchAction = prevTouch;
      patchImage(sectionId, index, { focus: next });
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  /** Press and hold (mouse or finger) on an already selected picture to start repositioning it. */
  const holdImageDrag = (sectionId: string, e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = (e.target as HTMLElement).closest?.("[data-part]") as HTMLElement | null;
    if (!el) return;
    const part = el.getAttribute("data-part") ?? "";
    if (!part.startsWith("image:") || part !== focusPart) return;
    const index = Number(part.split(":")[1]);
    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;
    const wasDraggable = el.draggable;
    let done = false;

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
    };
    const cancel = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      el.draggable = wasDraggable;
      cleanup();
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (Math.abs(ev.clientX - startX) > 8 || Math.abs(ev.clientY - startY) > 8) cancel();
    };
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      el.draggable = false;
      startFocusDrag(sectionId, index, el, { clientX: startX, clientY: startY, pointerId });
      window.addEventListener("pointerup", () => { el.draggable = wasDraggable; }, { once: true });
      window.addEventListener("pointercancel", () => { el.draggable = wasDraggable; }, { once: true });
    }, 180);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", cancel);
    window.addEventListener("pointercancel", cancel);
  };


  // Double-clicking a text element in the preview turns it into an inline editor.
  const editInline = (sectionId: string, e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest?.("[data-part]") as HTMLElement | null;
    if (!el) return;
    const part = el.getAttribute("data-part") ?? "";
    if (part.startsWith("image:")) return;

    const captionIdx = part.startsWith("caption:") ? Number(part.split(":")[1]) : -1;
    const extraIdx = part.startsWith("text:") ? Number(part.split(":")[1]) : -1;
    const imgText = part.startsWith("imagetext:")
      ? { img: Number(part.split(":")[1]), t: Number(part.split(":")[2]) }
      : null;
    const field =
      part === "eyebrow" ? "eyebrow"
      : part === "heading" ? "heading"
      : part === "body" ? "body"
      : part === "button" ? "buttonLabel"
      : captionIdx >= 0 ? "caption"
      : extraIdx >= 0 ? "extra"
      : imgText ? "imageText"
      : "";
    // Icons carry their own wording: edit that span, never the icon's name.
    const iconLabelEl = el.querySelector<HTMLElement>("[data-icon-label]");
    if (!field && !iconLabelEl) return;
    e.preventDefault();
    e.stopPropagation();

    const target = iconLabelEl
      ? iconLabelEl
      : field === "buttonLabel"
      ? ((el.querySelector("a, button") as HTMLElement | null) ?? el)
      : el.hasAttribute("data-text-body")
      ? el
      : ((el.querySelector("[data-text-body]") as HTMLElement | null) ?? el);
    if (target.isContentEditable) return;
    if (iconLabelEl?.hasAttribute("data-icon-label-empty")) {
      iconLabelEl.textContent = "";
      iconLabelEl.classList.remove("opacity-40");
    }
    if (target.hasAttribute("data-empty-text")) {
      target.textContent = "";
      target.removeAttribute("data-empty-text");
    }


    target.contentEditable = "true";
    target.spellcheck = false;
    target.style.outline = "2px solid hsl(var(--primary))";
    target.style.outlineOffset = "2px";
    target.focus();
    const range = document.createRange();
    range.selectNodeContents(target);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const stop = (ev: Event) => ev.stopPropagation();
    const commit = () => {
      // keeps any bold / italic / underline applied to parts of the text
      const value = cleanEditedHtml(target.innerHTML ?? "");
      target.contentEditable = "false";
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.removeEventListener("blur", commit);
      target.removeEventListener("keydown", onKey);
      target.removeEventListener("click", stop);
      if (iconLabelEl) {
        if (imgText) patchImageText(sectionId, imgText.img, imgText.t, { iconLabel: value });
        else if (extraIdx >= 0) patchExtra(sectionId, extraIdx, { iconLabel: value });
      }
      else if (imgText) patchImageText(sectionId, imgText.img, imgText.t, { text: value });
      else if (captionIdx >= 0) patchImage(sectionId, captionIdx, { caption: value });
      else if (extraIdx >= 0) patchExtra(sectionId, extraIdx, { text: value });
      else patch(sectionId, { [field]: value });
    };
    const onKey = (ev: KeyboardEvent) => {
      ev.stopPropagation();
      const mod = ev.metaKey || ev.ctrlKey;
      if (mod && ["b", "i", "u"].includes(ev.key.toLowerCase())) {
        ev.preventDefault();
        formatSelection(ev.key.toLowerCase() === "b" ? "bold" : ev.key.toLowerCase() === "i" ? "italic" : "underline");
        return;
      }
      if (ev.key === "Escape") { ev.preventDefault(); target.blur(); }
      if (ev.key === "Enter" && field !== "body" && field !== "extra") { ev.preventDefault(); target.blur(); }
    };
    target.addEventListener("blur", commit);
    target.addEventListener("keydown", onKey);
    target.addEventListener("click", stop);
  };

  const pickPart = (sectionId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).isContentEditable) return;
    const el = (e.target as HTMLElement).closest?.("[data-part]") as HTMLElement | null;
    if ((e.target as HTMLElement).closest?.("a")) e.preventDefault();
    setActiveId(sectionId);
    setOpenBlocks({});
    if (!el) { setFocusPart(""); return; }

    const part = el.getAttribute("data-part") ?? "";
    // captions and image text boxes are edited alongside their image
    setFocusPart(
      part.startsWith("caption:") ? part.replace("caption:", "image:")
      : part.startsWith("imagetext:") ? `image:${part.split(":")[1]}`
      : part,
    );

    // Settings live in the side panel only — no floating toolbar on click.
    setToolbar(null);
  };


  const load = async () => {
    const { data } = await (supabase as any)
      .from("object_registry")
      .select("id,slug_id,name,status,component_key,content,updated_at")
      .is("archived_at", null)
      .order("name", { ascending: true });
    setObjects((data ?? []) as ObjectRow[]);
    return (data ?? []) as ObjectRow[];
  };

  useEffect(() => { load(); }, []);

  const object = useMemo(
    () => objects.find((o) => o.id === selectedId) ?? null,
    [objects, selectedId],
  );

  const codedKey = object?.component_key && objectRegistry[object.component_key] ? object.component_key : null;

  useEffect(() => {
    const parsed = parseSections(object?.content);
    if (parsed.length) {
      setSections(parsed);
      setActiveId("");
      setPreview(true);
    } else if (object?.component_key && objectRegistry[object.component_key]) {
      // Built in code: show it as it is today until the user makes it editable.
      setSections([]);
      setActiveId("");
      setPreview(true);
    } else {
      // Nothing designed yet: open straight into an editable block.
      const s = makeSection("free");
      setSections([s]);
      setActiveId(s.id);
      setPreview(false);
    }
    setImporting(false);
    setDirty(false);
  }, [object?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? objects.filter((o) => `${o.name} ${o.slug_id}`.toLowerCase().includes(term)) : objects;
  }, [objects, q]);

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("object", id);
    setParams(next, { replace: true });
  };

  // keep an editing panel expanded while its content is being changed
  const keepBlockOpen = (key?: string) => {
    if (!key) return;
    setOpenBlocks((b) => (b[key] ? b : { ...b, [key]: true }));
  };

  const BLOCK_FOR_FIELD: Record<string, string> = {
    eyebrow: "eyebrow",
    eyebrowStyle: "eyebrow",
    heading: "heading",
    textStyle: "heading",
    body: "body",
    bodyStyle: "body",
    buttonLabel: "button",
    buttonHref: "button",
    buttonStyle: "button",
    buttonBg: "button",
    labelStyle: "button",
    images: "images",
    videos: "videos",
  };

  const patch = (id: string, changes: Record<string, unknown>) => {
    for (const k of Object.keys(changes)) {
      const blockKey = BLOCK_FOR_FIELD[k];
      if (blockKey) keepBlockOpen(blockKey);
    }
    setSections((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...changes } as Section) : s)));
    setDirty(true);
  };

  /** Set an image grid's exact height/width from a canvas drag handle. */
  /** Store the width/height a text box was dragged to. */
  const resizeTextPart = (
    id: string,
    part: string,
    size: { width?: number; height?: number },
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const key = canvasPartKey(s, part) ?? part;
        const sizesW = { ...(s.sizesW ?? {}) };
        const sizesH = { ...(s.sizesH ?? {}) };
        if (size.width !== undefined) sizesW[key] = Math.round(size.width);
        if (size.height !== undefined) sizesH[key] = Math.round(size.height);
        return { ...s, sizesW, sizesH };
      }),
    );
    setDirty(true);
  };

  const resizeImageGroup = (
    id: string,
    groupKey: number,
    size: { imageHeightPx?: number; imageWidthPx?: number },
    info?: { part: string; widthPct?: number },
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const own = s.groupSettings?.[String(groupKey)] ?? {};
        const next = { ...size };
        let flowWidths = s.flowWidths;
        // An image sharing a row is sized by percentage so its neighbours shrink or grow with it.
        const key = info ? canvasPartKey(s, info.part) : null;
        if (key && info?.widthPct != null && s.flows?.[key] === "inline") {
          const parts = orderablePartsOf(s).filter((p) => (s.flows ?? {})[p] === "inline" || p === key);
          const order = orderablePartsOf(s);
          const at = order.indexOf(key);
          let start = at;
          while (start > 0 && s.flows?.[order[start - 1]] === "inline") start--;
          let end = at;
          while (end < order.length - 1 && s.flows?.[order[end + 1]] === "inline") end++;
          const row = order.slice(start, end + 1).filter((p) => parts.includes(p));
          const others = row.filter((p) => p !== key && s.stacks?.[p] !== s.stacks?.[key]);
          if (others.length) {
            const mine = Math.max(10, Math.min(90, Math.round(info.widthPct)));
            const prevOthers = others.map((p) => s.flowWidths?.[p] ?? (100 - mine) / others.length);
            const total = prevOthers.reduce((a, b) => a + b, 0) || 1;
            const widths = { ...(s.flowWidths ?? {}) };
            widths[key] = mine;
            const sameCol = row.filter((p) => p !== key && s.stacks?.[p] && s.stacks[p] === s.stacks?.[key]);
            sameCol.forEach((p) => { widths[p] = mine; });
            others.forEach((p, i) => { widths[p] = Math.max(5, Math.round(((100 - mine) * prevOthers[i]) / total)); });
            flowWidths = widths;
            delete next.imageWidthPx;
          }
        }
        return {
          ...s,
          ...(flowWidths ? { flowWidths } : {}),
          groupSettings: { ...(s.groupSettings ?? {}), [String(groupKey)]: { ...own, ...next } },
        } as Section;
      }),
    );
    setDirty(true);
  };



  const patchExtra = (id: string, index: number, changes: { text?: string; style?: TextStyle; kind?: FreeTextKind; iconLabel?: string; iconLabelSide?: "before" | "after" | "above" | "below"; iconLabelAlign?: SectionAlign; icon?: string; iconSide?: "before" | "after" | "above" | "below" }) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const extras = (s.extras ?? []).map((t, i) => (i === index ? { ...t, ...changes } : t));
        keepBlockOpen(extras[index]?.id);
        return { ...s, extras } as Section;
      }),
    );
    setDirty(true);
  };

  const removeExtra = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id && s.type === "free"
          ? ({ ...s, extras: (s.extras ?? []).filter((_, i) => i !== index) } as Section)
          : s,
      ),
    );
    setDirty(true);
  };

  const patchDivider = (id: string, index: number, changes: Partial<FreeDivider>) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const dividers = (s.dividers ?? []).map((d, i) => (i === index ? { ...d, ...changes } : d));
        keepBlockOpen(dividers[index]?.id);
        return { ...s, dividers } as Section;
      }),
    );
    setDirty(true);
  };

  const removeDivider = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id && s.type === "free"
          ? ({ ...s, dividers: (s.dividers ?? []).filter((_, i) => i !== index) } as Section)
          : s,
      ),
    );
    setDirty(true);
  };

  const patchImage = (id: string, index: number, changes: Partial<SectionImage>) => {
    // keep this image's editor expanded while it is being edited
    setOpenSub((s) => (s[`img:${id}:${index}`] ? s : { ...s, [`img:${id}:${index}`]: true }));
    setOpenBlocks((b) => (b.images ? b : { ...b, images: true }));
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (index < 0 && "image" in s) {
          return { ...s, image: { ...(s as any).image, ...changes } } as Section;
        }
        if ("images" in s) {
          const images = (s as any).images.map((img: SectionImage, i: number) =>
            i === index ? { ...img, ...changes } : img,
          );
          return { ...s, images } as Section;
        }
        return s;
      }),
    );
    setDirty(true);
  };

  const imageTextsOf = (sectionId: string, index: number): ImageText[] => {
    const s = sections.find((x) => x.id === sectionId);
    if (!s || !("images" in s)) return [];
    return ((s as any).images[index]?.texts ?? []) as ImageText[];
  };

  // Opening a newly added element collapses every other panel.
  const openBlock = (key: string, part = "") => {
    setBlocksExpanded(false);
    setFocusPart(part);
    setOpenBlocks({ [key]: true });
  };


  const addImageText = (sectionId: string, index: number, kind: ImageTextKind) => {
    const texts = imageTextsOf(sectionId, index);
    patchImage(sectionId, index, {
      texts: [...texts, { id: newSectionId(), kind, text: "" }],
    });
    // keep the image's own panel open when a text or other element is added to it
    openBlock("images", `image:${index}`);
    setOpenSub((s) => ({
      ...s,
      [`img:${sectionId}:${index}`]: true,
      [`txt:${sectionId}:${index}:${texts.length}`]: true,
    }));
  };

  const patchImageText = (
    sectionId: string, index: number, tIdx: number, changes: Partial<ImageText>,
  ) => {
    const texts = imageTextsOf(sectionId, index).map((t, i) => (i === tIdx ? { ...t, ...changes } : t));
    // keep this text box expanded while it is being edited
    setOpenSub((s) =>
      s[`txt:${sectionId}:${index}:${tIdx}`] ? s : { ...s, [`txt:${sectionId}:${index}:${tIdx}`]: true },
    );
    patchImage(sectionId, index, { texts });
  };

  /** Move an image's text box to a new spot in the list. */
  const moveImageText = (sectionId: string, index: number, from: number, to: number) => {
    const texts = [...imageTextsOf(sectionId, index)];
    if (from === to || from < 0 || from >= texts.length) return;
    const [moved] = texts.splice(from, 1);
    const dest = Math.max(0, Math.min(texts.length, from < to ? to - 1 : to));
    texts.splice(dest, 0, moved);
    patchImage(sectionId, index, { texts });
  };

  const removeImageText = (sectionId: string, index: number, tIdx: number) => {
    patchImage(sectionId, index, { texts: imageTextsOf(sectionId, index).filter((_, i) => i !== tIdx) });
  };

  const addImageSlot = (id: string, group?: number) => {
    let newIndex = 0;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id && "images" in s) {
          const images = [...(s as any).images, { url: "", alt: "", group }];
          newIndex = images.length - 1;
          return { ...s, images } as Section;
        }
        return s;
      }),
    );
    setDirty(true);
    openBlock("images", `image:${newIndex}`);

    setOpenSub((s) => ({ ...s, [`img:${id}:${newIndex}`]: true }));
    setPicker({ sectionId: id, index: newIndex });
  };


  const removeImageSlot = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || !("images" in s)) return s;
        const images = ((s as any).images ?? []) as SectionImage[];
        // Removing the last image clears the image area but keeps the block.
        return { ...s, images: images.filter((_, i) => i !== index) } as Section;
      }),
    );
    setDirty(true);
  };


  /** Insert a copy of item at `index` right after it. */
  const insertCopy = <T,>(list: T[], index: number, copy: T): T[] => {
    const next = [...list];
    next.splice(index + 1, 0, copy);
    return next;
  };

  const duplicateImageSlot = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || !("images" in s)) return s;
        const images = (s as any).images as SectionImage[];
        const src = images[index];
        if (!src) return s;
        const copy: SectionImage = {
          ...src,
          texts: (src.texts ?? []).map((t) => ({ ...t, id: newSectionId(), style: { ...(t.style ?? {}) } })),
        };
        return { ...s, images: insertCopy(images, index, copy) } as Section;
      }),
    );
    setDirty(true);
    openBlock("images", `image:${index + 1}`);
    setOpenSub((s) => ({ ...s, [`img:${id}:${index + 1}`]: true }));
  };

  const duplicateImageText = (sectionId: string, index: number, tIdx: number) => {
    const texts = imageTextsOf(sectionId, index);
    const src = texts[tIdx];
    if (!src) return;
    patchImage(sectionId, index, {
      texts: insertCopy(texts, tIdx, { ...src, id: newSectionId(), style: { ...(src.style ?? {}) } }),
    });
    setOpenSub((s) => ({ ...s, [`txt:${sectionId}:${index}:${tIdx + 1}`]: true }));
  };

  const duplicateExtra = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const extras = s.extras ?? [];
        const src = extras[index];
        if (!src) return s;
        return {
          ...s,
          extras: insertCopy(extras, index, { ...src, id: newSectionId(), style: { ...(src.style ?? {}) } }),
        } as Section;
      }),
    );
    setDirty(true);
  };

  const duplicateDivider = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const dividers = s.dividers ?? [];
        const src = dividers[index];
        if (!src) return s;
        return { ...s, dividers: insertCopy(dividers, index, { ...src, id: newSectionId() }) } as Section;
      }),
    );
    setDirty(true);
  };

  /** Copy a single text element into a new paragraph, keeping its styling. */
  const duplicateTextInto = (section: FreeSection, text: string | undefined, style?: TextStyle) => {
    patch(section.id, {
      extras: [...(section.extras ?? []), { id: newSectionId(), text: text ?? "", style: { ...(style ?? {}) } }],
    });
  };

  const videosOf = (sectionId: string): SectionVideo[] => {
    const s = sections.find((x) => x.id === sectionId);
    return s && s.type === "free" ? (s.videos ?? []) : [];
  };

  const addVideoSlot = (id: string) => {
    let newIndex = 0;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id && s.type === "free") {
          const videos = [...(s.videos ?? []), { id: newSectionId(), url: "" } as SectionVideo];
          newIndex = videos.length - 1;
          return { ...s, videos } as Section;
        }
        return s;
      }),
    );
    setDirty(true);
    openBlock("Videos", "videos");
    setVideoPicker({ sectionId: id, index: newIndex });
  };

  type AddKind = "eyebrow" | "title" | "text" | "icon" | "image" | "video" | "divider" | "button";

  /** Add an element to a section (defaults to the active or last free section). */
  const addElement = (kind: AddKind, sectionId?: string) => {
    const target =
      (sectionId ? sections.find((s) => s.id === sectionId) : undefined) ??
      sections.find((s) => s.id === activeId) ??
      [...sections].reverse().find((s) => s.type === "free");
    if (!target || target.type !== "free") return;
    const s = target as FreeSection;
    if (s.id !== activeId) setActiveId(s.id);
    if (kind === "image") {
      // Each press of the rail's Image button starts a new grid in this block.
      const next = s.images.length
        ? Math.max(...s.images.map((img) => img.group ?? 0)) + 1
        : 0;
      return addImageSlot(s.id, next);
    }
    if (kind === "video") return addVideoSlot(s.id);
    if (kind === "divider") {
      const id = newSectionId();
      const at = (s.dividers ?? []).length;
      patch(s.id, { dividers: [...(s.dividers ?? []), { id, color: "stone", width: "full", thickness: 1 }] });
      openBlock(id, `divider:${at}`);
      return;
    }
    if (kind === "button") {
      if (s.buttonLabel === undefined) patch(s.id, { buttonLabel: "Explore", buttonHref: "/" });
      openBlock("button", "button");
      return;
    }
    const nextExtra = (s.extras ?? []).length;
    if (kind === "eyebrow") {
      if (s.eyebrow === undefined) {
        patch(s.id, { eyebrow: "Since 1951" });
        openBlock("eyebrow", "eyebrow");
      } else {
        const id = newSectionId();
        patch(s.id, { extras: [...(s.extras ?? []), { id, text: "Since 1951", kind: "eyebrow" as const }] });
        openBlock(id, `text:${nextExtra}`);
      }
      return;
    }
    if (kind === "icon") {
      const id = newSectionId();
      patch(s.id, { extras: [...(s.extras ?? []), { id, text: "sparkles", kind: "icon" as const }] });
      openBlock(id, `text:${nextExtra}`);
      return;
    }
    if (kind === "title") {
      if (s.heading === undefined) {
        patch(s.id, { heading: "A quiet statement" });
        openBlock("heading", "heading");
      } else {
        const id = newSectionId();
        patch(s.id, { extras: [...(s.extras ?? []), { id, text: "A quiet statement", kind: "title" as const }] });
        openBlock(id, `text:${nextExtra}`);
      }
      return;
    }
    // Every added text is an extra so it always carries the style preset picker.
    const id = newSectionId();
    patch(s.id, { extras: [...(s.extras ?? []), { id, text: "New text", kind: "text" as const }] });
    openBlock(id, `text:${nextExtra}`);
  };


  const ADD_ITEMS: { kind: AddKind; label: string; icon: LucideIcon }[] = [
    { kind: "text", label: "Text", icon: AlignLeft },
    { kind: "image", label: "Image", icon: ImageIcon },
    { kind: "video", label: "Video", icon: VideoIcon },
    { kind: "divider", label: "Divider", icon: Minus },
    { kind: "button", label: "Button", icon: MousePointerClick },
  ];

  const patchVideo = (id: string, index: number, changes: Partial<SectionVideo>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id && s.type === "free"
          ? ({ ...s, videos: (s.videos ?? []).map((v, i) => (i === index ? { ...v, ...changes } : v)) } as Section)
          : s,
      ),
    );
    setDirty(true);
  };

  const removeVideo = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id && s.type === "free"
          ? ({ ...s, videos: (s.videos ?? []).filter((_, i) => i !== index) } as Section)
          : s,
      ),
    );
    setDirty(true);
  };

  /** Switching to edit always leaves a block ready to work on. */
  const enterEdit = () => {
    setPreview(false);
    setLibraryOpen(false);
    if (!sections.length && codedKey) {
      setImporting(true);
      return;
    }
    setSections((prev) => {
      if (prev.length) {
        setActiveId((cur) => (cur && prev.some((s) => s.id === cur) ? cur : prev[0].id));
        return prev;
      }
      const s = makeSection("free");
      setActiveId(s.id);
      setDirty(true);
      return [s];
    });
  };


  const finishImport = (imported: Section[]) => {
    setImporting(false);
    const list = imported.length ? imported : [makeSection("free")];
    setSections(list);
    setActiveId(list[0].id);
    setDirty(true);
  };

  const add = (type: SectionType) => {
    const s = makeSection(type);
    setSections((prev) => [...prev, s]);
    setActiveId(s.id);
    setPreview(false);
    setDirty(true);
  };

  const move = (id: string, dir: -1 | 1) => {
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setDirty(true);
  };

  const remove = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setDirty(true);
  };

  const duplicateVideo = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const videos = s.videos ?? [];
        const src = videos[index];
        if (!src) return s;
        return { ...s, videos: insertCopy(videos, index, { ...src, id: newSectionId() }) } as Section;
      }),
    );
    setDirty(true);
  };

  /** Deep copy a whole block, giving every nested item a fresh id. */
  const duplicateSection = (id: string) => {
    let copyId = "";
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i < 0) return prev;
      const src = prev[i];
      const clone = JSON.parse(JSON.stringify(src)) as Section;
      clone.id = newSectionId();
      copyId = clone.id;
      if ("images" in clone && Array.isArray((clone as any).images)) {
        (clone as any).images = ((clone as any).images as SectionImage[]).map((img) => ({
          ...img,
          texts: (img.texts ?? []).map((t) => ({ ...t, id: newSectionId() })),
        }));
      }
      if (clone.type === "free") {
        clone.extras = (clone.extras ?? []).map((t) => ({ ...t, id: newSectionId() }));
        clone.dividers = (clone.dividers ?? []).map((d) => ({ ...d, id: newSectionId() }));
        clone.videos = (clone.videos ?? []).map((v) => ({ ...v, id: newSectionId() }));
      }
      return insertCopy(prev, i, clone);
    });
    setDirty(true);
    if (copyId) setActiveId(copyId);
  };

  const save = async () => {
    if (!object) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("object_registry")
        .update({ content: sections, updated_at: new Date().toISOString() })
        .eq("id", object.id);
      if (error) throw error;
      await load();
      setDirty(false);
      toast.success(`Saved — you can place "${object.name}" on any page.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save this object");
    } finally {
      setSaving(false);
    }
  };

  const ImageEditor = ({
    section, index, image, showCaption,
  }: { section: Section; index: number; image: SectionImage; showCaption?: boolean }) => {
    const imgKey = `img:${section.id}:${index}`;
    const imgFocused =
      focusPart === `image:${index}` ||
      focusPart === `caption:${index}` ||
      focusPart.startsWith(`imagetext:${index}:`);
    const imgOpen = openSub[imgKey] ?? imgFocused;
    const label = image.alt?.trim() || (image.url ? image.url.split("/").pop() : "No image selected");

    return (
    <div className="rounded-md border p-3 space-y-2 bg-background">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpenSub((s) => ({ ...s, [imgKey]: !imgOpen }))}
        >
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
            {image.url ? (
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <span className="min-w-0 flex-1 truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${imgOpen ? "rotate-180" : ""}`} />
        </button>
        {index >= 0 && "images" in section && (
          <Button
            variant="ghost"
            size="sm"
            title="Duplicate image and its text"
            onClick={() => duplicateImageSlot(section.id, index)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
        {index >= 0 && "images" in section && (
          <Button
            variant="ghost"
            size="sm"
            title="Delete image"

            onClick={() => removeImageSlot(section.id, index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      {imgOpen && (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPicker({ sectionId: section.id, index })}
            >
              {image.url ? "Replace" : "Choose image"}
            </Button>
            <Button
              variant={image.href || linkOpen[`${section.id}:${index}`] ? "secondary" : "ghost"}
              size="sm"
              title={image.href ? "Edit link" : "Add link"}
              onClick={() =>
                setLinkOpen((s) => ({ ...s, [`${section.id}:${index}`]: !s[`${section.id}:${index}`] }))
              }
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
          {(linkOpen[`${section.id}:${index}`] || image.href) && (
            <Input
              value={image.href ?? ""}
              placeholder="Link (optional)"
              onChange={(e) => patchImage(section.id, index, { href: e.target.value })}
            />
          )}
          <Field label="Zoom in (%)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={100}
                max={400}
                step={5}
                className="h-9 flex-1 accent-primary"
                value={imageZoom(image.zoom)}
                onChange={(e) => patchImage(section.id, index, { zoom: Number(e.target.value) })}
              />
              <Input
                type="number"
                min={100}
                max={400}
                className="h-9 w-20"
                value={imageZoom(image.zoom)}
                onChange={(e) => patchImage(section.id, index, { zoom: imageZoom(Number(e.target.value)) })}
              />
            </div>
          </Field>
          <Field label="Keep in view when cropped">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={image.focus ?? "center"}
              onChange={(e) => patchImage(section.id, index, { focus: e.target.value })}
            >
              {IMAGE_FOCUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </>
      )}
      {showCaption && imgOpen && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {IMAGE_TEXT_KINDS.filter((k) => !["eyebrow", "title", "subheading"].includes(k.value)).map((k) => {
              const Icon = IMAGE_TEXT_ICONS[k.value];
              return (
                <Button
                  key={k.value}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title={`Add ${k.label}`}
                  aria-label={`Add ${k.label}`}
                  onClick={() => addImageText(section.id, index, k.value)}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
          {(image.texts ?? []).map((t, ti) => {
            const tKey = `txt:${section.id}:${index}:${ti}`;
            const tOpen = openSub[tKey] ?? focusPart === `imagetext:${index}:${ti}`;
            const kindLabel = IMAGE_TEXT_KINDS.find((k) => k.value === t.kind)?.label ?? "Text";
            const isDragging = dragText?.sectionId === section.id && dragText.index === index && dragText.ti === ti;
            const dropHere =
              !isDragging && dropText?.sectionId === section.id && dropText.index === index && dropText.ti === ti
                ? dropText.before ? "before" : "after"
                : null;
            const bar = <div className="h-0.5 rounded-full bg-primary" />;
            return (
            <div key={t.id} className="space-y-1">
            {dropHere === "before" && bar}
            <div
              onDragOver={(e) => {
                if (!dragText || dragText.sectionId !== section.id || dragText.index !== index) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                const before = e.clientY < r.top + r.height / 2;
                setDropText({ sectionId: section.id, index, ti, before });
              }}
              onDrop={(e) => {
                if (!dragText || dragText.sectionId !== section.id || dragText.index !== index) return;
                e.preventDefault();
                const target = dropText?.before ? ti : ti + 1;
                moveImageText(section.id, index, dragText.ti, target);
                setDragText(null);
                setDropText(null);
              }}
              className={`space-y-2 ${isDragging ? "opacity-40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setDragText({ sectionId: section.id, index, ti });
                  }}
                  onDragEnd={() => { setDragText(null); setDropText(null); }}
                  title="Drag to reorder"
                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4" />
                </span>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setOpenSub((s) => ({ ...s, [tKey]: !tOpen }))}
                >
                  <span className="text-xs font-medium">{kindLabel}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {t.text?.replace(/<[^>]*>/g, "") || "Empty"}
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${tOpen ? "rotate-180" : ""}`} />
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Duplicate text"
                  onClick={() => duplicateImageText(section.id, index, ti)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImageText(section.id, index, ti)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {tOpen && (
                <>
                  <Choice
                    value={t.align ?? image.captionAlign ?? (section as any).captionAlign ?? "left"}
                    options={[
                      { value: "left" as const, label: "Left", icon: AlignLeft },
                      { value: "center" as const, label: "Center", icon: AlignCenter },
                      { value: "right" as const, label: "Right", icon: AlignRight },
                    ]}
                    hideLabels
                    onChange={(v) => patchImageText(section.id, index, ti, { align: v })}
                  />
                  <IconSelect
                    value={t.kind}
                    options={IMAGE_TEXT_KINDS.filter((k) => k.value !== "subheading" || t.kind === "subheading").map((k) => ({ value: k.value, label: k.label }))}
                    onChange={(v) => patchImageText(section.id, index, ti, { kind: v, style: undefined })}
                  />
                  {t.kind === "divider" ? (
                    <>
                      <ColorDropdown
                        label="Color"
                        value={t.divider?.color ?? ""}
                        fallback="stone"
                        options={TEXT_COLORS}
                        onChange={(v) =>
                          patchImageText(section.id, index, ti, {
                            divider: { ...(t.divider ?? {}), color: v as TextColor },
                          })
                        }
                      />
                      <Field label="Width">
                        <div>
                          <Choice
                            value={typeof t.divider?.widthPct === "number" ? "percent" : (t.divider?.width ?? "full")}
                            options={[
                              { value: "full" as const, label: "Full width", icon: Minus },
                              { value: "short" as const, label: "Short", icon: Minus },
                              { value: "percent" as const, label: "Percent", icon: Minus },
                            ]}
                            onChange={(v) =>
                              patchImageText(section.id, index, ti, {
                                divider: v === "percent"
                                  ? { ...(t.divider ?? {}), widthPct: t.divider?.widthPct ?? 50 }
                                  : { ...(t.divider ?? {}), width: v as "full" | "short", widthPct: undefined },
                              })
                            }
                          />
                        </div>
                      </Field>
                      {typeof t.divider?.widthPct === "number" && (
                        <Field label="Width (% of full width)">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={t.divider.widthPct}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const pct = raw === "" ? 1 : Math.min(100, Math.max(1, Number(raw) || 1));
                              patchImageText(section.id, index, ti, {
                                divider: { ...(t.divider ?? {}), widthPct: pct },
                              });
                            }}
                          />
                        </Field>
                      )}
                      <Field label="Thickness (px)">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={t.divider?.thickness ?? 1}
                          onChange={(e) =>
                            patchImageText(section.id, index, ti, {
                              divider: {
                                ...(t.divider ?? {}),
                                thickness: Math.min(12, Math.max(1, Number(e.target.value) || 1)),
                              },
                            })
                          }
                        />
                      </Field>
                    </>

                  ) : t.kind === "button" ? (
                    <>
                      <Field label="Label">
                        <Input
                          value={t.text}
                          placeholder="Button label"
                          onChange={(e) => patchImageText(section.id, index, ti, { text: e.target.value })}
                        />
                      </Field>
                      <Field label="Link (optional)">
                        <Input
                          value={t.button?.href ?? ""}
                          placeholder="Link (optional)"
                          onChange={(e) =>
                            patchImageText(section.id, index, ti, {
                              button: { ...(t.button ?? {}), href: e.target.value },
                            })
                          }
                        />
                      </Field>
                      <Field label="Style">
                        <IconSelect
                          value={t.button?.variant ?? "solid"}
                          options={BUTTON_STYLE_OPTIONS}
                          onChange={(v) =>
                            patchImageText(section.id, index, ti, {
                              button: { ...(t.button ?? {}), variant: v as "solid" | "outline" | "link" },
                            })
                          }
                        />
                      </Field>
                      <ButtonIconField
                        icon={t.button?.icon}
                        side={t.button?.iconSide}
                        onChange={(n) =>
                          patchImageText(section.id, index, ti, {
                            button: { ...(t.button ?? {}), icon: n.icon, iconSide: n.iconSide },
                          })
                        }
                      />
                      {(t.button?.variant ?? "solid") === "solid" && (
                        <ColorDropdown
                          label="Fill"
                          value={t.button?.bg ?? ""}
                          fallback="ink"
                          options={TEXT_COLORS}
                          onChange={(v) =>
                            patchImageText(section.id, index, ti, {
                              button: { ...(t.button ?? {}), bg: v as TextColor },
                            })
                          }
                        />
                      )}
                      <TextStyleFields
                        label="Label style"
                        value={t.style}
                        defaults={{
                          font: IMAGE_TEXT_DEFAULTS.button.font,
                          color: (t.button?.variant ?? "solid") === "solid" ? "cream" : "ink",
                          size: IMAGE_TEXT_DEFAULTS.button.size,
                        }}
                        onChange={(v) => patchImageText(section.id, index, ti, { style: v })}
                      />
                    </>
                  ) : t.kind === "icon" ? (
                    <>
                      <IconPicker
                        value={t.text}
                        style={t.style}
                        onPick={(name) => patchImageText(section.id, index, ti, { text: name })}
                        onStyle={(v) => patchImageText(section.id, index, ti, { style: v })}
                      />
                      <Field label="Text">
                        <Input
                          value={t.iconLabel ?? ""}
                          placeholder="Optional text with this icon"
                          onChange={(e) => patchImageText(section.id, index, ti, { iconLabel: e.target.value })}
                        />
                      </Field>
                      <Field label="Text sits">
                        <Choice
                          value={t.iconLabelSide ?? "after"}
                          options={ICON_LABEL_SIDES}
                          hideLabels
                          onChange={(v) => patchImageText(section.id, index, ti, { iconLabelSide: v })}
                        />
                      </Field>
                      {(t.iconLabelSide === "above" || t.iconLabelSide === "below") && (
                        <Field label="Text lines up">
                          <Choice
                            value={t.iconLabelAlign ?? "center"}
                            options={[
                              { value: "left" as const, label: "Left", icon: AlignLeft },
                              { value: "center" as const, label: "Center", icon: AlignCenter },
                              { value: "right" as const, label: "Right", icon: AlignRight },
                            ]}
                            hideLabels
                            onChange={(v) => patchImageText(section.id, index, ti, { iconLabelAlign: v })}
                          />
                        </Field>
                      )}
                      <TextStyleFields
                        label="Symbol color"
                        value={t.style}
                        defaults={{
                          font: IMAGE_TEXT_DEFAULTS.icon.font,
                          color: IMAGE_TEXT_DEFAULTS.icon.color,
                          size: IMAGE_TEXT_DEFAULTS.icon.size,
                        }}
                        onChange={(v) => patchImageText(section.id, index, ti, { style: v })}
                        colorOnly
                      />
                    </>
                  ) : (
                    <>
                      <Textarea
                        rows={2}
                        value={t.text}
                        placeholder={`${kindLabel}…`}
                        onChange={(e) => patchImageText(section.id, index, ti, { text: e.target.value })}
                      />
                      <TextIconField
                        icon={t.icon}
                        side={t.iconSide}
                        onChange={(n) => patchImageText(section.id, index, ti, { icon: n.icon, iconSide: n.iconSide })}
                      />
                      <TextStyleFields
                        label="Style"
                        value={t.style}
                        defaults={{
                          font: IMAGE_TEXT_DEFAULTS[t.kind].font,
                          color: IMAGE_TEXT_DEFAULTS[t.kind].color,
                          size: IMAGE_TEXT_DEFAULTS[t.kind].size,
                        }}
                        onChange={(v) => patchImageText(section.id, index, ti, { style: v })}
                      />
                    </>
                  )}
                  <Field label="Spacing">
                    <div className="flex items-center gap-3">
                      {([
                        { key: "padY" as const, label: "Space above and below (px)", short: "V" },
                        { key: "padX" as const, label: "Space left and right (px)", short: "H" },
                      ]).map((o) => (
                        <label key={o.key} className="flex items-center gap-1 text-xs text-muted-foreground" title={o.label}>
                          {o.short}
                          <Input
                            type="number"
                            min={-240}
                            max={240}
                            className="h-8 w-16"
                            placeholder="0"
                            aria-label={o.label}
                            value={t[o.key] ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                patchImageText(section.id, index, ti, { [o.key]: undefined } as Partial<ImageText>);
                                return;
                              }
                              const n = Number(raw);
                              if (Number.isNaN(n)) return;
                              patchImageText(section.id, index, ti, {
                                [o.key]: Math.min(240, Math.max(-240, n)),
                              } as Partial<ImageText>);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  </Field>
                </>
              )}
            </div>
            {dropHere === "after" && bar}
            </div>
            );
          })}
        </div>
      )}
    </div>
    );
  };

  const Chip = ({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) => (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={onClick}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </Button>
  );

  /** Inline / separate control for one element inside a block. */
  /** Put an item into a shared box, and style that box. */
  const flowField = (section: FreeSection, part: string) => {
    const flow = (section.flows?.[part] ?? "separate") as SectionFlow;
    return (
      <div className="rounded-md border p-3 space-y-3">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Alignment</span>
          <Choice
            value={(section.flowAligns?.[part] ?? section.align) as SectionAlign}
            options={[
              { value: "left" as SectionAlign, label: "Left", icon: AlignLeft },
              { value: "center" as SectionAlign, label: "Center", icon: AlignCenter },
              { value: "right" as SectionAlign, label: "Right", icon: AlignRight },
            ]}
            hideLabels
            onChange={(v) => patch(section.id, { flowAligns: { ...(section.flowAligns ?? {}), [part]: v } })}
          />
          </div>
          <div className="flex flex-col gap-1 self-end">
          <Choice
            value={(section.flowVAligns?.[part] ?? "top") as PartVAlign}
            options={[
              { value: "top" as PartVAlign, label: "Top", icon: AlignStartHorizontal },
              { value: "middle" as PartVAlign, label: "Middle", icon: AlignCenterHorizontal },
              { value: "bottom" as PartVAlign, label: "Bottom", icon: AlignEndHorizontal },
            ]}
            hideLabels
            onChange={(v) => patch(section.id, { flowVAligns: { ...(section.flowVAligns ?? {}), [part]: v } })}
          />
          </div>
        </div>
        <div className="flex flex-col items-start gap-1">

          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Stacking</span>
          <Choice
            value={flow}
            options={[
              { value: "separate" as SectionFlow, label: "Vertical", icon: Rows2 },
              { value: "inline" as SectionFlow, label: "Horizontal", icon: Columns2 },
            ]}
            onChange={(v) => patch(section.id, { flows: { ...(section.flows ?? {}), [part]: v } })}
          />
          {flow === "inline" && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Width
              <Input
                type="number"
                min={1}
                max={100}
                className="h-8 w-20"
                placeholder="Auto"
                value={section.flowWidths?.[part] ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = { ...(section.flowWidths ?? {}) };
                  if (raw === "") delete next[part];
                  else {
                    const n = Number(raw);
                    if (Number.isNaN(n)) return;
                    next[part] = Math.min(100, Math.max(0, n));
                  }
                  patch(section.id, { flowWidths: next });
                }}
              />
              %
            </label>
          )}
          </div>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Rotation</span>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={-180}
              max={180}
              step={1}
              className="h-8 w-20"
              placeholder="0"
              aria-label="Rotation in degrees"
              value={section.rotations?.[part] ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                const next = { ...(section.rotations ?? {}) };
                if (raw === "") delete next[part];
                else {
                  const n = Number(raw);
                  if (Number.isNaN(n)) return;
                  next[part] = Math.min(180, Math.max(-180, n));
                }
                patch(section.id, { rotations: next } as Partial<Section>);
              }}
            />
            <span className="text-xs text-muted-foreground">degrees</span>
          </div>
          </div>
          <div className="flex flex-col gap-1">

          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Margins</span>
          <div className="flex flex-wrap items-center gap-2">
          {([
            { key: "padsY" as const, label: "Space above and below (px)", short: "V" },
            { key: "padsX" as const, label: "Space left and right (px)", short: "H" },
          ]).map((o) => (
            <label key={o.key} className="flex items-center gap-1 text-xs text-muted-foreground" title={o.label}>
              {o.short}
              <Input
                type="number"
                min={-240}
                max={240}
                className="h-8 w-16"
                placeholder="0"
                aria-label={o.label}
                value={section[o.key]?.[part] ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = { ...(section[o.key] ?? {}) };
                  if (raw === "") delete next[part];
                  else {
                    const n = Number(raw);
                    if (Number.isNaN(n)) return;
                    next[part] = Math.min(240, Math.max(-240, n));
                  }
                  patch(section.id, { [o.key]: next } as Partial<Section>);
                }}
              />
            </label>
          ))}
          </div>
          </div>
        </div>
      </div>
    );

  };

  /** Parts of a free section that can be reordered, in their current order. */
  const orderablePartsOf = (s: FreeSection) => {
    const base: string[] = [];
    if (s.eyebrow !== undefined) base.push("eyebrow");
    if (s.heading !== undefined) base.push("heading");
    if (s.body !== undefined) base.push("body");
    (s.extras ?? []).forEach((_, i) => base.push(`text:${i}`));
    for (const g of imageGroups(s.images)) base.push(imageGroupPart(g.key));
    if ((s.videos ?? []).length) base.push("videos");
    if (s.buttonLabel !== undefined) base.push("button");
    (s.dividers ?? []).forEach((_, i) => base.push(`divider:${i}`));
    return orderParts(base.map((p) => ({ part: p })), s.order).map((x) => x.part);
  };

  /** Friendly name of whichever item is being edited, used as the panel title. */
  const partTypeLabel = (s: Section, part: string) => {
    if (!part) return SECTION_LABEL[s.type] ?? "Block";
    if (part.startsWith("imagetext:")) return "Image text";
    if (part.startsWith("caption:")) return "Caption";
    if (part.startsWith("image")) return "Image";
    if (part.startsWith("video")) return "Video";
    if (part.startsWith("divider")) return "Divider";
    if (part === "button") return "Button";
    if (part === "eyebrow") return "Eyebrow";
    if (part === "heading") return "Title";
    if (part === "body" || part.startsWith("text:")) return "Text";
    return "Item";
  };

  /** Map an element's data-part in the preview to the item name used for ordering. */
  const canvasPartKey = (s: FreeSection, raw: string): string | null => {
    if (!raw) return null;
    const img = /^(?:image|caption|imagetext):(\d+)/.exec(raw);
    if (img) {
      const image = s.images[Number(img[1])];
      return image ? imageGroupPart(image.group ?? 0) : null;
    }
    return raw;
  };


  /** Names of the items attached to pictures, so they can be dragged in the preview too. */
  const imageTextPartsOf = (s: FreeSection) => {
    const parts: string[] = [];
    s.images.forEach((im, i) => (im.texts ?? []).forEach((_, ti) => parts.push(`imagetext:${i}:${ti}`)));
    return parts;
  };

  /** Move an item attached to a picture, either within that picture or onto another one. */
  const moveImageTextIn = (s: FreeSection, from: string, to: string, before: boolean) => {
    const f = /^imagetext:(\d+):(\d+)$/.exec(from);
    const t = /^imagetext:(\d+):(\d+)$/.exec(to);
    if (!f || !t || from === to) return;
    const [si, sti, di, dti] = [Number(f[1]), Number(f[2]), Number(t[1]), Number(t[2])];
    const images = s.images.map((im) => ({ ...im, texts: [...(im.texts ?? [])] }));
    const item = images[si]?.texts?.[sti];
    if (!item) return;
    images[si].texts.splice(sti, 1);
    let at = dti + (before ? 0 : 1);
    if (si === di && sti < at) at -= 1;
    images[di].texts.splice(at, 0, item);
    patch(s.id, { images });
  };

  const movePartIn = (s: FreeSection, from: string, to: string, before = true, side = false) => {
    if (from === to) return;
    if (from.startsWith("imagetext:") || to.startsWith("imagetext:")) {
      moveImageTextIn(s, from, to, before);
      return;
    }
    const parts = orderablePartsOf(s);
    const next = parts.filter((p) => p !== from);
    const at = next.indexOf(to);
    if (at === -1) next.push(from);
    else next.splice(before ? at : at + 1, 0, from);
    // Dropped beside an item: sit the two side by side, each keeping its own width.
    const flows = { ...(s.flows ?? {}) };
    const flowWidths = { ...(s.flowWidths ?? {}) };
    const stacks = { ...(s.stacks ?? {}) };
    if (side) {
      flows[from] = "inline";
      flows[to] = "inline";
      delete stacks[from];
      delete flowWidths[from];
    } else if (flows[to] === "inline") {
      // Dropped above/below an item that shares a row: stack the two inside that column.
      const sid = stacks[to] ?? `stack-${to}`;
      stacks[to] = sid;
      stacks[from] = sid;
      flows[from] = "inline";
      delete flowWidths[from];
    } else {
      flows[from] = "separate";
      delete flowWidths[from];
      delete stacks[from];
    }
    patch(s.id, { order: next, flows, flowWidths, stacks });
  };


  const Block = ({
    title,
    icon: Icon,
    part,
    key,
    flowSection,
    onDelete,
    onDuplicate,
    children,
  }: { title: string; icon: LucideIcon; part?: string; key?: string; flowSection?: FreeSection; onDelete?: () => void; onDuplicate?: () => void; children: React.ReactNode }) => {
    const blockKey = key ?? part ?? title;
    const focused =
      !!focusPart &&
      (focusPart === part ||
        (title === "Images" && (focusPart.startsWith("image:") || focusPart.startsWith("caption:") || focusPart.startsWith("imagetext:"))) ||
        (title === "Videos" && focusPart.startsWith("video:")));
    void blockKey;
    void focused;
    void Icon;
    return (
      <div key={key} data-inspector-part={part} className="relative scroll-mt-24">
        {onDuplicate || onDelete ? (
          <div className="flex items-center justify-end gap-1 pb-1">
            {onDuplicate ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Duplicate ${title}`}
                title={`Duplicate ${title}`}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete ${title}`}
                title={`Delete ${title}`}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-3">
          {flowSection && part ? flowField(flowSection, part) : null}
          {children}
        </div>
      </div>
    );
  };


  const freeToolbar = (section: FreeSection) => {
    const parts = orderablePartsOf(section);
    return (
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex flex-wrap items-start gap-4 rounded-lg border bg-background p-2 shadow-sm">
            <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1">
            {([
              { value: "left" as SectionAlign, label: "Align left", icon: AlignLeft },
              { value: "center" as SectionAlign, label: "Align center", icon: AlignCenter },
              { value: "right" as SectionAlign, label: "Align right", icon: AlignRight },
            ]).map((o) => (
              <Button
                key={o.value}
                type="button"
                size="sm"
                variant={section.align === o.value ? "default" : "ghost"}
                aria-label={o.label}
                title={o.label}
                className="h-8 w-8 p-0"
                onClick={() => patch(section.id, { align: o.value })}
              >
                <o.icon className="h-4 w-4" />
              </Button>
            ))}
            {parts.length > 1 && (
              <>
                <span className="mx-1 h-5 w-px bg-border" />
                {([
                  { value: "top" as RowVAlign, label: "Same row: top", icon: AlignVerticalJustifyStart },
                  { value: "middle" as RowVAlign, label: "Same row: middle", icon: AlignVerticalJustifyCenter },
                  { value: "bottom" as RowVAlign, label: "Same row: bottom", icon: AlignVerticalJustifyEnd },
                  { value: "baseline" as RowVAlign, label: "Same row: text line", icon: Baseline },
                ]).map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    size="sm"
                    variant={(section.rowVAlign ?? "middle") === o.value ? "default" : "ghost"}
                    aria-label={o.label}
                    title={o.label}
                    className="h-8 w-8 p-0"
                    onClick={() => patch(section.id, { rowVAlign: o.value })}
                  >
                    <o.icon className="h-4 w-4" />
                  </Button>
                ))}
              </>
            )}
            <span className="mx-1 h-5 w-px bg-border" />
            {([
              { value: "separate" as SectionFlow, label: "Vertical", icon: Rows2 },
              { value: "inline" as SectionFlow, label: "Horizontal", icon: Columns2 },
            ]).map((o) => (
              <Button
                key={o.value}
                type="button"
                size="sm"
                variant={(section.flow ?? "separate") === o.value ? "default" : "ghost"}
                aria-label={o.label}
                title={o.label}
                className="h-8 w-8 p-0"
                onClick={() => patch(section.id, { flow: o.value } as Partial<Section>)}
              >
                <o.icon className="h-4 w-4" />
              </Button>
            ))}
            {section.flow === "inline" && (
              <label className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  className="h-8 w-20"
                  placeholder="Auto"
                  value={section.flowWidth ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      patch(section.id, { flowWidth: undefined } as Partial<Section>);
                      return;
                    }
                    const n = Number(raw);
                    if (Number.isNaN(n)) return;
                    patch(section.id, { flowWidth: Math.min(100, Math.max(0, n)) } as Partial<Section>);
                  }}
                />
                %
              </label>
            )}
            </div>
            </div>
            <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Margins</span>
            <div className="flex flex-wrap items-center gap-1">
            {([
              { key: "padY" as const, label: "Space above and below (px)", short: "V" },
              { key: "padX" as const, label: "Space left and right (px)", short: "H" },
            ]).map((o) => (
              <label key={o.key} className="ml-1 flex items-center gap-1 text-xs text-muted-foreground" title={o.label}>
                {o.short}
                <Input
                  type="number"
                  min={-240}
                  max={240}
                  className="h-8 w-16"
                  placeholder={o.key === "padY" ? "48" : "0"}
                  aria-label={o.label}
                  value={(section as { padY?: number; padX?: number })[o.key] ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      patch(section.id, { [o.key]: undefined } as Partial<Section>);
                      return;
                    }
                    const n = Number(raw);
                    if (Number.isNaN(n)) return;
                    patch(section.id, { [o.key]: Math.min(240, Math.max(-240, n)) } as Partial<Section>);
                  }}
                />
              </label>
            ))}
            </div>
            </div>
            <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Block styling</span>
            <div className="flex flex-wrap items-center gap-1">
            <ColorDropdown
              label="Background"
              value={(section as FreeSection).bg ?? ""}
              fallback=""
              options={BG_COLORS as { value: string; label: string; swatch: string }[]}
              onChange={(v) => patch(section.id, { bg: v || undefined } as Partial<Section>)}
            />
            <button
              type="button"
              className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs ${
                (section as FreeSection).bgImage ? "border-foreground/40 bg-muted" : "bg-background"
              }`}
              title="Background image"
              onClick={() => setBgPicker(section.id)}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Image
            </button>
            {(section as FreeSection).bgImage ? (
              <button
                type="button"
                className="h-7 rounded-md border bg-background px-2 text-xs"
                onClick={() => patch(section.id, { bgImage: undefined } as Partial<Section>)}
              >
                Clear image
              </button>
            ) : null}
            </div>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            {parts.length ? (
              <Chip
                label="Close item"
                icon={ChevronsDownUp}
                onClick={() => { setOpenBlocks({}); setFocusPart(""); }}
              />
            ) : null}
          </div>

        </div>
    );
  };

  const freeInspector = (section: FreeSection) => {
    const hasTitle = section.heading !== undefined;
    const hasEyebrow = section.eyebrow !== undefined;
    const hasBody = section.body !== undefined;
    const hasButton = section.buttonLabel !== undefined;

    // Only the item the user clicked in the preview gets a settings panel.
    const rawFocus = focusPart.startsWith("video:") ? "videos" : focusPart;
    const selected = rawFocus ? canvasPartKey(section, rawFocus) : null;
    const parts = orderablePartsOf(section).filter((p) => p === selected);


    const renderPart = (p: string): React.ReactNode => {
      if (p === "eyebrow") return hasEyebrow ? Block({ title: "Eyebrow", icon: Tag, part: "eyebrow", flowSection: section, onDelete: () => patch(section.id, { eyebrow: undefined }), onDuplicate: () => duplicateTextInto(section, section.eyebrow, withEyebrowDefaults(section.eyebrowStyle)), children: (
          <>


            <Field label="Eyebrow">
              <Input value={section.eyebrow ?? ""} onChange={(e) => patch(section.id, { eyebrow: e.target.value })} />
            </Field>
            <TextStyleFields
              label="Eyebrow style"
              value={withEyebrowDefaults(section.eyebrowStyle)}
              defaults={{ font: "sans", color: "stone", size: "sm" }}
              onChange={(v) => patch(section.id, { eyebrowStyle: v })}
            />
          </>
        ) }) : null;
      if (p === "heading") return hasTitle ? Block({ title: "Title", icon: Heading, part: "heading", flowSection: section, onDelete: () => patch(section.id, { heading: undefined }), onDuplicate: () => duplicateTextInto(section, section.heading, section.textStyle), children: (
          <>


            <Field label="Title">
              <Input value={section.heading ?? ""} onChange={(e) => patch(section.id, { heading: e.target.value })} />
            </Field>
            <TextStyleFields
              label="Title style"
              value={section.textStyle}
              defaults={{ font: "serif", color: "ink", size: "xl" }}
              onChange={(v) => patch(section.id, { textStyle: v })}
            />
          </>
        ) }) : null;
      if (p === "body") return hasBody ? Block({ title: "Text", icon: AlignLeft, part: "body", flowSection: section, onDelete: () => patch(section.id, { body: undefined }), onDuplicate: () => duplicateTextInto(section, section.body, section.bodyStyle), children: (
          <>


            <Field label="Text">
              <Textarea rows={4} value={section.body ?? ""} onChange={(e) => patch(section.id, { body: e.target.value })} />
            </Field>
            <TextStyleFields
              label="Text style"
              value={section.bodyStyle}
              defaults={{ font: "sans", color: "stone", size: "md" }}
              onChange={(v) => patch(section.id, { bodyStyle: v })}
            />
          </>
        ) }) : null;
      if (p === "button") return hasButton ? Block({ title: "Button", icon: MousePointerClick, part: "button", flowSection: section, onDelete: () => patch(section.id, { buttonLabel: undefined }), children: (
          <>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button label">
                <Input value={section.buttonLabel ?? ""} onChange={(e) => patch(section.id, { buttonLabel: e.target.value })} />
              </Field>
              <Field label="Button link">
                <Input value={section.buttonHref ?? ""} placeholder="/collections" onChange={(e) => patch(section.id, { buttonHref: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <Field label="Button style">
                <div>
                  <Choice
                    value={section.buttonVariant ?? "solid"}
                    options={BUTTON_STYLE_OPTIONS}
                    onChange={(v) => patch(section.id, { buttonVariant: v })}
                  />
                </div>
              </Field>
            </div>
            <ButtonIconField
              icon={section.buttonIcon}
              side={section.buttonIconSide}
              onChange={(n) => patch(section.id, { buttonIcon: n.icon, buttonIconSide: n.iconSide })}
            />
            <TextStyleFields
              label="Button label style"
              value={section.labelStyle}
              defaults={{ font: "sans", color: (section.buttonVariant ?? "solid") === "solid" ? "cream" : "ink", size: "sm" }}
              onChange={(v) => patch(section.id, { labelStyle: v })}
            />
            {(section.buttonVariant ?? "solid") === "solid" && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Button background</p>
                <ColorSwatches
                  value={section.buttonBg ?? "ink"}
                  onChange={(v) => patch(section.id, { buttonBg: v })}
                />
              </div>
            )}
          </>
        ) }) : null;
      if (p.startsWith("text:")) {
        const i = Number(p.slice(5));
        const t = (section.extras ?? [])[i];
        if (!t) return null;
        
          const kind = t.kind ?? "text";
          const kindLabel = FREE_TEXT_KINDS.find((k) => k.value === kind)?.label ?? "Text";
          const kindIcon = kind === "title" ? Heading : kind === "eyebrow" ? Tag : AlignLeft;
          const kindDefaults =
            kind === "title"
              ? { font: "serif" as const, color: "ink" as const, size: "xl" as const }
              : kind === "eyebrow"
              ? { font: "sans" as const, color: "stone" as const, size: "sm" as const }
              : { font: "sans" as const, color: "stone" as const, size: "md" as const };
          return Block({
            title: kindLabel,
            icon: kindIcon,
            part: `text:${i}`,
            flowSection: section,
            key: t.id,
            onDelete: () => removeExtra(section.id, i),
            onDuplicate: () => duplicateExtra(section.id, i),
            children: (
              <>
                <Field label="Style preset">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={kind}
                    onChange={(e) =>
                      patchExtra(section.id, i, {
                        kind: e.target.value as FreeTextKind,
                        // start from the preset's look; every field stays editable below
                        style: undefined,
                      })
                    }
                  >
                    {FREE_TEXT_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </Field>
                {kind === "icon" ? (
                  <>
                    <IconPicker
                      value={t.text}
                      style={t.style}
                      onPick={(name) => patchExtra(section.id, i, { text: name })}
                      onStyle={(v) => patchExtra(section.id, i, { style: v })}
                    />
                    <Field label="Text">
                      <Input
                        value={t.iconLabel ?? ""}
                        placeholder="Optional text with this icon"
                        onChange={(e) => patchExtra(section.id, i, { iconLabel: e.target.value })}
                      />
                    </Field>
                    <Field label="Text sits">
                      <Choice
                        value={t.iconLabelSide ?? "after"}
                        options={ICON_LABEL_SIDES}
                        hideLabels
                        onChange={(v) => patchExtra(section.id, i, { iconLabelSide: v })}
                      />
                    </Field>
                    {(t.iconLabelSide === "above" || t.iconLabelSide === "below") && (
                      <Field label="Text lines up">
                        <Choice
                          value={t.iconLabelAlign ?? "center"}
                          options={[
                            { value: "left" as const, label: "Left", icon: AlignLeft },
                            { value: "center" as const, label: "Center", icon: AlignCenter },
                            { value: "right" as const, label: "Right", icon: AlignRight },
                          ]}
                          hideLabels
                          onChange={(v) => patchExtra(section.id, i, { iconLabelAlign: v })}
                        />
                      </Field>
                    )}
                  </>
                ) : (
                  <>
                    <Field label={kindLabel}>
                      <Textarea
                        rows={kind === "text" ? 4 : 2}
                        value={t.text}
                        onChange={(e) => patchExtra(section.id, i, { text: e.target.value })}
                      />
                    </Field>
                    <TextIconField
                      icon={t.icon}
                      side={t.iconSide}
                      onChange={(n) => patchExtra(section.id, i, { icon: n.icon, iconSide: n.iconSide })}
                    />
                  </>
                )}
                <TextStyleFields
                  label={`${kindLabel} style`}
                  value={kind === "eyebrow" ? withEyebrowDefaults(t.style) : t.style}
                  defaults={kindDefaults}
                  onChange={(v) => patchExtra(section.id, i, { style: v })}
                  colorOnly={kind === "icon"}
                />
              </>
            ),
          });
        
      }
      if (p.startsWith("divider:")) {
        const i = Number(p.slice(8));
        const d = (section.dividers ?? [])[i];
        if (!d) return null;
        return Block({
            title: "Divider",
            icon: Minus,
            part: `divider:${i}`,
            flowSection: section,
            key: d.id,
            onDelete: () => removeDivider(section.id, i),
            onDuplicate: () => duplicateDivider(section.id, i),
            children: (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <ColorDropdown
                    label="Color"
                    value={d.color ?? ""}
                    fallback="stone"
                    options={TEXT_COLORS}
                    onChange={(v) => patchDivider(section.id, i, { color: v as TextColor })}
                  />
                </div>
                <Field label="Width">
                  <div>
                    <Choice
                      value={typeof d.widthPct === "number" ? "percent" : (d.width ?? "short")}
                      options={[
                        { value: "full" as const, label: "Full width", icon: Minus },
                        { value: "short" as const, label: "Short", icon: Minus },
                        { value: "percent" as const, label: "Percent", icon: Minus },
                      ]}
                      onChange={(v) =>
                        v === "percent"
                          ? patchDivider(section.id, i, { widthPct: d.widthPct ?? 50 })
                          : patchDivider(section.id, i, { width: v as "full" | "short", widthPct: undefined })
                      }
                    />
                  </div>
                </Field>
                {typeof d.widthPct === "number" && (
                  <Field label="Width (% of full width)">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={d.widthPct}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") return patchDivider(section.id, i, { widthPct: 1 });
                        patchDivider(section.id, i, { widthPct: Math.min(100, Math.max(1, Number(raw) || 1)) });
                      }}
                    />
                  </Field>
                )}
                <Field label="Thickness (px)">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={d.thickness ?? 1}
                    onChange={(e) =>
                      patchDivider(section.id, i, { thickness: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })
                    }
                  />
                </Field>
                <p className="text-xs text-muted-foreground">
                  Drag this block's header to move the bar between items.
                </p>
              </>
            ),
          });
      }
      if (p === "images" || p.startsWith("images:")) {
        const key = p === "images" ? 0 : Number(p.slice("images:".length));
        return imagesBlock(key);
      }
      if (p === "videos") return videosBlock();
      return null;
    };

    const imagesBlock = (groupKey = 0) => {
      const groups = imageGroups(section.images);
      const group = groups.find((g) => g.key === groupKey);
      const isFirst = groups[0]?.key === groupKey;
      const part = imageGroupPart(groupKey);
      const own = section.groupSettings?.[String(groupKey)] ?? {};
      const eff = {
        gallery: own.gallery ?? section.gallery,
        perView: own.perView ?? section.perView,
        imageHeight: own.imageHeight ?? section.imageHeight,
        imageHeightPx: own.imageHeightPx ?? section.imageHeightPx,
        imageWidthPx: own.imageWidthPx ?? section.imageWidthPx,
        imageAlign: own.imageAlign ?? section.imageAlign,
        imageBorder: own.imageBorder ?? section.imageBorder,
        imageBorderColor: own.imageBorderColor ?? section.imageBorderColor,
        imageBorderWidth: own.imageBorderWidth ?? section.imageBorderWidth,
        imageBorderStyle: own.imageBorderStyle ?? section.imageBorderStyle,
        imageBorderRadius: own.imageBorderRadius ?? section.imageBorderRadius,
        imageBorderPad: own.imageBorderPad ?? section.imageBorderPad,
        imageScrim: own.imageScrim ?? section.imageScrim,
        imageScrimStrength: own.imageScrimStrength ?? section.imageScrimStrength,
        imageShadow: own.imageShadow ?? section.imageShadow,
        carouselControls: own.carouselControls ?? section.carouselControls,
      };
      const patchGroup = (v: Partial<typeof eff>) =>
        patch(section.id, {
          groupSettings: { ...(section.groupSettings ?? {}), [String(groupKey)]: { ...own, ...v } },
        });
      const count = group?.items.length ?? 0;
      return (
        !!group && Block({ title: groups.length > 1 ? `Images ${groups.findIndex((g) => g.key === groupKey) + 1}` : "Images", icon: ImageIcon, part, key: part, flowSection: section, onDelete: () => patch(section.id, { images: section.images.filter((img) => (img.group ?? 0) !== groupKey) }), children: (
          <>

            <div className="rounded-md border bg-muted/20 p-3 space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Applies to all {count === 1 ? "1 image" : `${count} images`} in this group
              </div>
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Shade over image">
                <div>
                  <IconSelect
                    value={eff.imageScrim ?? "none"}
                    options={IMAGE_SCRIMS.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={(v) => patchGroup({ imageScrim: v })}
                  />
                </div>
              </Field>
              {(eff.imageScrim ?? "none") !== "none" && (
                <Field label="Shade strength (%)">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="h-8 w-20"
                    value={eff.imageScrimStrength ?? 55}
                    onChange={(e) => patchGroup({ imageScrimStrength: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                  />
                </Field>
              )}
              <Field label="Shadow">
                <div>
                  <IconSelect
                    value={eff.imageShadow ?? "none"}
                    options={IMAGE_SHADOWS.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={(v) => patchGroup({ imageShadow: v })}
                  />
                </div>
              </Field>
              {(eff.gallery ?? section.gallery) === "carousel" && (
                <Field label="Carousel controls">
                  <div>
                    <Choice
                      value={eff.carouselControls === false ? "off" : "on"}
                      options={[
                        { value: "on" as const, label: "Show" },
                        { value: "off" as const, label: "Hide" },
                      ]}
                      onChange={(v) => patchGroup({ carouselControls: v === "on" })}
                    />
                  </div>
                </Field>
              )}
            </div>
            <Field label="Border around image and text">
              <div>
                <Choice
                  value={eff.imageBorder ? "on" : "off"}
                  options={[
                    { value: "off" as const, label: "None" },
                    { value: "on" as const, label: "Border" },
                  ]}
                  onChange={(v) => patchGroup({ imageBorder: v === "on" })}
                />
              </div>
            </Field>
            {eff.imageBorder && (
              <div className="flex flex-wrap items-center gap-4">
                <ColorDropdown
                  label="Border color"
                  value={eff.imageBorderColor ?? ""}
                  fallback="stone"
                  options={TEXT_COLORS}
                  onChange={(v) => patchGroup({ imageBorderColor: v as TextColor })}
                />
                <Field label="Line">
                  <div>
                    <Choice
                      value={eff.imageBorderStyle ?? "solid"}
                      options={[
                        { value: "solid" as const, label: "Solid" },
                        { value: "dashed" as const, label: "Dashed" },
                        { value: "dotted" as const, label: "Dotted" },
                      ]}
                      onChange={(v) => patchGroup({ imageBorderStyle: v })}
                    />
                  </div>
                </Field>
                <Field label="Thickness (px)">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={eff.imageBorderWidth ?? 1}
                    onChange={(e) => patchGroup({ imageBorderWidth: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })}
                    className="h-8 w-20"
                  />
                </Field>
                <Field label="Corner radius (px)">
                  <Input
                    type="number"
                    min={0}
                    max={48}
                    value={eff.imageBorderRadius ?? 8}
                    onChange={(e) => patchGroup({ imageBorderRadius: Math.min(48, Math.max(0, Number(e.target.value) || 0)) })}
                    className="h-8 w-20"
                  />
                </Field>
                <Field label="Inner spacing (px)">
                  <Input
                    type="number"
                    min={0}
                    max={64}
                    value={eff.imageBorderPad ?? 12}
                    onChange={(e) => patchGroup({ imageBorderPad: Math.min(64, Math.max(0, Number(e.target.value) || 0)) })}
                    className="h-8 w-20"
                  />
                </Field>
              </div>
            )}
            <div className="flex flex-wrap gap-4">
              {isFirst && (
                <>
              <Field label="Images sit">
                <div>
                  <IconSelect
                    value={section.layout === "behind" ? "behind" : "stacked"}
                    options={[
                      { value: "stacked" as const, label: "In place", icon: Rows2 },
                      { value: "behind" as const, label: "Behind text", icon: Layers },
                    ]}
                    onChange={(v) => patch(section.id, { layout: v })}
                  />
                </div>
              </Field>
              {section.layout === "behind" && (
                <Field label="Height">
                  <div>
                    <Choice
                      value={section.height}
                      options={[
                        { value: "sm" as const, label: "Short" },
                        { value: "md" as const, label: "Medium" },
                        { value: "lg" as const, label: "Tall" },
                      ]}
                      onChange={(v) => patch(section.id, { height: v })}
                    />
                  </div>
                </Field>
              )}
              {section.layout === "behind" && (
                <Field label="Text position">
                  <div>
                    <Choice
                      value={section.overlayVAlign ?? "middle"}
                      options={[
                        { value: "top" as const, label: "Top", icon: AlignVerticalJustifyStart },
                        { value: "middle" as const, label: "Middle", icon: AlignVerticalJustifyCenter },
                        { value: "bottom" as const, label: "Bottom", icon: AlignVerticalJustifyEnd },
                      ]}
                      onChange={(v) => patch(section.id, { overlayVAlign: v })}
                    />
                  </div>
                </Field>
              )}
                </>
              )}
              {section.layout !== "behind" && count > 0 && (
                <Field label="Exact size (px)">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      H
                      <Input
                        type="number"
                        placeholder="auto"
                        className="h-8 w-20 text-xs"
                        value={eff.imageHeightPx ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const n = Number(raw);
                          patchGroup({
                            imageHeightPx: raw === "" || Number.isNaN(n) ? undefined : n,
                          });
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      W
                      <Input
                        type="number"
                        placeholder="auto"
                        className="h-8 w-20 text-xs"
                        value={eff.imageWidthPx ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const n = Number(raw);
                          patchGroup({
                            imageWidthPx: raw === "" || Number.isNaN(n) ? undefined : n,
                          });
                        }}
                      />
                    </label>
                  </div>
                </Field>
              )}
              {section.layout !== "behind" && count > 0 && eff.gallery !== "carousel" && (
                <Field label="Image position">
                  <div>
                    <Choice
                      value={eff.imageAlign ?? "left"}
                      options={[
                        { value: "left" as const, label: "Left", icon: AlignLeft },
                        { value: "center" as const, label: "Center", icon: AlignCenter },
                        { value: "right" as const, label: "Right", icon: AlignRight },
                      ]}
                      onChange={(v) => patchGroup({ imageAlign: v })}
                    />
                  </div>
                </Field>
              )}
              {section.layout !== "behind" && count > 1 && (
                <>
                  <Field label="Show as">
                    <div>
                      <Choice
                        value={eff.gallery}
                        options={[
                          { value: "grid" as const, label: "Grid", icon: LayoutGrid },
                          { value: "carousel" as const, label: "Carousel", icon: GalleryHorizontal },
                        ]}
                        onChange={(v) => patchGroup({ gallery: v })}
                      />
                    </div>
                  </Field>
                  {eff.gallery === "carousel" && (
                    <Field label="Show at once">
                      <div>
                        <Choice
                          value={Math.min(eff.perView ?? 1, count)}
                          options={Array.from(
                            { length: Math.min(count, 6) },
                            (_, k) => ({ value: k + 1, label: String(k + 1) }),
                          )}
                          onChange={(v) => patchGroup({ perView: v })}
                        />
                      </div>
                    </Field>
                  )}
                </>
              )}
            </div>
            </div>
            <div className="grid gap-3 grid-cols-1">
              {group.items.map(({ image: img, index: i }) => (
                <div key={i} data-inspector-part={`image:${i}`} className="scroll-mt-24">
                  {ImageEditor({ section, index: i, image: img, showCaption: true })}
                </div>
              ))}

            </div>
            <div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addImageSlot(section.id, groupKey)}>
                <Plus className="w-4 h-4" /> Add image
              </Button>
            </div>

          </>
        ) })
      );
    };

    const videosBlock = () => (
        (section.videos ?? []).length > 0 && Block({ title: "Videos", icon: VideoIcon, part: "videos", flowSection: section, onDelete: () => patch(section.id, { videos: [] }), children: (
          <>
            {(section.videos ?? []).map((v, i) => (
              <div key={v.id} className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Video {i + 1}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVideoPicker({ sectionId: section.id, index: i })}
                    >
                      Replace
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Duplicate video"
                      onClick={() => duplicateVideo(section.id, i)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Field label="Video link">
                  <Input
                    value={v.url}
                    placeholder="YouTube, Vimeo, or video file link"
                    onChange={(e) => patchVideo(section.id, i, { url: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Caption (optional)">
                    <Input
                      value={v.caption ?? ""}
                      onChange={(e) => patchVideo(section.id, i, { caption: e.target.value })}
                    />
                  </Field>
                  <Field label="Cover image link (optional)">
                    <Input
                      value={v.poster ?? ""}
                      onChange={(e) => patchVideo(section.id, i, { poster: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!v.autoplay}
                      onChange={(e) => patchVideo(section.id, i, { autoplay: e.target.checked })}
                    />
                    Autoplay (muted)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!v.loop}
                      onChange={(e) => patchVideo(section.id, i, { loop: e.target.checked })}
                    />
                    Loop
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={v.controls !== false}
                      onChange={(e) => patchVideo(section.id, i, { controls: e.target.checked })}
                    />
                    Show controls
                  </label>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => addVideoSlot(section.id)}>
              <Plus className="w-4 h-4" /> Add video
            </Button>
          </>
        ) })
    );

    return (
      <div className="space-y-4">
        {parts.map((p) => <Fragment key={p}>{renderPart(p)}</Fragment>)}

        {parts.length ? null : (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            Click anything above to change it, or add something new from the right.
          </p>
        )}

      </div>
    );
  };

  const Inspector = ({ section }: { section: Section }) => {
    switch (section.type) {
      case "locked":
        return (
          <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{section.title} — not editable here</p>
            <p className="mt-1">{section.note} It stays exactly as it was built. You can move or delete it.</p>
          </div>
        );
      case "free":
        return freeInspector(section);
      case "carousel":
      case "imageRow":
      case "captionedImages":
        return (
          <div className="space-y-3">
            <Field label="Heading (optional)">
              <Input
                value={section.heading ?? ""}
                onChange={(e) => patch(section.id, { heading: e.target.value })}
              />
            </Field>
            {section.heading ? (
              <TextStyleFields
                label="Heading style"
                value={section.textStyle}
                defaults={{ font: "serif", color: "ink", size: "md" }}
                onChange={(v) => patch(section.id, { textStyle: v })}
              />
            ) : null}
            {section.type !== "carousel" && (
              <Field label="Columns">
                <div>
                  <Choice
                    value={section.columns as number}
                    options={(section.type === "imageRow" ? [2, 3, 4] : [1, 2, 3]).map((c) => ({
                      value: c, label: String(c),
                    }))}
                    onChange={(v) => patch(section.id, { columns: v })}
                  />
                </div>
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {section.images.map((img, i) => (
                <div key={i}>
                  {ImageEditor({
                    section,
                    index: i,
                    image: img,
                    showCaption: section.type !== "imageRow",
                  })}
                </div>
              ))}
            </div>
            {section.type !== "imageRow" && (
              <TextStyleFields
                label="Caption style"
                value={section.captionStyle}
                defaults={{ font: "sans", color: section.type === "carousel" ? "cream" : "stone", size: "sm" }}
                onChange={(v) => patch(section.id, { captionStyle: v })}
              />
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => addImageSlot(section.id)}>
              <Plus className="w-4 h-4" /> Add image
            </Button>
          </div>
        );

      case "overlay":
        return (
          <div className="space-y-3">
            {ImageEditor({ section, index: -1, image: section.image })}
            <Field label="Eyebrow (optional)">
              <Input value={section.eyebrow ?? ""} onChange={(e) => patch(section.id, { eyebrow: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={section.heading} onChange={(e) => patch(section.id, { heading: e.target.value })} />
            </Field>
            <Field label="Text (optional)">
              <Textarea rows={3} value={section.body ?? ""} onChange={(e) => patch(section.id, { body: e.target.value })} />
            </Field>
            <TextStyleFields
              label="Heading style"
              value={section.textStyle}
              defaults={{ font: "serif", color: "cream", size: "xl" }}
              onChange={(v) => patch(section.id, { textStyle: v })}
            />
            <TextStyleFields
              label="Text style"
              value={section.bodyStyle}
              defaults={{ font: "sans", color: "cream", size: "md" }}
              onChange={(v) => patch(section.id, { bodyStyle: v })}
            />
            <TextStyleFields
              label="Eyebrow style"
              value={withEyebrowDefaults(section.eyebrowStyle)}
              defaults={{ font: "sans", color: "cream", size: "sm" }}
              onChange={(v) => patch(section.id, { eyebrowStyle: v })}
            />
            <TextStyleFields
              label="Button label style"
              value={section.labelStyle}
              defaults={{ font: "sans", color: "cream", size: "sm" }}
              onChange={(v) => patch(section.id, { labelStyle: v })}
            />
            <div className="flex flex-wrap gap-4">
              <Field label="Text position">
                <div>
                  <Choice
                    value={section.align}
                    options={[
                      { value: "left" as SectionAlign, label: "Left", icon: AlignLeft },
                      { value: "center" as SectionAlign, label: "Center", icon: AlignCenter },
                      { value: "right" as SectionAlign, label: "Right", icon: AlignRight },
                    ]}
                    onChange={(v) => patch(section.id, { align: v })}
                  />
                </div>
              </Field>
              <Field label="Height">
                <div>
                  <Choice
                    value={section.height}
                    options={[
                      { value: "sm" as const, label: "Short" },
                      { value: "md" as const, label: "Medium" },
                      { value: "lg" as const, label: "Tall" },
                    ]}
                    onChange={(v) => patch(section.id, { height: v })}
                  />
                </div>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button label (optional)">
                <Input value={section.buttonLabel ?? ""} onChange={(e) => patch(section.id, { buttonLabel: e.target.value })} />
              </Field>
              <Field label="Button link">
                <Input value={section.buttonHref ?? ""} placeholder="/collections" onChange={(e) => patch(section.id, { buttonHref: e.target.value })} />
              </Field>
            </div>
          </div>
        );

      case "split":
        return (
          <div className="space-y-3">
            {ImageEditor({ section, index: -1, image: section.image })}
            <Field label="Image side">
              <div>
                <Choice
                  value={section.imageSide}
                  options={[
                    { value: "left" as const, label: "Left", icon: PanelLeft },
                    { value: "right" as const, label: "Right", icon: PanelRight },
                  ]}
                  onChange={(v) => patch(section.id, { imageSide: v })}
                />
              </div>
            </Field>
            <Field label="Eyebrow (optional)">
              <Input value={section.eyebrow ?? ""} onChange={(e) => patch(section.id, { eyebrow: e.target.value })} />
            </Field>
            <Field label="Heading">
              <Input value={section.heading} onChange={(e) => patch(section.id, { heading: e.target.value })} />
            </Field>
            <Field label="Text (optional)">
              <Textarea rows={4} value={section.body ?? ""} onChange={(e) => patch(section.id, { body: e.target.value })} />
            </Field>
            <TextStyleFields
              label="Heading style"
              value={section.textStyle}
              defaults={{ font: "serif", color: "ink", size: "xl" }}
              onChange={(v) => patch(section.id, { textStyle: v })}
            />
            <TextStyleFields
              label="Text style"
              value={section.bodyStyle}
              defaults={{ font: "sans", color: "stone", size: "md" }}
              onChange={(v) => patch(section.id, { bodyStyle: v })}
            />
            <TextStyleFields
              label="Eyebrow style"
              value={withEyebrowDefaults(section.eyebrowStyle)}
              defaults={{ font: "sans", color: "stone", size: "sm" }}
              onChange={(v) => patch(section.id, { eyebrowStyle: v })}
            />
            <TextStyleFields
              label="Button label style"
              value={section.labelStyle}
              defaults={{ font: "sans", color: "ink", size: "sm" }}
              onChange={(v) => patch(section.id, { labelStyle: v })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Button label (optional)">
                <Input value={section.buttonLabel ?? ""} onChange={(e) => patch(section.id, { buttonLabel: e.target.value })} />
              </Field>
              <Field label="Button link">
                <Input value={section.buttonHref ?? ""} placeholder="/collections" onChange={(e) => patch(section.id, { buttonHref: e.target.value })} />
              </Field>
            </div>
          </div>
        );

      case "button":
      default:
        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Label">
                <Input value={section.label} onChange={(e) => patch(section.id, { label: e.target.value })} />
              </Field>
              <Field label="Link">
                <Input value={section.href} placeholder="/contact" onChange={(e) => patch(section.id, { href: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <Field label="Style">
                <div>
                  <Choice
                    value={section.variant}
                    options={BUTTON_STYLE_OPTIONS}
                    onChange={(v) => patch(section.id, { variant: v })}
                  />
                </div>
              </Field>
              <Field label="Alignment">
                <div>
                  <Choice
                    value={section.align}
                    options={[
                      { value: "left" as SectionAlign, label: "Left", icon: AlignLeft },
                      { value: "center" as SectionAlign, label: "Center", icon: AlignCenter },
                      { value: "right" as SectionAlign, label: "Right", icon: AlignRight },
                    ]}
                    onChange={(v) => patch(section.id, { align: v })}
                  />
                </div>
              </Field>
            </div>
            <TextStyleFields
              label="Label style"
              value={section.labelStyle}
              defaults={{ font: "sans", color: section.variant === "solid" ? "cream" : "ink", size: "sm" }}
              onChange={(v) => patch(section.id, { labelStyle: v })}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/manage/objects"><ArrowLeft className="w-4 h-4" /> Objects</Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-serif text-base truncate">
              {object ? object.name : "Object design"}
            </h1>
            {object && (
              <p className="font-mono text-[11px] text-muted-foreground truncate">/objects/{object.slug_id}</p>
            )}
          </div>
          {object && (
            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex rounded-md border overflow-hidden">
                {VIEWPORTS.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    title={`${v.label} width`}
                    aria-label={`${v.label} width`}
                    aria-pressed={viewport === v.key}
                    onClick={() => setViewport(v.key)}
                    className={`px-2.5 py-1.5 ${viewport === v.key ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  >
                    <v.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 ${preview ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => enterEdit()}

                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 ${!preview ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <Button size="sm" className="gap-2" onClick={save} disabled={saving || !dirty}>
                <Save className="w-4 h-4" /> {saving ? "Saving…" : dirty ? "Save" : "Saved"}
              </Button>
            </div>
          )}
        </div>
      </header>

      {params.get("returnPage") && (
        <div className="px-4 pt-4">
          <Link
            to={`/manage/design?page=${params.get("returnPage")}&mode=edit`}
            className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80"
          >
            <ArrowLeft className="w-4 h-4" /> Back to page editor
          </Link>
        </div>
      )}

      <main
        className={`grid grid-cols-1 gap-6 px-4 py-6 ${
          libraryOpen ? "lg:grid-cols-[260px_1fr_auto]" : "lg:grid-cols-[44px_1fr_auto]"
        }`}
      >
        {!libraryOpen ? (
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <Button
              variant="outline"
              size="icon"
              title="Show objects"
              onClick={() => setLibraryOpen(true)}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          </aside>
        ) : (
        <aside className="space-y-3">
          <div className="flex items-center gap-2">
            <Button className="flex-1 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> New object
            </Button>
            <Button variant="outline" size="icon" title="Hide objects" onClick={() => setLibraryOpen(false)}>
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects" />
          <div className="border rounded-lg divide-y max-h-[70vh] overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => select(o.id)}
                className={`w-full text-left px-3 py-2 transition-colors ${
                  o.id === selectedId ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-3">
                <ObjectMiniPreview componentKey={o.component_key} content={o.content} thumbnailUrl={(o as any).thumbnail_url} />
                <div className="min-w-0">
                <div className="text-sm font-medium truncate">{o.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {parseSections(o.content).length
                    ? `${parseSections(o.content).length} sections`
                    : o.component_key
                      ? "Built in code"
                      : "Empty"}
                </div>
                </div>
                </div>
              </button>
            ))}
            {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No objects found.</p>}
          </div>
        </aside>
        )}

        <section
          ref={canvasRef}
          className="min-w-0 w-full mx-auto transition-[max-width]"
          style={viewportWidth ? { maxWidth: viewportWidth } : undefined}
        >
          {!object ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              Pick an object on the left to design it, or create a new one.
            </div>
          ) : importing && codedKey ? (
            <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
              Turning this object into editable blocks…
              <CodedImportProbe
                codedKey={codedKey}
                width={viewportWidth || canvasRef.current?.clientWidth || 1000}
                onDone={finishImport}
              />
            </div>
          ) : preview ? (
            <div className="border rounded-lg bg-background overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                {!sections.length && codedKey
                  ? "This object was built in code and can't be changed here."
                  : "This is how the object looks. Switch to Edit to change it."}
              </div>
              <div className="p-4">
                {sections.length ? (
                  <SectionFlowList sections={sections} />
                ) : codedKey ? (
                  <div>
                    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
                      {(() => {
                        const C = objectRegistry[codedKey].component as React.ComponentType;
                        return <C />;
                      })()}
                    </Suspense>
                  </div>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Nothing here yet. Switch to Edit and add a section.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => add("free")}>
                  <Plus className="w-4 h-4" /> Add another section
                </Button>
              </div>


<ContainedBgContext.Provider value={!preview}>
              {sections.map((s, i) => {
                const active = s.id === activeId;
                return (
                  <div
                    key={s.id}
                    className={`rounded-lg border-2 bg-background transition-shadow ${
                      active ? "border-primary/50 shadow-lg" : "border-border shadow-sm hover:border-primary/25"
                    }`}
                    style={blockBgStyle(s)}
                  >
                    <div className={`flex items-center gap-2.5 rounded-t-md border-b-2 px-3 py-3 ${active ? "border-primary/40 bg-primary/10" : "border-foreground/15 bg-muted"}`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${active ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">{SECTION_LABEL[s.type]}</span>
                      <div className="ml-auto flex items-center gap-2">


                        <Button variant="ghost" size="sm" onClick={() => setActiveId(active ? "" : s.id)}>
                          {active ? "Done" : "Edit"}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => move(s.id, -1)}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={i === sections.length - 1} onClick={() => move(s.id, 1)}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        {s.type === "free" && (
                          <Button
                            variant={optionsFor === s.id ? "secondary" : "ghost"}
                            size="sm"
                            title="Block options"
                            aria-label="Block options"
                            onClick={() => {
                              setActiveId(s.id);
                              setFocusPart("");
                              setOptionsFor(optionsFor === s.id ? "" : s.id);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="Duplicate block" onClick={() => duplicateSection(s.id)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {s.type === "locked" && (
                      <div className="border-b border-dashed bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{s.title}:</span> {s.note} It is kept exactly as built — you can move or delete it, but not change it here.
                      </div>
                    )}

                    <BlockCanvas
                      section={s}
                      showHandles={active && s.type === "free" && (!!s.images.length || isTextPart(focusPart))}
                      activePart={active ? focusPart : ""}
                      onResize={(groupKey, size) => resizeImageGroup(s.id, groupKey, size)}
                      onResizeText={(part, size) => resizeTextPart(s.id, part, size)}
                      onClick={(e) => pickPart(s.id, e)}
                      onDoubleClick={(e) => editInline(s.id, e)}
                      onPointerDown={(e) => holdImageDrag(s.id, e)}
                      draggableParts={active && s.type === "free" ? [...orderablePartsOf(s), ...imageTextPartsOf(s)] : []}
                      partKeyOf={(raw) => (s.type === "free" ? (raw.startsWith("imagetext:") ? raw : canvasPartKey(s, raw)) : null)}
                      onMovePart={(fromPart, toPart, before, side) => {
                        if (s.type === "free") movePartIn(s, fromPart, toPart, before, side);
                      }}
                    >
                      {s.type === "free" && !s.images.length && !s.heading && !s.eyebrow && !s.body && !s.buttonLabel &&
                      !(s.extras ?? []).length && !(s.dividers ?? []).length && !(s.videos ?? []).length ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                          <p className="text-sm text-muted-foreground">Blank space — pick something to add.</p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {ADD_ITEMS.map((item) => (
                              <button
                                key={item.kind}
                                type="button"
                                title={`Add ${item.label.toLowerCase()}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveId(s.id);
                                  addElement(item.kind, s.id);
                                }}
                                className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                              >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <SectionView section={s} />
                      )}
                    </BlockCanvas>


                  </div>
                );
              })}
</ContainedBgContext.Provider>

              <div className="sticky bottom-4 z-40 flex justify-center">
                <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl border bg-background/95 px-5 py-4 shadow-lg backdrop-blur">
                  <span className="pl-1 pr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Add
                  </span>
                  {ADD_ITEMS.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      title={`Add ${item.label.toLowerCase()}`}
                      onClick={() => addElement(item.kind)}
                      className="flex h-10 items-center gap-2 rounded-full border px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {object && !preview && (() => {
          const s = sections.find((x) => x.id === activeId);
          if (!s) return null;
          const showToolbar = s.type === "free" && optionsFor === s.id && !focusPart;
          const title = showToolbar ? "Block" : partTypeLabel(s, focusPart);
          return (
            <aside className="lg:sticky lg:top-0 lg:self-start lg:-mt-6">
              <div
                key={`${s.id}:${focusPart ?? ""}`}
                ref={(el) => { if (el) el.scrollTop = 0; }}
                className="w-full lg:w-[380px] lg:h-[calc(100vh-4rem)] overflow-y-auto border bg-background shadow-sm lg:border-t-0 lg:rounded-b-lg rounded-lg"
              >
                <p className="border-b bg-muted px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {title}
                </p>
                {inlineSel && <SelectionStylePanel />}
                {showToolbar && <div className="border-b bg-muted/20 px-3 py-2">{freeToolbar(s)}</div>}
                <div data-inspector-section={s.id} className="inspector-flush p-4">{Inspector({ section: s })}</div>
              </div>
            </aside>
          );
        })()}
      </main>

      {toolbar && (() => {
        const sec = sections.find((s) => s.id === toolbar.sectionId) as FreeSection | undefined;
        if (!sec) return null;
        const anchorTop = toolbar.top - 52;

        if (toolbar.imageIndex !== undefined) {
          const idx = toolbar.imageIndex;
          const gKey = String(sec.images?.[idx]?.group ?? 0);
          const gOwn = sec.groupSettings?.[gKey] ?? {};
          const gCount = (sec.images ?? []).filter((im) => String(im.group ?? 0) === gKey).length;
          const gEff = {
            gallery: gOwn.gallery ?? sec.gallery,
            perView: gOwn.perView ?? sec.perView,
            imageHeight: gOwn.imageHeight ?? sec.imageHeight,
            imageHeightPx: gOwn.imageHeightPx ?? sec.imageHeightPx,
            imageWidthPx: gOwn.imageWidthPx ?? sec.imageWidthPx,
            imageAlign: gOwn.imageAlign ?? sec.imageAlign,
          };
          const patchG = (v: Partial<typeof gEff>) =>
            patch(sec.id, { groupSettings: { ...(sec.groupSettings ?? {}), [gKey]: { ...gOwn, ...v } } });
          return (
            <FloatingToolbar top={anchorTop} left={toolbar.left}>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Image</span>
              <Button variant="outline" size="sm" onClick={() => setPicker({ sectionId: sec.id, index: idx })}>
                Replace
              </Button>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Link
                <Input
                  value={sec.images?.[idx]?.href ?? ""}
                  placeholder="/brands or https://…"
                  className="h-8 w-44 text-xs"
                  onChange={(e) => patchImage(sec.id, idx, { href: e.target.value })}
                />
              </label>
              {sec.layout !== "behind" && (
                <>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    H px
                    <Input
                      type="number"
                      placeholder="auto"
                      className="h-8 w-20 text-xs"
                      value={gEff.imageHeightPx ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const n = Number(raw);
                        patchG({ imageHeightPx: raw === "" || Number.isNaN(n) ? undefined : n });
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    W px
                    <Input
                      type="number"
                      placeholder="auto"
                      className="h-8 w-20 text-xs"
                      value={gEff.imageWidthPx ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const n = Number(raw);
                        patchG({ imageWidthPx: raw === "" || Number.isNaN(n) ? undefined : n });
                      }}
                    />
                  </label>
                </>
              )}
              {sec.layout !== "behind" && gEff.gallery !== "carousel" && (
                <Dropdown
                  label="Position"
                  value={gEff.imageAlign ?? "left"}
                  options={[
                    { value: "left", label: "Left", icon: AlignLeft },
                    { value: "center", label: "Center", icon: AlignCenter },
                    { value: "right", label: "Right", icon: AlignRight },
                  ]}
                  onChange={(v) => patchG({ imageAlign: v as SectionAlign })}
                />
              )}
              <IconSelect
                label="Sits"
                value={sec.layout === "behind" ? "behind" : "stacked"}
                options={[
                  { value: "stacked", label: "In place", icon: Rows2 },
                  { value: "behind", label: "Behind text", icon: Layers },
                ]}
                onChange={(v) => patch(sec.id, { layout: v })}
              />

              {sec.layout !== "behind" && gCount > 1 && (
                <Dropdown
                  label="Show as"
                  value={gEff.gallery ?? "grid"}
                  options={[
                    { value: "grid", label: "Grid", icon: LayoutGrid },
                    { value: "carousel", label: "Carousel", icon: GalleryHorizontal },
                  ]}
                  onChange={(v) => patchG({ gallery: v as "grid" | "carousel" })}
                />
              )}
              {sec.layout !== "behind" && gEff.gallery === "carousel" && gCount > 1 && (
                <Dropdown
                  label="Show at once"
                  value={String(Math.min(gEff.perView ?? 1, gCount))}
                  options={Array.from({ length: Math.min(gCount, 6) }, (_, k) => ({
                    value: String(k + 1), label: String(k + 1),
                  }))}
                  onChange={(v) => patchG({ perView: Number(v) })}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { removeImageSlot(sec.id, idx); setToolbar(null); }}
              >
                Remove
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setToolbar(null)}>Done</Button>
            </FloatingToolbar>
          );
        }

        const fieldKey = String(toolbar.field);
        const extraIdx = fieldKey.startsWith("extra:") ? Number(fieldKey.split(":")[1]) : -1;
        const imgText = fieldKey.startsWith("imagetext:")
          ? { img: Number(fieldKey.split(":")[1]), t: Number(fieldKey.split(":")[2]) }
          : null;
        const imgTextItem = imgText ? (sec.images?.[imgText.img]?.texts ?? [])[imgText.t] : undefined;
        if (imgText && !imgTextItem) return null;
        const style = (imgTextItem
          ? (imgTextItem.style ?? {})
          : extraIdx >= 0
          ? ((sec.extras ?? [])[extraIdx]?.style ?? {})
          : ((sec as any)[fieldKey] ?? {})) as TextStyle;
        const solid = (sec.buttonVariant ?? "solid") === "solid";
        const defaultColor: Record<string, string> = {
          eyebrowStyle: "stone",
          textStyle: "ink",
          bodyStyle: "stone",
          captionStyle: "stone",
          labelStyle: solid ? "cream" : "ink",
        };
        const defaultFont: Record<string, string> = {
          eyebrowStyle: "sans",
          textStyle: "serif",
          bodyStyle: "sans",
          captionStyle: "sans",
          labelStyle: "sans",
        };
        const kindDefaults = imgTextItem ? IMAGE_TEXT_DEFAULTS[imgTextItem.kind] : null;
        const extraItem = extraIdx >= 0 ? (sec.extras ?? [])[extraIdx] : undefined;
        const extraKind = extraItem?.kind ?? "text";
        const isEyebrow = imgTextItem
          ? imgTextItem.kind === "eyebrow"
          : extraItem
          ? extraKind === "eyebrow"
          : fieldKey === "eyebrowStyle";
        const es = isEyebrow ? withEyebrowDefaults(style) : style;
        const set = (changes: Partial<TextStyle>) =>
          imgText
            ? patchImageText(toolbar.sectionId, imgText.img, imgText.t, { style: { ...es, ...changes } })
            : extraIdx >= 0
            ? patchExtra(toolbar.sectionId, extraIdx, { style: { ...es, ...changes } })
            : patch(toolbar.sectionId, { [fieldKey]: { ...es, ...changes } });
        return (
          <FloatingToolbar top={anchorTop} left={toolbar.left}>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {imgTextItem
                ? (IMAGE_TEXT_KINDS.find((k) => k.value === imgTextItem.kind)?.label ?? "Text")
                : extraItem
                ? (FREE_TEXT_KINDS.find((k) => k.value === extraKind)?.label ?? "Text")
                : STYLE_FIELD_LABEL[fieldKey]}
            </span>
            {imgText && imgTextItem && (
              <Dropdown
                label="Type"
                value={imgTextItem.kind}
                options={IMAGE_TEXT_KINDS.map((k) => ({ value: k.value as string, label: k.label }))}
                onChange={(v) => patchImageText(toolbar.sectionId, imgText.img, imgText.t, { kind: v as ImageTextKind })}
              />
            )}
            <Dropdown
              label="Font"
              value={es.font ?? kindDefaults?.font ?? defaultFont[fieldKey] ?? "sans"}
              options={TEXT_FONTS.map((f) => ({ value: f.value as string, label: f.label }))}
              onChange={(v) => set({ font: (v || undefined) as TextFont | undefined })}
            />
            <SizeControl
              style={es}
              defaultSize={kindDefaults?.size ?? (fieldKey === "textStyle" ? "xl" : fieldKey === "bodyStyle" || extraIdx >= 0 ? "md" : "sm")}
              heading={kindDefaults ? kindDefaults.heading : fieldKey === "textStyle"}
              set={set}
            />
            <ColorDropdown
              label="Color"
              value={es.color ?? ""}
              fallback={(kindDefaults?.color ?? defaultColor[fieldKey] ?? (extraIdx >= 0 ? "stone" : "ink")) as TextColor}
              options={TEXT_COLORS}
              onChange={(v) => set({ color: (v || undefined) as TextColor | undefined })}
            />
            <EmphasisToggles
              style={es}
              set={set}
              underlineDefault={fieldKey === "labelStyle" && (sec.buttonVariant ?? "solid") === "link"}
            />
            {imgText && imgTextItem && (
              <Dropdown
                label="Align"
                value={imgTextItem.align ?? sec.images?.[imgText.img]?.captionAlign ?? sec.captionAlign ?? "left"}
                options={[
                  { value: "left", label: "Left", icon: AlignLeft },
                  { value: "center", label: "Center", icon: AlignCenter },
                  { value: "right", label: "Right", icon: AlignRight },
                ]}
                onChange={(v) =>
                  patchImageText(toolbar.sectionId, imgText.img, imgText.t, { align: v as FreeSection["captionAlign"] })
                }
              />
            )}
            {toolbar.field === "labelStyle" && (
              <Dropdown
                label="Style"
                value={sec.buttonVariant ?? "solid"}
                options={BUTTON_STYLE_OPTIONS}
                onChange={(v) => patch(toolbar.sectionId, { buttonVariant: v as FreeSection["buttonVariant"] })}
              />
            )}
            {toolbar.field === "labelStyle" && (sec.buttonVariant ?? "solid") === "solid" && (
              <ColorDropdown
                label="Fill"
                value={sec.buttonBg ?? ""}
                fallback="ink"
                options={TEXT_COLORS}
                onChange={(v) => patch(toolbar.sectionId, { buttonBg: (v || undefined) as TextColor | undefined })}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete this item"
              aria-label="Delete this item"
              onClick={() => {
                if (imgText) removeImageText(toolbar.sectionId, imgText.img, imgText.t);
                else if (extraIdx >= 0) removeExtra(toolbar.sectionId, extraIdx);
                else {
                  const contentField: Record<string, string> = {
                    eyebrowStyle: "eyebrow",
                    textStyle: "heading",
                    bodyStyle: "body",
                    captionStyle: "caption",
                    labelStyle: "buttonLabel",
                  };
                  const f = contentField[fieldKey];
                  if (f) patch(toolbar.sectionId, { [f]: undefined } as Partial<Section>);
                }
                setToolbar(null);
                setFocusPart("");
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setToolbar(null)}>Done</Button>
          </FloatingToolbar>
        );
      })()}

      <CreateObjectDialog
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) load(); }}
        onCreated={async (row) => {
          await load();
          setParams({ object: row.id });
        }}
      />
      <ImagePickerDialog
        open={!!picker}
        onOpenChange={(v) => { if (!v) setPicker(null); }}
        onPick={({ url, alt }) => {
          if (picker) patchImage(picker.sectionId, picker.index, { url, alt: alt || "" });
          setPicker(null);
        }}
      />
      <ImagePickerDialog
        open={!!bgPicker}
        onOpenChange={(v) => { if (!v) setBgPicker(null); }}
        onPick={({ url }) => {
          if (bgPicker) patch(bgPicker, { bgImage: url } as Partial<Section>);
          setBgPicker(null);
        }}
      />
      <VideoPickerDialog
        open={!!videoPicker}
        onOpenChange={(v) => { if (!v) setVideoPicker(null); }}
        onPick={({ url, poster, name }) => {
          if (videoPicker) {
            patchVideo(videoPicker.sectionId, videoPicker.index, {
              url,
              poster,
              caption: videosOf(videoPicker.sectionId)[videoPicker.index]?.caption ?? "",
              ...(name ? {} : {}),
            });
          }
          setVideoPicker(null);
        }}
      />
    </div>
  );
}


/** Renders a coded object off-screen, waits for it to settle, then reads it into blocks. */
function CodedImportProbe({
  codedKey,
  width,
  onDone,
}: {
  codedKey: string;
  width: number;
  onDone: (sections: Section[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
    const tick = async () => {
      if (cancelled || done.current) return;
      const root = ref.current;
      const loading = !root || root.querySelector(".animate-pulse") ||
        [...root.querySelectorAll("img")].some((i) => !i.complete);
      if (loading && Date.now() - start < 4000) {
        setTimeout(tick, 150);
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled || !root) return;
      const { sectionsFromDom } = await import("./importCodedObject");
      done.current = true;
      onDone(sectionsFromDom(root));
    };
    setTimeout(tick, 300);
    return () => { cancelled = true; };
  }, [codedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const C = objectRegistry[codedKey].component as React.ComponentType;
  return createPortal(
    <div
      ref={ref}
      className="import-probe bg-background"
      style={{ position: "fixed", left: -20000, top: 0, width, pointerEvents: "none" }}
    >
      <Suspense fallback={<div className="animate-pulse h-10" />}>
        <C />
      </Suspense>
    </div>,
    document.body,
  );
}
