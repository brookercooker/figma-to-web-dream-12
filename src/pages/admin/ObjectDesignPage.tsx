import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Baseline,
  type LucideIcon,
} from "lucide-react";
import CreateObjectDialog from "./CreateObjectDialog";
import ImagePickerDialog from "./ImagePickerDialog";
import VideoPickerDialog from "./VideoPickerDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BODY_PX, FREE_TEXT_KINDS, HEADING_PX, IMAGE_HEIGHTS, IMAGE_TEXT_DEFAULTS, IMAGE_TEXT_KINDS, MAX_TEXT_PX, MIN_TEXT_PX, SECTION_LABEL, SectionFlowList, SectionView, TEXT_COLORS, TEXT_FONTS, TEXT_SIZES, cleanEditedHtml, imageGroupPart, imageGroups, makeSection, orderParts, newSectionId, parseSections, withEyebrowDefaults,
  type FreeDivider, type FreeSection, type FreeTextKind, type SectionFlow, type ImageText, type ImageTextKind, type Section, type SectionAlign, type SectionImage, type SectionVideo, type SectionType,
  type RowVAlign, type ImageHeight,
  type TextColor, type TextFont, type TextSize, type TextStyle,
} from "@/components/ObjectSections";

/** Icon shown on the icon-only "add item" row inside an image editor. */
const IMAGE_TEXT_ICONS: Record<ImageTextKind, LucideIcon> = {
  eyebrow: Tag,
  title: Heading,
  subheading: Baseline,
  text: AlignLeft,
  divider: Minus,
  button: MousePointerClick,
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
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Choice<T extends string | number>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string; icon?: LucideIcon }[]; onChange: (v: T) => void }) {
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
          {o.label}
        </button>
      ))}
    </div>
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
              <Choice
                value={style.sizePx ? ("" as unknown as TextSize) : (style.size ?? defaults.size)}
                options={TEXT_SIZES}
                onChange={(v) => set({ size: v, sizePx: undefined })}
              />
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
          <div className="flex items-center gap-2 pt-1">
            {TEXT_COLORS.map((c) => {
              const selected = (style.color ?? defaults.color) === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  aria-label={`${c.label} text`}
                  aria-pressed={selected}
                  onClick={() => set({ color: c.value })}
                  className={`h-5 w-5 rounded-full border border-border transition-transform hover:scale-110 ${
                    selected ? "ring-2 ring-offset-1 ring-foreground/60" : ""
                  }`}
                  style={{ background: c.swatch }}
                />
              );
            })}
          </div>
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
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs"
          >
            <ColorDot swatch={current?.swatch} />
            <span>{current?.label ?? ""}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[9rem]">

          {options.map((o) => (
            <DropdownMenuItem key={o.value} className="gap-2 text-xs" onSelect={() => onChange(o.value)}>
              <ColorDot swatch={o.swatch} />
              {o.label}
            </DropdownMenuItem>
          ))}
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

