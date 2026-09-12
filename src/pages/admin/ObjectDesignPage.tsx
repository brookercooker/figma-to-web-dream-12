import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  Video as VideoIcon, Minus, Link as LinkIcon, Copy,
  type LucideIcon,
} from "lucide-react";
import CreateObjectDialog from "./CreateObjectDialog";
import ImagePickerDialog from "./ImagePickerDialog";
import VideoPickerDialog from "./VideoPickerDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BODY_PX, FREE_TEXT_KINDS, HEADING_PX, IMAGE_HEIGHTS, IMAGE_TEXT_DEFAULTS, IMAGE_TEXT_KINDS, MAX_TEXT_PX, MIN_TEXT_PX, SECTION_LABEL, SectionFlowList, SectionView, TEXT_COLORS, TEXT_FONTS, TEXT_SIZES, cleanEditedHtml, makeSection, orderParts, newSectionId, parseSections, withEyebrowDefaults,
  type FreeDivider, type FreeSection, type FreeTextKind, type SectionFlow, type ImageText, type ImageTextKind, type Section, type SectionAlign, type SectionImage, type SectionVideo, type SectionType,
  type TextColor, type TextFont, type TextSize, type TextStyle,
} from "@/components/ObjectSections";

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

  const patch = (id: string, changes: Record<string, unknown>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...changes } as Section) : s)));
    setDirty(true);
  };

  const patchExtra = (id: string, index: number, changes: { text?: string; style?: TextStyle; kind?: FreeTextKind }) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.type !== "free") return s;
        const extras = (s.extras ?? []).map((t, i) => (i === index ? { ...t, ...changes } : t));
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
    openBlock("Images");
    setOpenSub({
      [`img:${sectionId}:${index}`]: true,
      [`txt:${sectionId}:${index}:${texts.length}`]: true,
    });
  };

  const patchImageText = (
    sectionId: string, index: number, tIdx: number, changes: Partial<ImageText>,
  ) => {
    const texts = imageTextsOf(sectionId, index).map((t, i) => (i === tIdx ? { ...t, ...changes } : t));
    patchImage(sectionId, index, { texts });
  };

  const removeImageText = (sectionId: string, index: number, tIdx: number) => {
    patchImage(sectionId, index, { texts: imageTextsOf(sectionId, index).filter((_, i) => i !== tIdx) });
  };

  const addImageSlot = (id: string) => {
    let newIndex = 0;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id && "images" in s) {
          const images = [...(s as any).images, { url: "", alt: "" }];
          newIndex = images.length - 1;
          return { ...s, images } as Section;
        }
        return s;
      }),
    );
    setDirty(true);
    openBlock("Images");
    setOpenSub({ [`img:${id}:${newIndex}`]: true });
    setPicker({ sectionId: id, index: newIndex });
  };


  const removeImageSlot = (id: string, index: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id && "images" in s
          ? ({ ...s, images: (s as any).images.filter((_: unknown, i: number) => i !== index) } as Section)
          : s,
      ),
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
    openBlock("Images");
    setOpenSub({ [`img:${id}:${index + 1}`]: true });
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
        {index >= 0 && "images" in section && (section as any).images.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => removeImageSlot(section.id, index)}>
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
          {(image.texts ?? []).map((t, ti) => {
            const tKey = `txt:${section.id}:${index}:${ti}`;
            const tOpen = openSub[tKey] ?? focusPart === `imagetext:${index}:${ti}`;
            const kindLabel = IMAGE_TEXT_KINDS.find((k) => k.value === t.kind)?.label ?? "Text";
            return (
            <div key={t.id} className="space-y-2 rounded border bg-muted/30 p-2">
              <div className="flex items-center gap-2">
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
            </div>
            );
          })}
          <div className="flex flex-wrap gap-1.5">
            {IMAGE_TEXT_KINDS.map((k) => (
              <Button
                key={k.value}
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => addImageText(section.id, index, k.value)}
              >
                <Plus className="w-3 h-3" /> {k.label}
              </Button>
            ))}
          </div>
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
                min={5}
                max={100}
                className="h-8 w-20"
                placeholder="Auto"
                value={section.flowWidths?.[part] ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = { ...(section.flowWidths ?? {}) };
                  if (raw === "") delete next[part];
                  else next[part] = Math.min(100, Math.max(5, Number(raw) || 0));
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
    if (s.buttonLabel !== undefined) base.push("button");
    (s.dividers ?? []).forEach((_, i) => base.push(`divider:${i}`));
    return orderParts(base.map((p) => ({ part: p })), s.order).map((x) => x.part);
  };

  const movePartIn = (s: FreeSection, from: string, to: string) => {
    if (from === to) return;
    const parts = orderablePartsOf(s);
    const next = parts.filter((p) => p !== from);
    const at = next.indexOf(to);
    next.splice(at === -1 ? next.length : at, 0, from);
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
    return (
      <div
        key={key}
        data-inspector-part={part}
        onDragOver={canDrag ? (e) => { if (dragPart?.sectionId === flowSection!.id) e.preventDefault(); } : undefined}
        onDrop={canDrag ? (e) => {
          e.preventDefault();
          if (dragPart?.sectionId === flowSection!.id) movePartIn(flowSection!, dragPart.part, part!);
          setDragPart(null);
        } : undefined}
        className={`scroll-mt-24 rounded-lg border bg-background shadow-sm ${dragging ? "border-primary opacity-70" : ""}`}
      >
        <div
          draggable={canDrag}
          onDragStart={canDrag ? () => setDragPart({ sectionId: flowSection!.id, part: part! }) : undefined}
          onDragEnd={canDrag ? () => setDragPart(null) : undefined}
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
        return 
          Block({
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
                      value={d.width ?? "full"}
                      options={[
                        { value: "full" as const, label: "Full width", icon: Minus },
                        { value: "short" as const, label: "Short", icon: Minus },
                      ]}
                      onChange={(v) => patchDivider(section.id, i, { width: v })}
                    />
                  </div>
                </Field>
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
                  Drag this bar in the Arrangement list to move it between items.
                </p>
              </>
            ),
          });
      }
      return null;
    };



    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip label="Eyebrow" icon={Tag} onClick={() => {
            if (hasEyebrow) {
              const id = newSectionId();
              patch(section.id, { extras: [...(section.extras ?? []), { id, text: "Since 1951", kind: "eyebrow" as const }] });
              openBlock(id);
            } else { patch(section.id, { eyebrow: "Since 1951" }); openBlock("eyebrow"); }
          }} />
          <Chip label="Title" icon={Heading} onClick={() => {
            if (hasTitle) {
              const id = newSectionId();
              patch(section.id, { extras: [...(section.extras ?? []), { id, text: "A quiet statement", kind: "title" as const }] });
              openBlock(id);
            } else { patch(section.id, { heading: "A quiet statement" }); openBlock("heading"); }
          }} />
          <Chip
            label="Text"
            icon={AlignLeft}
            onClick={() => {
              if (hasBody) {
                const id = newSectionId();
                patch(section.id, {
                  extras: [...(section.extras ?? []), { id, text: "" }],
                });
                openBlock(id);
              } else {
                patch(section.id, { body: "" });
                openBlock("body");
              }
            }}
          />
          <Chip label="Image" icon={ImageIcon} onClick={() => addImageSlot(section.id)} />
          <Chip label="Video" icon={VideoIcon} onClick={() => addVideoSlot(section.id)} />
          <Chip
            label="Divider"
            icon={Minus}
            onClick={() => {
              const id = newSectionId();
              patch(section.id, {
                dividers: [...(section.dividers ?? []), { id, color: "stone", width: "full", thickness: 1 }],
              });
              openBlock(id);
            }}
          />
          {!hasButton && <Chip label="Button" icon={MousePointerClick} onClick={() => { patch(section.id, { buttonLabel: "Explore", buttonHref: "/" }); openBlock("button"); }} />}
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
              <p className="text-xs text-muted-foreground">
                Drag an element's header below to move it up or down.
              </p>
            )}
          </>
        ) })}
















        {parts.map((p) => <React.Fragment key={p}>{renderPart(p)}</React.Fragment>)}

        {section.images.length > 0 && Block({ title: "Images", icon: ImageIcon, onDelete: () => patch(section.id, { images: [] }), children: (
          <>

            <div className="grid gap-3 sm:grid-cols-2">
              {section.images.map((img, i) => (
                <div key={i} data-inspector-part={`image:${i}`} className="scroll-mt-24">
                  {ImageEditor({ section, index: i, image: img, showCaption: true })}
                </div>
              ))}

            </div>
            <Field label="Border around image and text">
              <div>
                <Choice
                  value={section.imageBorder ? "on" : "off"}
                  options={[
                    { value: "off" as const, label: "None" },
                    { value: "on" as const, label: "Border" },
                  ]}
                  onChange={(v) => patch(section.id, { imageBorder: v === "on" || undefined })}
                />
              </div>
            </Field>
            <div className="flex flex-wrap gap-4">
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
              {section.layout !== "behind" && section.images.length > 0 && (
                <Field label="Image height">
                  <div>
                    <Choice
                      value={section.imageHeight ?? "auto"}
                      options={IMAGE_HEIGHTS.map((h) => ({ value: h.value, label: h.label }))}
                      onChange={(v) => patch(section.id, { imageHeight: v })}
                    />
                  </div>
                </Field>
              )}
              {section.layout !== "behind" && section.images.length > 0 && section.gallery !== "carousel" && (
                <Field label="Image position">
                  <div>
                    <Choice
                      value={section.imageAlign ?? "left"}
                      options={[
                        { value: "left" as const, label: "Left", icon: AlignLeft },
                        { value: "center" as const, label: "Center", icon: AlignCenter },
                        { value: "right" as const, label: "Right", icon: AlignRight },
                      ]}
                      onChange={(v) => patch(section.id, { imageAlign: v })}
                    />
                  </div>
                </Field>
              )}
              {section.layout !== "behind" && section.images.length > 1 && (
                <>
                  <Field label="Show as">
                    <div>
                      <Choice
                        value={section.gallery}
                        options={[
                          { value: "grid" as const, label: "Grid", icon: LayoutGrid },
                          { value: "carousel" as const, label: "Carousel", icon: GalleryHorizontal },
                        ]}
                        onChange={(v) => patch(section.id, { gallery: v })}
                      />
                    </div>
                  </Field>
                  {section.gallery === "carousel" && (
                    <Field label="Show at once">
                      <div>
                        <Choice
                          value={Math.min(section.perView ?? 1, section.images.length)}
                          options={Array.from(
                            { length: Math.min(section.images.length, 6) },
                            (_, k) => ({ value: k + 1, label: String(k + 1) }),
                          )}
                          onChange={(v) => patch(section.id, { perView: v })}
                        />
                      </div>
                    </Field>
                  )}
                </>
              )}
            </div>
          </>
        ) })}

        {(section.videos ?? []).length > 0 && Block({ title: "Videos", icon: VideoIcon, onDelete: () => patch(section.id, { videos: [] }), children: (
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
        ) })}



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

      <main className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 px-4 py-6">
        <aside className="space-y-3">
          <Button className="w-full gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New object
          </Button>
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
                              min={5}
                              max={100}
                              className="h-8 w-20"
                              placeholder="Auto"
                              value={s.flowWidth ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                patch(s.id, {
                                  flowWidth: raw === "" ? undefined : Math.min(100, Math.max(5, Number(raw) || 0)),
                                } as Partial<Section>);
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
      </main>

      {toolbar && (() => {
        const sec = sections.find((s) => s.id === toolbar.sectionId) as FreeSection | undefined;
        if (!sec) return null;
        const anchorTop = toolbar.top - 52;

        if (toolbar.imageIndex !== undefined) {
          const idx = toolbar.imageIndex;
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
                  value={sec.imageHeight ?? "auto"}
                  options={IMAGE_HEIGHTS.map((h) => ({ value: h.value as string, label: h.label }))}
                  onChange={(v) => patch(sec.id, { imageHeight: v })}
                />
              )}
              {sec.layout !== "behind" && sec.gallery !== "carousel" && (
                <Dropdown
                  label="Position"
                  value={sec.imageAlign ?? "left"}
                  options={[
                    { value: "left", label: "Left", icon: AlignLeft },
                    { value: "center", label: "Center", icon: AlignCenter },
                    { value: "right", label: "Right", icon: AlignRight },
                  ]}
                  onChange={(v) => patch(sec.id, { imageAlign: v })}
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
              {sec.layout !== "behind" && (sec.images?.length ?? 0) > 1 && (
                <Dropdown
                  label="Show as"
                  value={sec.gallery ?? "grid"}
                  options={[
                    { value: "grid", label: "Grid", icon: LayoutGrid },
                    { value: "carousel", label: "Carousel", icon: GalleryHorizontal },
                  ]}
                  onChange={(v) => patch(sec.id, { gallery: v })}
                />
              )}
              {sec.layout !== "behind" && sec.gallery === "carousel" && (sec.images?.length ?? 0) > 1 && (
                <Dropdown
                  label="Show at once"
                  value={String(Math.min(sec.perView ?? 1, sec.images.length))}
                  options={Array.from({ length: Math.min(sec.images.length, 6) }, (_, k) => ({
                    value: String(k + 1), label: String(k + 1),
                  }))}
                  onChange={(v) => patch(sec.id, { perView: Number(v) })}
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
