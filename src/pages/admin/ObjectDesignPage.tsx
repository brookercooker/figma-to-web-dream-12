import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowDown, ArrowUp, Eye, GalleryHorizontal, Image as ImageIcon,
  Images, LayoutPanelLeft, MousePointerClick, Pencil, Plus, Save, Trash2, Type,
} from "lucide-react";
import CreateObjectDialog from "./CreateObjectDialog";
import ImagePickerDialog from "./ImagePickerDialog";
import {
  SECTION_LABEL, SectionView, TEXT_COLORS, TEXT_FONTS, TEXT_SIZES, makeSection, parseSections,
  type Section, type SectionAlign, type SectionImage, type SectionType,
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

const PALETTE: { type: SectionType; Icon: typeof Type }[] = [
  { type: "carousel", Icon: GalleryHorizontal },
  { type: "imageRow", Icon: Images },
  { type: "captionedImages", Icon: ImageIcon },
  { type: "overlay", Icon: Type },
  { type: "split", Icon: LayoutPanelLeft },
  { type: "button", Icon: MousePointerClick },
];

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

function TextStyleFields({
  label, value, defaults, onChange,
}: {
  label: string;
  value: TextStyle | undefined;
  defaults: { font: TextFont; color: TextColor; size: TextSize };
  onChange: (next: TextStyle) => void;
}) {
  const style = value ?? {};
  const set = (changes: Partial<TextStyle>) => onChange({ ...style, ...changes });
  return (
    <div className="rounded-md border p-3 space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-4">
        <Field label="Font">
          <div>
            <Choice
              value={style.font ?? defaults.font}
              options={TEXT_FONTS}
              onChange={(v) => set({ font: v })}
            />
          </div>
        </Field>
        <Field label="Size">
          <div>
            <Choice
              value={style.size ?? defaults.size}
              options={TEXT_SIZES}
              onChange={(v) => set({ size: v })}
            />
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
    setSections(parsed);
    setActiveId("");
    setDirty(false);
    setPreview(parsed.length > 0);
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

  const Inspector = ({ section }: { section: Section }) => {
    switch (section.type) {
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
                {PALETTE.map(({ type, Icon }) => (
                  <Button key={type} variant="outline" size="sm" className="gap-2" onClick={() => add(type)}>
                    <Icon className="w-4 h-4" /> {SECTION_LABEL[type]}
                  </Button>
                ))}
              </div>

              {!sections.length && (
                <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
                  Add a carousel, a row of images, an image with text, or a button to begin.
                </div>
              )}

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
                      className="px-4 cursor-pointer"
                      onClick={() => { if (!active) setActiveId(s.id); }}
                    >
                      <SectionView section={s} />
                    </div>

                    {active && (
                      <div className="border-t bg-muted/20 p-4">
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

      <CreateObjectDialog
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) load(); }}
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