export default function ObjectDesignPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("object") ?? "";

  const [objects, setObjects] = useState<ObjectRow[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(true);
  // { sectionId, index } — index -1 means the section's single image
  const [picker, setPicker] = useState<{ sectionId: string; index: number } | null>(null);
  const [linkOpen, setLinkOpen] = useState<Record<string, boolean>>({});
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});
  // which video slot the video chooser is filling
  const [videoPicker, setVideoPicker] = useState<{ sectionId: string; index: number } | null>(null);
  // which element of the active section the user clicked on in the preview
  const [focusPart, setFocusPart] = useState("");
  // collapsible editing blocks: explicit overrides plus an expand/collapse-all default
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [blocksExpanded, setBlocksExpanded] = useState(false);
  const [dragPart, setDragPart] = useState<{ sectionId: string; part: string } | null>(null);
  const [dropAt, setDropAt] = useState<{ sectionId: string; part: string; before: boolean } | null>(null);
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
      group.scrollIntoView({ behavior: "smooth", block: "center" });
      group.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")?.focus();
    }, 60);

    return () => window.clearTimeout(t);
  }, [focusPart, activeId]);

  // Double-clicking a text element in the preview turns it into an inline editor.
  const editInline = (sectionId: string, e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest?.("[data-part]") as HTMLElement | null;
    if (!el) return;
    const part = el.getAttribute("data-part") ?? "";
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
    if (!field) return;
    e.preventDefault();
    e.stopPropagation();

    const target = field === "buttonLabel"
      ? ((el.querySelector("a, button") as HTMLElement | null) ?? el)
      : el;
    if (target.isContentEditable) return;

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
      if (imgText) patchImageText(sectionId, imgText.img, imgText.t, { text: value });
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
    if (!el) return;
    const part = el.getAttribute("data-part") ?? "";
    // captions and image text boxes are edited alongside their image
    setFocusPart(
      part.startsWith("caption:") ? part.replace("caption:", "image:")
      : part.startsWith("imagetext:") ? `image:${part.split(":")[1]}`
      : part,
    );

    // Text elements get a floating font / size / color toolbar.
    const field = part.startsWith("text:")
      ? (`extra:${Number(part.split(":")[1]) || 0}` as keyof FreeSection)
      : part.startsWith("imagetext:")
      ? (part as unknown as keyof FreeSection)
      : STYLE_FIELD[part.startsWith("caption:") ? "caption" : part];
    const r = el.getBoundingClientRect();
    if (field) {
      setToolbar({ sectionId, field, top: r.top, left: r.left, width: r.width });
    } else if (part.startsWith("image:")) {
      setToolbar({ sectionId, imageIndex: Number(part.split(":")[1]) || 0, top: r.top, left: r.left, width: r.width });
    } else {
      setToolbar(null);
    }
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

  useEffect(() => {
    const parsed = parseSections(object?.content);
    if (parsed.length) {
      setSections(parsed);
      setActiveId("");
      setPreview(true);
    } else {
      // Nothing designed yet: open straight into an editable block.
      const s = makeSection("free");
      setSections([s]);
      setActiveId(s.id);
      setPreview(false);
    }
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

  const patchExtra = (id: string, index: number, changes: { text?: string; style?: TextStyle; kind?: FreeTextKind }) => {
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
  const openBlock = (key: string) => {
    setBlocksExpanded(false);
    setFocusPart("");
    setOpenBlocks({ [key]: true });
  };

  const addImageText = (sectionId: string, index: number, kind: ImageTextKind) => {
    const texts = imageTextsOf(sectionId, index);
    patchImage(sectionId, index, {
      texts: [...texts, { id: newSectionId(), kind, text: "" }],
    });
    openBlock("images");
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
    openBlock("images");
    setOpenSub((s) => ({ ...s, [`img:${id}:${newIndex}`]: true }));
    setPicker({ sectionId: id, index: newIndex });
  };


  const removeImageSlot = (id: string, index: number) => {
    setSections((prev) =>
      prev.flatMap((s) => {
        if (s.id !== id || !("images" in s)) return [s];
        const images = ((s as any).images ?? []) as SectionImage[];
        // Deleting the only image removes the whole section.
        if (images.length <= 1) return [];
        return [{ ...s, images: images.filter((_, i) => i !== index) } as Section];
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
    openBlock("images");
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
    openBlock("Videos");
    setVideoPicker({ sectionId: id, index: newIndex });
  };

  type AddKind = "eyebrow" | "title" | "text" | "image" | "video" | "divider" | "button";

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
      patch(s.id, { dividers: [...(s.dividers ?? []), { id, color: "stone", width: "full", thickness: 1 }] });
      openBlock(id);
      return;
    }
    if (kind === "button") {
      if (s.buttonLabel === undefined) patch(s.id, { buttonLabel: "Explore", buttonHref: "/" });
      openBlock("button");
      return;
    }
    if (kind === "eyebrow") {
      if (s.eyebrow === undefined) {
        patch(s.id, { eyebrow: "Since 1951" });
        openBlock("eyebrow");
      } else {
        const id = newSectionId();
        patch(s.id, { extras: [...(s.extras ?? []), { id, text: "Since 1951", kind: "eyebrow" as const }] });
        openBlock(id);
      }
      return;
    }
    if (kind === "title") {
      if (s.heading === undefined) {
        patch(s.id, { heading: "A quiet statement" });
        openBlock("heading");
      } else {
        const id = newSectionId();
        patch(s.id, { extras: [...(s.extras ?? []), { id, text: "A quiet statement", kind: "title" as const }] });
        openBlock(id);
      }
      return;
    }
    if (s.body === undefined) {
      patch(s.id, { body: "" });
      openBlock("body");
    } else {
      const id = newSectionId();
      patch(s.id, { extras: [...(s.extras ?? []), { id, text: "" }] });
      openBlock(id);
    }
  };

  const ADD_ITEMS: { kind: AddKind; label: string; icon: LucideIcon }[] = [
    { kind: "eyebrow", label: "Eyebrow", icon: Tag },
    { kind: "title", label: "Title", icon: Heading },
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
            title={
              (section as any).images.length > 1
                ? "Delete image"
                : "Delete image (removes this section)"
            }
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
        </>
      )}
      {showCaption && imgOpen && (
        <div className="space-y-2 rounded-md border border-dashed p-2">
          <div className="flex flex-wrap items-center gap-1">
            {IMAGE_TEXT_KINDS.map((k) => {
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
              className={`space-y-2 rounded border bg-muted/30 p-2 ${isDragging ? "opacity-40" : ""}`}
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
                  <IconSelect
                    value={t.kind}
                    options={IMAGE_TEXT_KINDS.map((k) => ({ value: k.value, label: k.label }))}
                    onChange={(v) => patchImageText(section.id, index, ti, { kind: v })}
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
                      <Choice
                        value={t.align ?? image.captionAlign ?? (section as any).captionAlign ?? "left"}
                        options={[
                          { value: "left" as const, label: "Left", icon: AlignLeft },
                          { value: "center" as const, label: "Center", icon: AlignCenter },
                          { value: "right" as const, label: "Right", icon: AlignRight },
                        ]}
                        onChange={(v) => patchImageText(section.id, index, ti, { align: v })}
                      />
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
                          options={[
                            { value: "solid" as const, label: "Solid" },
                            { value: "outline" as const, label: "Outline" },
                            { value: "link" as const, label: "Text link" },
                          ]}
                          onChange={(v) =>
                            patchImageText(section.id, index, ti, {
                              button: { ...(t.button ?? {}), variant: v as "solid" | "outline" | "link" },
                            })
                          }
                        />
                      </Field>
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
                      <Choice
                        value={t.align ?? image.captionAlign ?? (section as any).captionAlign ?? "left"}
                        options={[
                          { value: "left" as const, label: "Left", icon: AlignLeft },
                          { value: "center" as const, label: "Center", icon: AlignCenter },
                          { value: "right" as const, label: "Right", icon: AlignRight },
                        ]}
                        onChange={(v) => patchImageText(section.id, index, ti, { align: v })}
                      />
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
                  ) : (
                    <>
                      <Textarea
                        rows={2}
                        value={t.text}
                        placeholder={`${kindLabel}…`}
                        onChange={(e) => patchImageText(section.id, index, ti, { text: e.target.value })}
                      />
                      <Choice
                        value={t.align ?? image.captionAlign ?? (section as any).captionAlign ?? "left"}
                        options={[
                          { value: "left" as const, label: "Left", icon: AlignLeft },
                          { value: "center" as const, label: "Center", icon: AlignCenter },
                          { value: "right" as const, label: "Right", icon: AlignRight },
                        ]}
                        onChange={(v) => patchImageText(section.id, index, ti, { align: v })}
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
  const flowField = (section: FreeSection, part: string) => {
    const flow = (section.flows?.[part] ?? "separate") as SectionFlow;
    return (
      <Field label="Placement">
        <div className="flex items-center gap-3">
          <Choice
            value={flow}
            options={[
              { value: "separate" as SectionFlow, label: "Separate", icon: Rows2 },
              { value: "inline" as SectionFlow, label: "Inline", icon: Columns2 },
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
          {flow === "inline" && (
            <Choice
              value={(section.flowAligns?.[part] ?? section.align) as SectionAlign}
              options={[
                { value: "left" as SectionAlign, label: "Left", icon: AlignLeft },
                { value: "center" as SectionAlign, label: "Center", icon: AlignCenter },
                { value: "right" as SectionAlign, label: "Right", icon: AlignRight },
              ]}
              onChange={(v) => patch(section.id, { flowAligns: { ...(section.flowAligns ?? {}), [part]: v } })}
            />
          )}
        </div>
      </Field>
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

  const movePartIn = (s: FreeSection, from: string, to: string, before = true) => {
    if (from === to) return;
    const parts = orderablePartsOf(s);
    const next = parts.filter((p) => p !== from);
    const at = next.indexOf(to);
    if (at === -1) next.push(from);
    else next.splice(before ? at : at + 1, 0, from);
    patch(s.id, { order: next });
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
    const open = openBlocks[blockKey] ?? (blocksExpanded || focused);
    const canDrag = !!(flowSection && part && orderablePartsOf(flowSection).includes(part));
    const dragging = canDrag && dragPart?.sectionId === flowSection!.id && dragPart.part === part;
    const showBar =
      canDrag && !dragging && dropAt?.sectionId === flowSection!.id && dropAt.part === part
        ? dropAt.before
          ? "before"
          : "after"
        : null;
    const bar = (
      <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={showBar === "before" ? { top: -14 } : { bottom: -14 }}>
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="h-0.5 flex-1 rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
    );
    return (
      <div
        key={key}
        data-inspector-part={part}
        onDragOver={canDrag ? (e) => {
          if (dragPart?.sectionId !== flowSection!.id) return;
          e.preventDefault();
          if (dragPart.part === part) { setDropAt(null); return; }
          const r = e.currentTarget.getBoundingClientRect();
          const before = e.clientY < r.top + r.height / 2;
          setDropAt((d) =>
            d && d.sectionId === flowSection!.id && d.part === part && d.before === before
              ? d
              : { sectionId: flowSection!.id, part: part!, before },
          );
        } : undefined}
        onDragLeave={canDrag ? (e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setDropAt((d) => (d && d.part === part && d.sectionId === flowSection!.id ? null : d));
        } : undefined}
        onDrop={canDrag ? (e) => {
          e.preventDefault();
          if (dragPart?.sectionId === flowSection!.id) {
            const r = e.currentTarget.getBoundingClientRect();
            const before = e.clientY < r.top + r.height / 2;
            movePartIn(flowSection!, dragPart.part, part!, before);
          }
          setDragPart(null);
          setDropAt(null);
        } : undefined}
        className={`relative scroll-mt-24 rounded-lg border bg-background shadow-sm transition-[margin] ${dragging ? "border-primary opacity-70" : ""} ${showBar === "before" ? "mt-4" : ""} ${showBar === "after" ? "mb-4" : ""}`}
      >
        {showBar ? bar : null}
        <div
          draggable={canDrag}
          onDragStart={canDrag ? () => setDragPart({ sectionId: flowSection!.id, part: part! }) : undefined}
          onDragEnd={canDrag ? () => { setDragPart(null); setDropAt(null); } : undefined}
          className="flex items-center gap-1 rounded-t-lg border-b-2 border-foreground/15 bg-muted pr-2 transition-colors hover:bg-muted/80"
        >
          {canDrag ? (
            <GripVertical className="ml-2 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
          ) : null}
          <button
            type="button"
            onClick={() => setOpenBlocks((o) => ({ ...o, [blockKey]: !open }))}
            className={`flex flex-1 items-center gap-2 py-2.5 pr-3 text-left ${canDrag ? "pl-1" : "pl-3"}`}
          >
            <Icon className="h-4 w-4 text-foreground" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</span>
            <ChevronDown
              className={`ml-auto h-4 w-4 text-foreground/70 transition-transform ${open ? "" : "-rotate-90"}`}
            />
          </button>
          {onDuplicate ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Duplicate ${title}`}
              title={`Duplicate ${title}`}
              className="h-7 w-7 p-0 text-foreground/60 hover:text-foreground"
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
              className="h-7 w-7 p-0 text-foreground/60 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {open ? (
          <div className="space-y-3 p-3">
            {children}
            {flowSection && part ? flowField(flowSection, part) : null}
          </div>
        ) : null}
      </div>
    );
  };


  const freeInspector = (section: FreeSection) => {
    const hasTitle = section.heading !== undefined;
    const hasEyebrow = section.eyebrow !== undefined;
    const hasBody = section.body !== undefined;
    const hasButton = section.buttonLabel !== undefined;

    const parts = orderablePartsOf(section);

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
                    options={[
                      { value: "solid" as const, label: "Solid" },
                      { value: "outline" as const, label: "Outline" },
                      { value: "link" as const, label: "Text link" },
                    ]}
                    onChange={(v) => patch(section.id, { buttonVariant: v })}
                  />
                </div>
              </Field>
            </div>
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
                <Field label="Type">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={kind}
                    onChange={(e) => patchExtra(section.id, i, { kind: e.target.value as FreeTextKind })}
                  >
                    {FREE_TEXT_KINDS.map((k) => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label={kindLabel}>
                  <Textarea
                    rows={kind === "text" ? 4 : 2}
                    value={t.text}
                    onChange={(e) => patchExtra(section.id, i, { text: e.target.value })}
                  />
                </Field>
                <TextStyleFields
                  label={`${kindLabel} style`}
                  value={kind === "eyebrow" ? withEyebrowDefaults(t.style) : t.style}
                  defaults={kindDefaults}
                  onChange={(v) => patchExtra(section.id, i, { style: v })}
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
                      value={typeof d.widthPct === "number" ? "percent" : (d.width ?? "full")}
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
        imageAlign: own.imageAlign ?? section.imageAlign,
        imageBorder: own.imageBorder ?? section.imageBorder,
        imageBorderColor: own.imageBorderColor ?? section.imageBorderColor,
        imageBorderWidth: own.imageBorderWidth ?? section.imageBorderWidth,
        imageBorderStyle: own.imageBorderStyle ?? section.imageBorderStyle,
        imageBorderRadius: own.imageBorderRadius ?? section.imageBorderRadius,
        imageBorderPad: own.imageBorderPad ?? section.imageBorderPad,
      };
      const patchGroup = (v: Partial<typeof eff>) =>
        patch(section.id, {
          groupSettings: { ...(section.groupSettings ?? {}), [String(groupKey)]: { ...own, ...v } },
        });
      const count = group?.items.length ?? 0;
      return (
        !!group && Block({ title: groups.length > 1 ? `Images ${groups.findIndex((g) => g.key === groupKey) + 1}` : "Images", icon: ImageIcon, part, key: part, flowSection: section, onDelete: () => patch(section.id, { images: section.images.filter((img) => (img.group ?? 0) !== groupKey) }), children: (
          <>

            <div className="grid gap-3 sm:grid-cols-2">
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
                    value={section.layout}
                    options={[
                      { value: "stacked" as const, label: "Below text", icon: Rows2 },
                      { value: "beside" as const, label: "Beside text", icon: Columns2 },
                      { value: "behind" as const, label: "Behind text", icon: Layers },
                    ]}
                    onChange={(v) => patch(section.id, { layout: v })}
                  />
                </div>
              </Field>
              {section.layout === "beside" && (
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
              )}
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
                <Field label="Image height">
                  <div>
                    <Choice
                      value={eff.imageHeight ?? "auto"}
                      options={IMAGE_HEIGHTS.map((h) => ({ value: h.value, label: h.label }))}
                      onChange={(v) => patchGroup({ imageHeight: v })}
                    />
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
        <div className="flex flex-wrap gap-2">
          <div className="ml-auto flex gap-2">
            <Chip
              label="Expand all"
              icon={ChevronsUpDown}
              onClick={() => { setBlocksExpanded(true); setOpenBlocks({}); }}
            />
            <Chip
              label="Collapse all"
              icon={ChevronsDownUp}
              onClick={() => { setBlocksExpanded(false); setOpenBlocks({}); setFocusPart(""); }}
            />
          </div>
        </div>

        {Block({ title: "Edit Block", icon: AlignLeft, children: (
          <>
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
            {parts.length > 1 && (
              <Field label="Same row alignment">
                <div>
                  <Choice
                    value={section.rowVAlign ?? "middle"}
                    options={[
                      { value: "top" as RowVAlign, label: "Top", icon: AlignVerticalJustifyStart },
                      { value: "middle" as RowVAlign, label: "Middle", icon: AlignVerticalJustifyCenter },
                      { value: "bottom" as RowVAlign, label: "Bottom", icon: AlignVerticalJustifyEnd },
                      { value: "baseline" as RowVAlign, label: "Text line", icon: Baseline },
                    ]}
                    onChange={(v) => patch(section.id, { rowVAlign: v })}
                  />
                </div>
              </Field>
            )}
            {parts.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Drag an element's header below to move it up or down.
              </p>
            )}
          </>
        ) })}
















        {parts.map((p) => <Fragment key={p}>{renderPart(p)}</Fragment>)}




      </div>
    );
  };

  const Inspector = ({ section }: { section: Section }) => {
    switch (section.type) {
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
                    options={[
                      { value: "solid" as const, label: "Solid" },
                      { value: "outline" as const, label: "Outline" },
                      { value: "link" as const, label: "Text link" },
                    ]}
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
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className={`px-3 py-1.5 text-xs inline-flex items-center gap-1.5 ${preview ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(false)}
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
                <div className="text-sm font-medium truncate">{o.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {parseSections(o.content).length
                    ? `${parseSections(o.content).length} sections`
                    : o.component_key
                      ? "Built in code"
                      : "Empty"}
                </div>
              </button>
            ))}
            {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No objects found.</p>}
          </div>
        </aside>
        )}

        <section className="min-w-0">
          {!object ? (
            <div className="border rounded-lg p-12 text-center text-muted-foreground">
              Pick an object on the left to design it, or create a new one.
            </div>
          ) : preview ? (
            <div className="border rounded-lg bg-background overflow-hidden">
              <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                This is how the object looks. Switch to Edit to change it.
              </div>
              <div className="p-4">
                {sections.length ? (
                  <SectionFlowList sections={sections} />
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


              {sections.map((s, i) => {
                const active = s.id === activeId;
                return (
                  <div
                    key={s.id}
                    className={`overflow-hidden rounded-lg border-2 bg-background transition-shadow ${
                      active ? "border-primary/50 shadow-lg" : "border-border shadow-sm hover:border-primary/25"
                    }`}
                  >
                    <div className={`flex items-center gap-2.5 border-b-2 px-3 py-3 ${active ? "border-primary/40 bg-primary/10" : "border-foreground/15 bg-muted"}`}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${active ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">{SECTION_LABEL[s.type]}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <IconSelect
                          label="Placement"
                          value={(s.flow ?? "separate") as SectionFlow}
                          options={[
                            { value: "separate" as SectionFlow, label: "Separate", icon: Rows2 },
                            { value: "inline" as SectionFlow, label: "Inline", icon: Columns2 },
                          ]}
                          onChange={(v) => patch(s.id, { flow: v } as Partial<Section>)}
                        />
                        {s.flow === "inline" && (
                          <label className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              className="h-8 w-20"
                              placeholder="Auto"
                              value={s.flowWidth ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  patch(s.id, { flowWidth: undefined } as Partial<Section>);
                                  return;
                                }
                                const n = Number(raw);
                                if (Number.isNaN(n)) return;
                                patch(s.id, { flowWidth: Math.min(100, Math.max(0, n)) } as Partial<Section>);
                              }}
                            />
                            %
                          </label>
                        )}


                        <Button variant="ghost" size="sm" onClick={() => setActiveId(active ? "" : s.id)}>
                          {active ? "Done" : "Edit"}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => move(s.id, -1)}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={i === sections.length - 1} onClick={() => move(s.id, 1)}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Duplicate block" onClick={() => duplicateSection(s.id)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div
                      className="px-4 cursor-pointer [&_img]:!scale-100 [&_img]:!transition-none [&_[data-part]]:cursor-pointer [&_[data-part]]:rounded-sm [&_[data-part]]:transition-shadow [&_[data-part]:hover]:ring-2 [&_[data-part]:hover]:ring-primary/50 [&_[data-part]:hover]:ring-offset-2"
                      onClick={(e) => pickPart(s.id, e)}
                      onDoubleClick={(e) => editInline(s.id, e)}
                    >
                      {s.type === "free" && !s.images.length && !s.heading && !s.eyebrow && !s.body && !s.buttonLabel ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          Blank space — add a title, an eyebrow, text, an image, or a button below.
                        </p>
                      ) : (
                        <SectionView section={s} />
                      )}
                    </div>

                    {active && (
                      <div data-inspector-section={s.id} className="border-t bg-muted/20 p-4">
                        {Inspector({ section: s })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {object && !preview && (
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
            <div className="w-[84px] rounded-lg border bg-background p-2 shadow-sm">
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Add
              </p>
              <div className="flex flex-col gap-1.5">
                {ADD_ITEMS.map((item) => (
                  <button
                    key={item.kind}
                    type="button"
                    title={`Add ${item.label.toLowerCase()}`}
                    onClick={() => addElement(item.kind)}
                    className="flex flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-[10px] text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
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
                <Dropdown
                  label="Height"
                  value={gEff.imageHeight ?? "auto"}
                  options={IMAGE_HEIGHTS.map((h) => ({ value: h.value as string, label: h.label }))}
                  onChange={(v) => patchG({ imageHeight: v as ImageHeight })}
                />
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
                value={sec.layout ?? "stacked"}
                options={[
                  { value: "stacked", label: "Below text", icon: Rows2 },
                  { value: "beside", label: "Beside text", icon: Columns2 },
                  { value: "behind", label: "Behind text", icon: Layers },
                ]}
                onChange={(v) => patch(sec.id, { layout: v })}
              />
              {sec.layout === "beside" && (
                <Dropdown
                  label="Side"
                  value={sec.imageSide ?? "left"}
                  options={[
                    { value: "left", label: "Left", icon: PanelLeft },
                    { value: "right", label: "Right", icon: PanelRight },
                  ]}
                  onChange={(v) => patch(sec.id, { imageSide: v })}
                />
              )}
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
            <Dropdown
              label="Size"
              value={es.sizePx ? "" : (es.size ?? "")}
              options={[{ value: "", label: "Default" }, ...TEXT_SIZES.map((s) => ({ value: s.value as string, label: SIZE_WORD[s.value] ?? s.label }))]}
              onChange={(v) => set({ size: (v || undefined) as TextSize | undefined, sizePx: undefined })}
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
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "outline", label: "Outline" },
                  { value: "link", label: "Text link" },
                ]}
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
