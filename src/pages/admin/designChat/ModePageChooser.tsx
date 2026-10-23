import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WorkingPage } from "./DesignChatContext";
import { loadModePages } from "./pageSelection";

export default function ModePageChooser({ open, onOpenChange, onChoose }: { open: boolean; onOpenChange: (open: boolean) => void; onChoose: (page: WorkingPage) => void }) {
  const [pages, setPages] = useState<WorkingPage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!open) return;
    let stale = false;
    setQuery(""); setLoading(true); setError(false);
    void loadModePages().then((rows) => { if (!stale) setPages(rows); }).catch(() => { if (!stale) setError(true); }).finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [open]);
  const filtered = pages.filter((page) => `${page.name} ${page.path}`.toLowerCase().includes(query.toLowerCase()));
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md" aria-describedby={undefined}>
      <DialogHeader><DialogTitle>Choose a Page</DialogTitle></DialogHeader>
      <Input aria-label="Search Pages" placeholder="Search pages…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="max-h-[50vh] overflow-y-auto">
        {loading ? <p role="status" className="py-3 text-sm text-muted-foreground">Loading pages…</p> : error ? <p role="alert" className="py-3 text-sm text-destructive">Couldn't load pages. Close this and try again.</p> : filtered.length ? filtered.map((page) => <Button key={page.id ?? page.path} variant="ghost" className="h-auto w-full justify-start gap-2 py-2 text-left" onClick={() => onChoose(page)}>
          <FileText className="h-4 w-4 shrink-0" aria-hidden /><span className="min-w-0"><span className="block truncate">{page.name}</span><span className="block truncate text-xs font-normal text-muted-foreground">{page.path}</span></span>
        </Button>) : <p className="py-3 text-sm text-muted-foreground">No pages match your search.</p>}
      </div>
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
    </DialogContent>
  </Dialog>;
}