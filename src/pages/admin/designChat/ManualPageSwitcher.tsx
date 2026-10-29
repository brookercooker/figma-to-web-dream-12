import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useDesignChat } from "./DesignChatContext";
import { useEditorSlot } from "./EditorSlot";
import { loadManualPages, workingPageFrom } from "./pageSelection";
import { filterManualPages, manualPageAtPath, type ManualPage } from "./manualPageNavigation";

/** Both the header and the trusted edit-frame callback use this one guarded switch. */
export function useManualPageNavigation(finishing: boolean, setFinishing: (value: boolean) => void) {
  const chat = useDesignChat();
  const { hasChanges, saveAll, discardAll } = useEditorSlot();
  const [pages, setPages] = useState<ManualPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<ManualPage | null>(null);
  const busy = useRef(false);
  const disabled = !!chat.objectOpen || finishing;
  useEffect(() => {
    if (!chat.editing) return;
    let stale = false;
    setLoading(true); setFailed(false);
    void loadManualPages().then(rows => { if (!stale) setPages(rows); }).catch(() => { if (!stale) setFailed(true); }).finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [chat.editing]);
  const switchTo = useCallback((page: ManualPage) => {
    chat.selectPage(workingPageFrom(page));
    chat.startEditing();
    setPending(null);
  }, [chat.selectPage, chat.startEditing]);
  const requestPage = (page: ManualPage) => {
    if (disabled || busy.current || pending || page.id === chat.workingPage?.id) return;
    if (hasChanges()) setPending(page);
    else switchTo(page);
  };
  const requestPath = (path: string) => {
    if (disabled || busy.current || pending) return;
    const page = manualPageAtPath(pages, path);
    if (!page) { toast("That page isn't in the Site Manager."); return; }
    requestPage(page);
  };
  const resolve = async (save: boolean) => {
    if (!pending || disabled || busy.current) return;
    busy.current = true; setFinishing(true);
    try {
      if (save) { if (!await saveAll()) return; }
      else await discardAll();
      switchTo(pending);
    } catch { /* The editor reports save/restoration errors; keep the current page open. */ }
    finally { busy.current = false; setFinishing(false); }
  };
  return { pages, loading, failed, disabled, pending, setPending, requestPage, requestPath, resolve };
}

type Navigation = ReturnType<typeof useManualPageNavigation>;
export default function ManualPageSwitcher({ navigation }: { navigation: Navigation }) {
  const { workingPage } = useDesignChat();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousId = useRef(workingPage?.id);
  const choosing = useRef(false);
  useEffect(() => {
    if (previousId.current === workingPage?.id) return;
    previousId.current = workingPage?.id;
    setOpen(false); setQuery("");
    requestAnimationFrame(() => heading.current?.focus());
  }, [workingPage?.id]);
  const { pages, disabled, loading, failed, pending } = navigation;
  const index = pages.findIndex(page => page.id === workingPage?.id);
  const filtered = filterManualPages(pages, query);
  const choose = (page: ManualPage) => { choosing.current = page.id !== workingPage?.id; setOpen(false); navigation.requestPage(page); };
  return <>
    <div className="flex min-w-0 items-center gap-1">
      <h2 ref={heading} tabIndex={-1} aria-label={`Editing ${workingPage?.name ?? "Page"}`} className="min-w-0 flex-1 outline-none">
        <Popover open={open} onOpenChange={value => { setOpen(value); if (value) { choosing.current = false; setQuery(""); } }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" disabled={disabled} className="h-auto w-full justify-between gap-1 px-1 py-1 text-left text-lg font-semibold" title={`Editing ${workingPage?.name}`}>
              <span className="min-w-0 truncate">Editing {workingPage?.name}</span><ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 max-w-[calc(100vw-24px)] p-0" onCloseAutoFocus={event => { if (choosing.current) event.preventDefault(); }}>
            <Command shouldFilter={false}>
              <CommandInput aria-label="Search Pages" placeholder="Search pages…" value={query} onValueChange={setQuery} />
              <CommandList>
                {loading ? <p role="status" className="p-3 text-sm text-muted-foreground">Loading pages…</p> : failed ? <p role="alert" className="p-3 text-sm text-destructive">Couldn't load pages. Try again later.</p> : <>
                  <CommandEmpty>No pages match your search.</CommandEmpty>
                  {(["static", "landing"] as const).filter(type => filtered.some(page => (page.page_type === "landing") === (type === "landing"))).map(type => <CommandGroup key={type} heading={type === "landing" ? "Landing Pages" : "Pages"}>
                    {filtered.filter(page => (page.page_type === "landing") === (type === "landing")).map(page => <CommandItem key={page.id} value={page.id} onSelect={() => choose(page)}>
                      <span className="min-w-0 flex-1"><span className="block truncate">{page.name}</span><span className="block truncate text-xs text-muted-foreground">{page.path}</span></span>
                      {page.build_status !== "ready" && <Badge variant="secondary" className="ml-2">Draft</Badge>}
                      {page.id === workingPage?.id && <Check className="ml-2 h-4 w-4 shrink-0" aria-label="Current Page" />}
                    </CommandItem>)}
                  </CommandGroup>)}
                </>}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </h2>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Previous Page" title="Previous Page" disabled={disabled || loading || index <= 0} onClick={() => { const page = pages[index - 1]; if (page) choose(page); }}><ChevronLeft className="h-4 w-4" aria-hidden /></Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Next Page" title="Next Page" disabled={disabled || loading || index < 0 || index >= pages.length - 1} onClick={() => { const page = pages[index + 1]; if (page) choose(page); }}><ChevronRight className="h-4 w-4" aria-hidden /></Button>
    </div>
    <Dialog open={!!pending} onOpenChange={value => { if (!value && !disabled) navigation.setPending(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Save Your Changes?</DialogTitle><DialogDescription>You have unsaved edits on {workingPage?.name}. Save them before going to the next page?</DialogDescription></DialogHeader>
        <DialogFooter className="flex-row flex-wrap justify-start gap-2 sm:justify-start sm:space-x-0">
          <Button className="gap-2" disabled={disabled} onClick={() => void navigation.resolve(true)}><Save className="h-4 w-4" aria-hidden />Save Changes</Button>
          <Button className="gap-2" variant="outline" disabled={disabled} onClick={() => void navigation.resolve(false)}><Trash2 className="h-4 w-4" aria-hidden />Discard Changes</Button>
          <Button className="gap-2" variant="outline" disabled={disabled} onClick={() => navigation.setPending(null)}><Pencil className="h-4 w-4" aria-hidden />Keep Editing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}