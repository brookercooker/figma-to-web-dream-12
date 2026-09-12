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
  type LucideIcon,
} from "lucide-react";
import CreateObjectDialog from "./CreateObjectDialog";
import ImagePickerDialog from "./ImagePickerDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IMAGE_HEIGHTS, SECTION_LABEL, SectionView, TEXT_COLORS, TEXT_FONTS, TEXT_SIZES, makeSection, parseSections,
  type FreeSection, type Section, type SectionAlign, type SectionImage, type SectionType,
  type TextColor, type TextFont, type TextSize, type TextStyle,
} from "@/components/ObjectSections";

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
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs transition-colors ${
            o.value === value ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
          }`}
        >
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
            <div>
              <Choice
                value={style.size ?? defaults.size}
                options={TEXT_SIZES}
                onChange={(v) => set({ size: v })}
              />
            </div>
          </Field>
        )}
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

function Dropdown({
  label, value, options, onChange,
}: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
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
      className="inline-block h-3 w-3 shrink-0 rounded-full border"
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
  // which element of the active section the user clicked on in the preview
  const [focusPart, setFocusPart] = useState("");
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
    const field =
      part === "eyebrow" ? "eyebrow"
      : part === "heading" ? "heading"
      : part === "body" ? "body"
      : part === "button" ? "buttonLabel"
      : captionIdx >= 0 ? "caption"
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
      const value = (target.innerText ?? "").replace(/\u00a0/g, " ").trim();
      target.contentEditable = "false";
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.removeEventListener("blur", commit);
      target.removeEventListener("keydown", onKey);
      target.removeEventListener("click", stop);
      if (captionIdx >= 0) patchImage(sectionId, captionIdx, { caption: value });
      else patch(sectionId, { [field]: value });
    };
    const onKey = (ev: KeyboardEvent) => {
      ev.stopPropagation();
      if (ev.key === "Escape") { ev.preventDefault(); target.blur(); }
      if (ev.key === "Enter" && field !== "body") { ev.preventDefault(); target.blur(); }
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
    // captions are edited alongside their image
    setFocusPart(part.startsWith("caption:") ? part.replace("caption:", "image:") : part);

    // Text elements get a floating font / size / color toolbar.
    const field = STYLE_FIELD[part.startsWith("caption:") ? "caption" : part];
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

  const addImageSlot = (id: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id && "images" in s
          ? ({ ...s, images: [...(s as any).images, { url: "", alt: "" }] } as Section)
          : s,
      ),
    );
    setDirty(true);
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
  }: { section: Section; index: number; image: SectionImage; showCaption?: boolean }) => (
    <div className="rounded-md border p-3 space-y-2 bg-background">
      <div className="flex items-center gap-2">
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
          {image.url ? (
            <img src={image.url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPicker({ sectionId: section.id, index })}
        >
          {image.url ? "Replace" : "Choose image"}
        </Button>
        {index >= 0 && "images" in section && (section as any).images.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => removeImageSlot(section.id, index)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      <Input
        value={image.alt}
        placeholder="Describe the image"
        onChange={(e) => patchImage(section.id, index, { alt: e.target.value })}
      />
      {showCaption && (
        <Input
          value={image.caption ?? ""}
          placeholder="Caption (optional)"
          onChange={(e) => patchImage(section.id, index, { caption: e.target.value })}
        />
      )}
    </div>
  );

  const Chip = ({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) => (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={onClick}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </Button>
  );

  const freeInspector = (section: FreeSection) => {
    const hasTitle = section.heading !== undefined;
    const hasEyebrow = section.eyebrow !== undefined;
    const hasBody = section.body !== undefined;
    const hasButton = section.buttonLabel !== undefined;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {!hasEyebrow && <Chip label="Eyebrow" icon={Tag} onClick={() => patch(section.id, { eyebrow: "Since 1951" })} />}
          {!hasTitle && <Chip label="Title" icon={Heading} onClick={() => patch(section.id, { heading: "A quiet statement" })} />}
          {!hasBody && <Chip label="Text" icon={AlignLeft} onClick={() => patch(section.id, { body: "" })} />}
          <Chip label="Image" icon={ImageIcon} onClick={() => addImageSlot(section.id)} />
          {!hasButton && <Chip label="Button" icon={MousePointerClick} onClick={() => patch(section.id, { buttonLabel: "Explore", buttonHref: "/" })} />}
        </div>

        {hasEyebrow && (
          <div data-inspector-part="eyebrow" className="space-y-2 scroll-mt-24">

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Eyebrow">
                  <Input value={section.eyebrow ?? ""} onChange={(e) => patch(section.id, { eyebrow: e.target.value })} />
                </Field>
              </div>
              <Button variant="ghost" size="sm" onClick={() => patch(section.id, { eyebrow: undefined })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <TextStyleFields
              label="Eyebrow style"
              value={section.eyebrowStyle}
              defaults={{ font: "sans", color: "stone", size: "sm" }}
              onChange={(v) => patch(section.id, { eyebrowStyle: v })}
              colorOnly
            />
          </div>
        )}

        {hasTitle && (
          <div data-inspector-part="heading" className="space-y-2 scroll-mt-24">

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Title">
                  <Input value={section.heading ?? ""} onChange={(e) => patch(section.id, { heading: e.target.value })} />
                </Field>
              </div>
              <Button variant="ghost" size="sm" onClick={() => patch(section.id, { heading: undefined })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <TextStyleFields
              label="Title style"
              value={section.textStyle}
              defaults={{ font: "serif", color: "ink", size: "lg" }}
              onChange={(v) => patch(section.id, { textStyle: v })}
            />
          </div>
        )}

        {hasBody && (
          <div data-inspector-part="body" className="space-y-2 scroll-mt-24">

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Text">
                  <Textarea rows={4} value={section.body ?? ""} onChange={(e) => patch(section.id, { body: e.target.value })} />
                </Field>
              </div>
              <Button variant="ghost" size="sm" onClick={() => patch(section.id, { body: undefined })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <TextStyleFields
              label="Text style"
              value={section.bodyStyle}
              defaults={{ font: "sans", color: "stone", size: "md" }}
              onChange={(v) => patch(section.id, { bodyStyle: v })}
            />
          </div>
        )}

        {section.images.length > 0 && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {section.images.map((img, i) => (
                <div key={i} data-inspector-part={`image:${i}`} className="scroll-mt-24">
                  {ImageEditor({ section, index: i, image: img, showCaption: true })}
                </div>
              ))}

            </div>
            <TextStyleFields
              label="Caption style"
              value={section.captionStyle}
              defaults={{ font: "sans", color: "stone", size: "sm" }}
              onChange={(v) => patch(section.id, { captionStyle: v })}
            />
            <div className="flex flex-wrap gap-4">
              <Field label="Images sit">
                <div>
                  <Choice
                    value={section.layout}
                    options={[
                      { value: "stacked" as const, label: "Below text" },
                      { value: "beside" as const, label: "Beside text" },
                      { value: "behind" as const, label: "Behind text" },
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
                        { value: "left" as const, label: "Left" },
                        { value: "right" as const, label: "Right" },
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
                        { value: "left" as const, label: "Left" },
                        { value: "center" as const, label: "Center" },
                        { value: "right" as const, label: "Right" },
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
                          { value: "grid" as const, label: "Grid" },
                          { value: "carousel" as const, label: "Carousel" },
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
          </div>
        )}

        {hasButton && (
          <div data-inspector-part="button" className="space-y-2 scroll-mt-24">
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
              <Button variant="ghost" size="sm" onClick={() => patch(section.id, { buttonLabel: undefined })}>
                <Trash2 className="w-4 h-4" /> Remove button
              </Button>
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
          </div>
        )}

        <Field label="Alignment">
          <div>
            <Choice
              value={section.align}
              options={[
                { value: "left" as SectionAlign, label: "Left" },
                { value: "center" as SectionAlign, label: "Center" },
                { value: "right" as SectionAlign, label: "Right" },
              ]}
              onChange={(v) => patch(section.id, { align: v })}
            />
          </div>
        </Field>
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
              defaults={{ font: "serif", color: "cream", size: "lg" }}
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
              value={section.eyebrowStyle}
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
                      { value: "left" as SectionAlign, label: "Left" },
                      { value: "center" as SectionAlign, label: "Center" },
                      { value: "right" as SectionAlign, label: "Right" },
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
                    { value: "left" as const, label: "Left" },
                    { value: "right" as const, label: "Right" },
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
              defaults={{ font: "serif", color: "ink", size: "lg" }}
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
              value={section.eyebrowStyle}
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
                      { value: "left" as SectionAlign, label: "Left" },
                      { value: "center" as SectionAlign, label: "Center" },
                      { value: "right" as SectionAlign, label: "Right" },
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
                  sections.map((s) => <SectionView key={s.id} section={s} />)
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Nothing here yet. Switch to Edit and add a section.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => add("free")}>
                  <Plus className="w-4 h-4" /> Add another section
                </Button>
              </div>


              {sections.map((s, i) => {
                const active = s.id === activeId;
                return (
                  <div key={s.id} className={`border rounded-lg ${active ? "ring-2 ring-primary/40" : ""}`}>
                    <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                      <span className="text-xs font-medium">{SECTION_LABEL[s.type]}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setActiveId(active ? "" : s.id)}>
                          {active ? "Done" : "Edit"}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => move(s.id, -1)}>
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled={i === sections.length - 1} onClick={() => move(s.id, 1)}>
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div
                      className="px-4 cursor-pointer [&_[data-part]]:cursor-pointer [&_[data-part]]:rounded-sm [&_[data-part]]:transition-shadow [&_[data-part]:hover]:ring-2 [&_[data-part]:hover]:ring-primary/50 [&_[data-part]:hover]:ring-offset-2"
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
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                  ]}
                  onChange={(v) => patch(sec.id, { imageAlign: v })}
                />
              )}
              <Dropdown
                label="Sits"
                value={sec.layout ?? "stacked"}
                options={[
                  { value: "stacked", label: "Below text" },
                  { value: "beside", label: "Beside text" },
                  { value: "behind", label: "Behind text" },
                ]}
                onChange={(v) => patch(sec.id, { layout: v })}
              />
              {sec.layout === "beside" && (
                <Dropdown
                  label="Side"
                  value={sec.imageSide ?? "left"}
                  options={[
                    { value: "left", label: "Left" },
                    { value: "right", label: "Right" },
                  ]}
                  onChange={(v) => patch(sec.id, { imageSide: v })}
                />
              )}
              {sec.layout !== "behind" && (sec.images?.length ?? 0) > 1 && (
                <Dropdown
                  label="Show as"
                  value={sec.gallery ?? "grid"}
                  options={[
                    { value: "grid", label: "Grid" },
                    { value: "carousel", label: "Carousel" },
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

        const style = ((sec as any)[toolbar.field as string] ?? {}) as TextStyle;
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
        const set = (changes: Partial<TextStyle>) =>
          patch(toolbar.sectionId, { [String(toolbar.field)]: { ...style, ...changes } });
        return (
          <div
            className="fixed z-50 flex items-center gap-3 rounded-lg border bg-background px-3 py-2 shadow-lg"
            style={{ top: Math.max(8, toolbar.top - 52), left: Math.max(8, toolbar.left) }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {STYLE_FIELD_LABEL[String(toolbar.field)]}
            </span>
            <Dropdown
              label="Font"
              value={style.font ?? defaultFont[String(toolbar.field)] ?? "sans"}
              options={TEXT_FONTS.map((f) => ({ value: f.value as string, label: f.label }))}
              onChange={(v) => set({ font: (v || undefined) as TextFont | undefined })}
            />
            <Dropdown
              label="Size"
              value={style.size ?? ""}
              options={[{ value: "", label: "Default" }, ...TEXT_SIZES.map((s) => ({ value: s.value as string, label: SIZE_WORD[s.value] ?? s.label }))]}
              onChange={(v) => set({ size: (v || undefined) as TextSize | undefined })}
            />
            <ColorDropdown
              label="Color"
              value={style.color ?? ""}
              fallback={defaultColor[String(toolbar.field)] ?? "ink"}
              options={TEXT_COLORS}
              onChange={(v) => set({ color: (v || undefined) as TextColor | undefined })}
            />
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
          </div>
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
    </div>
  );
}
