import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Bold, Heading, Image as ImageIcon, Italic, Plus, Save,
  AlignCenter, AlignLeft, AlignRight, Trash2, Type, ExternalLink, Pencil, Boxes,
} from "lucide-react";
import CreatePageDialog from "./CreatePageDialog";
import ImagePickerDialog from "./ImagePickerDialog";
import ObjectPickerDialog from "./ObjectPickerDialog";
import { BlockView, newId, parseBlocks, type Block, type BlockAlign, type ImageBlock, type ObjectBlock, type TextBlock } from "@/components/PageBlocks";

interface PageRow { id: string; name: string; path: string; content: unknown; updated_at: string }

const SIZES: TextBlock["size"][] = ["sm", "md", "lg", "xl"];
const SIZE_LABEL: Record<TextBlock["size"], string> = { sm: "S", md: "M", lg: "L", xl: "XL" };

function ToolButton({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      onClick={onClick}
      className={`h-8 min-w-8 px-2 inline-flex items-center justify-center rounded-md border text-xs transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
      }`}
    >
      {children}
    </button>
  );
}

export default function DesignTab() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("page") ?? "";

  const [pages, setPages] = useState<PageRow[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  // block id waiting for an object choice, or "new" when adding one
  const [objectFor, setObjectFor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showLive, setShowLive] = useState(true);
  // Pages built in code have no editable blocks yet: show them as one locked section.
  const [hasExisting, setHasExisting] = useState(false);
  const [currentFirst, setCurrentFirst] = useState(true);


  const load = async () => {
    const { data } = await (supabase as any)
      .from("pages")
      .select("id,name,path,content,updated_at")
      .is("archived_at", null)
      .order("name", { ascending: true });
    setPages(data ?? []);
    return (data ?? []) as PageRow[];
  };

  useEffect(() => { load(); }, []);

  const page = useMemo(() => pages.find((p) => p.id === selectedId) ?? null, [pages, selectedId]);

  useEffect(() => {
    const parsed = parseBlocks(page?.content);
    setBlocks(parsed);
    setActiveId("");
    setDirty(false);
    // Pages that already have a design open showing exactly how they look today.
    setShowLive(!parsed.length);
    setHasExisting(!parsed.length && !!page);
    setCurrentFirst(true);
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term
      ? pages.filter((p) => `${p.name} ${p.path}`.toLowerCase().includes(term))
      : pages;
  }, [pages, q]);

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("page", id);
    setParams(next, { replace: true });
  };

  const update = (id: string, patch: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
    setDirty(true);
  };

  const addBlock = (type: Block["type"], at?: number) => {
    const base = { id: newId(), align: "left" as BlockAlign };
    const block: Block =
      type === "image"
        ? { ...base, type: "image", url: "", alt: "", width: 100 } as ImageBlock
        : type === "heading"
          ? { ...base, type: "heading", text: "New heading", size: "lg" } as TextBlock
          : { ...base, type: "text", text: "Write something here.", size: "md" } as TextBlock;
    setBlocks((prev) => {
      const i = at === undefined ? prev.length : Math.max(0, Math.min(prev.length, at));
      return [...prev.slice(0, i), block, ...prev.slice(i)];
    });
    setActiveId(block.id);
    setShowLive(false);
    setDirty(true);
    if (type === "image") setPickerFor(block.id);
  };

  const move = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setDirty(true);
  };

  const remove = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setDirty(true);
  };

  const save = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("pages")
        .update({ content: blocks, build_status: "ready" })
        .eq("id", page.id);
      if (error) throw error;
      await load();
      setDirty(false);
      toast.success(`Saved — your page is live at ${page.path}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the page");
    } finally { setSaving(false); }
  };

  const addRow = (at: number, label: string) => (
    <div className="my-3 flex flex-wrap items-center gap-2 rounded-lg border border-dashed px-3 py-2">
      <span className="mr-1 text-xs text-muted-foreground">{label}</span>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("heading", at)}>
        <Heading className="w-4 h-4" /> Heading
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("text", at)}>
        <Type className="w-4 h-4" /> Text
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("image", at)}>
        <ImageIcon className="w-4 h-4" /> Image
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => { setObjectAt(at); setObjectFor("new"); }}>
        <Boxes className="w-4 h-4" /> Object
      </Button>
    </div>
  );

  const existingCard = page ? (
    <div key="current-page-section">
      {addRow(0, "Add a section above")}
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex items-center gap-2 border-b bg-muted px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">Current page</span>
          <span className="text-xs text-muted-foreground">Built in code — shown here so you can add around it</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setCurrentFirst((v) => !v)}
          >
            {currentFirst ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
        <iframe
          key={`${page.id}-${page.updated_at}-inline`}
          src={page.path}
          title={`${page.name} current content`}
          className="h-[46vh] w-full bg-background"
        />
      </div>
      {addRow(blocks.length, "Add a section below")}
    </div>
  ) : null;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Page list */}
      <aside className="space-y-3">
        <Button className="w-full gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> New page
        </Button>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages" />
        <div className="border rounded-lg divide-y max-h-[65vh] overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className={`w-full text-left px-3 py-2 transition-colors ${
                p.id === selectedId ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <div className="text-sm font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{p.path}</div>
            </button>
          ))}
          {!filtered.length && <p className="p-3 text-sm text-muted-foreground">No pages found.</p>}
        </div>
      </aside>

      {/* Editor */}
      <section className="min-w-0">
        {!page ? (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            Pick a page on the left to design it, or create a new one.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="mr-auto">
                <h2 className="text-lg font-medium">{page.name}</h2>
                <a
                  href={page.path}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground font-mono inline-flex items-center gap-1 hover:text-foreground"
                >
                  {page.path} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="inline-flex rounded-md border overflow-hidden mr-1">
                <button
                  type="button"
                  onClick={() => setShowLive(true)}
                  className={`px-3 py-1.5 text-xs transition-colors ${showLive ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Current page
                </button>
                <button
                  type="button"
                  onClick={() => setShowLive(false)}
                  className={`px-3 py-1.5 text-xs transition-colors ${!showLive ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Edit
                </button>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("heading")}>
                <Heading className="w-4 h-4" /> Heading
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("text")}>
                <Type className="w-4 h-4" /> Text
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => addBlock("image")}>
                <ImageIcon className="w-4 h-4" /> Image
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setObjectFor("new")}>
                <Boxes className="w-4 h-4" /> Object
              </Button>
              <Button size="sm" className="gap-2" onClick={save} disabled={saving || !dirty}>
                <Save className="w-4 h-4" /> {saving ? "Saving…" : dirty ? "Save" : "Saved"}
              </Button>
            </div>

            {showLive ? (
              <div className="border rounded-lg overflow-hidden bg-background">
                <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2">
                  <p className="text-xs text-muted-foreground">
                    {blocks.length
                      ? "This is how the page looks right now. Switch to Edit to change it."
                      : "This is how the page looks right now. Add a heading, text, or an image to design it."}
                  </p>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowLive(false)}>
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                </div>
                <iframe
                  key={`${page.id}-${page.updated_at}`}
                  src={page.path}
                  title={`${page.name} preview`}
                  className="w-full h-[70vh] bg-background"
                />
              </div>
            ) : (
            <div className="border rounded-lg bg-background p-6 sm:p-10 min-h-[50vh]">
              {!blocks.length && !hasExisting && (
                <p className="text-sm text-muted-foreground text-center py-16">
                  This page is empty. Add a heading, some text, or an image to begin.
                </p>
              )}

              <div className="max-w-3xl mx-auto">
                {hasExisting && currentFirst && existingCard}
                {blocks.map((b, i) => {
                  const active = b.id === activeId;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setActiveId(b.id)}
                      className={`relative rounded-lg px-3 transition-colors cursor-text ${
                        active ? "ring-2 ring-primary/40 bg-muted/30" : "hover:bg-muted/20"
                      }`}
                    >
                      {active && (
                        <div className="sticky top-16 z-10 -mx-3 mb-2 flex flex-wrap items-center gap-1 border-b bg-background/95 px-3 py-2 backdrop-blur">
                          {b.type === "object" ? (
                            <>
                              <span className="px-1 text-xs text-muted-foreground">
                                Object: {b.name ?? "Saved object"} — edits made in Objects show up here
                              </span>
                              <ToolButton title="Swap object" onClick={() => setObjectFor(b.id)}>
                                <Boxes className="w-4 h-4" />
                              </ToolButton>
                            </>
                          ) : b.type !== "image" ? (
                            <>
                              <ToolButton
                                title={b.type === "heading" ? "Turn into text" : "Turn into heading"}
                                active={b.type === "heading"}
                                onClick={() => update(b.id, { type: b.type === "heading" ? "text" : "heading" } as Partial<Block>)}
                              >
                                <Heading className="w-4 h-4" />
                              </ToolButton>
                              <ToolButton title="Bold" active={!!b.bold} onClick={() => update(b.id, { bold: !b.bold } as Partial<Block>)}>
                                <Bold className="w-4 h-4" />
                              </ToolButton>
                              <ToolButton title="Italic" active={!!b.italic} onClick={() => update(b.id, { italic: !b.italic } as Partial<Block>)}>
                                <Italic className="w-4 h-4" />
                              </ToolButton>
                              <span className="mx-1 h-5 w-px bg-border" />
                              {SIZES.map((s) => (
                                <ToolButton key={s} title={`Size ${SIZE_LABEL[s]}`} active={b.size === s} onClick={() => update(b.id, { size: s } as Partial<Block>)}>
                                  {SIZE_LABEL[s]}
                                </ToolButton>
                              ))}
                            </>
                          ) : (
                            <>
                              <ToolButton title="Replace image" onClick={() => setPickerFor(b.id)}>
                                <ImageIcon className="w-4 h-4" />
                              </ToolButton>
                              <span className="mx-1 h-5 w-px bg-border" />
                              {([50, 75, 100] as const).map((w) => (
                                <ToolButton key={w} title={`Width ${w}%`} active={b.width === w} onClick={() => update(b.id, { width: w } as Partial<Block>)}>
                                  {w}%
                                </ToolButton>
                              ))}
                            </>
                          )}
                          <span className="mx-1 h-5 w-px bg-border" />
                          {(["left", "center", "right"] as BlockAlign[]).map((a) => (
                            <ToolButton key={a} title={`Align ${a}`} active={b.align === a} onClick={() => update(b.id, { align: a } as Partial<Block>)}>
                              {a === "left" ? <AlignLeft className="w-4 h-4" /> : a === "center" ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                            </ToolButton>
                          ))}
                          <span className="mx-1 h-5 w-px bg-border" />
                          <ToolButton title="Move up" onClick={() => move(b.id, -1)}><ArrowUp className="w-4 h-4" /></ToolButton>
                          <ToolButton title="Move down" onClick={() => move(b.id, 1)}><ArrowDown className="w-4 h-4" /></ToolButton>
                          <ToolButton title="Delete block" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></ToolButton>
                        </div>
                      )}

                      {b.type === "object" ? (
                        <div className="py-2">
                          <div className="pointer-events-none">
                            <BlockView block={b} />
                          </div>
                        </div>
                      ) : b.type === "image" ? (
                        <div className="py-2">
                          {b.url ? (
                            <BlockView block={b} />
                          ) : (
                            <button
                              onClick={() => setPickerFor(b.id)}
                              className="w-full border border-dashed rounded-lg py-12 text-sm text-muted-foreground hover:bg-muted/40"
                            >
                              Choose an image
                            </button>
                          )}
                          {active && (
                            <div className="grid sm:grid-cols-2 gap-2 mt-2">
                              <Input value={b.alt} placeholder="Describe the image" onChange={(e) => update(b.id, { alt: e.target.value } as Partial<Block>)} />
                              <Input value={b.caption ?? ""} placeholder="Caption (optional)" onChange={(e) => update(b.id, { caption: e.target.value } as Partial<Block>)} />
                            </div>
                          )}
                        </div>
                      ) : active ? (
                        <Textarea
                          value={b.text}
                          autoFocus
                          rows={b.type === "heading" ? 2 : 4}
                          onChange={(e) => update(b.id, { text: e.target.value } as Partial<Block>)}
                          className="my-3 resize-y"
                        />
                      ) : (
                        <BlockView block={b} />
                      )}
                      {i === blocks.length - 1 && <div className="h-2" />}
                    </div>
                  );
                })}
                {hasExisting && !currentFirst && existingCard}
              </div>
            </div>
            )}
          </>
        )}
      </section>

      <CreatePageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async (p) => { await load(); select(p.id); }}
      />
      <ObjectPickerDialog
        open={!!objectFor}
        onOpenChange={(v) => { if (!v) setObjectFor(null); }}
        onPick={({ id, name }) => {
          if (objectFor === "new") {
            const block: ObjectBlock = { id: newId(), type: "object", objectId: id, name, align: "left" };
            setBlocks((prev) => [...prev, block]);
            setActiveId(block.id);
            setShowLive(false);
          } else if (objectFor) {
            update(objectFor, { objectId: id, name } as Partial<Block>);
          }
          setDirty(true);
          setObjectFor(null);
        }}
      />
      <ImagePickerDialog
        open={!!pickerFor}
        onOpenChange={(v) => { if (!v) setPickerFor(null); }}
        onPick={({ url, alt }) => {
          if (pickerFor) update(pickerFor, { url, alt: alt || "" } as Partial<Block>);
          setPickerFor(null);
        }}
      />
    </div>
  );
}
