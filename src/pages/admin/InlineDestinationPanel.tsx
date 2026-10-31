import { useEffect, useState } from "react";
import { Link as LinkIcon, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { detectLinkKind, linkAddress, type LinkKind } from "./linkKind";
import { isInternalPath } from "./designChat/registerPage";
import { originalLink, validLinkHref, type InlineEdits, type LinkEdit } from "@/lib/inlineEditCore";
import type { InlineSelection } from "@/components/InlineEditSurface";
import { ToolField, ToolGroup } from "./designChat/ToolPanel";

const ERROR = "That address isn't allowed. Use a web address starting with https://, a page path starting with /, mailto:, tel: or #.";

export default function InlineDestinationPanel({ selection, editsFor, onChange, pages }: {
  selection: InlineSelection | null;
  editsFor: (scope: string) => InlineEdits;
  onChange: (scope: string, next: InlineEdits) => void;
  pages: { id: string; name: string; path: string }[];
}) {
  const target = selection?.link;
  const edits = target ? editsFor(target.scope) : {};
  const key = target ? `link:${target.key}` : "";
  const value = edits[key];
  let edit: LinkEdit | undefined;
  try { edit = value ? JSON.parse(value) : undefined; } catch { /* Invalid stored edits remain available for repair. */ }
  const original = target ? originalLink(target.el) : { href: null, target: null };
  const destination = edit?.unlinked ? "" : edit?.href ?? original.href ?? "";
  const blank = edit ? edit.target === "_blank" : original.target === "_blank";
  const [address, setAddress] = useState(destination);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<LinkKind>(() => detectLinkKind(destination));
  const [pageSearch, setPageSearch] = useState("");
  useEffect(() => { setAddress(destination); setError(""); }, [destination, target?.scope, target?.key]);
  useEffect(() => { setKind(detectLinkKind(destination)); }, [destination]);
  if (!target) return null;
  const save = (href: string, newTab = blank) => {
    if (!validLinkHref(href)) { setError(ERROR); return; }
    setError(""); setAddress(href);
    onChange(target.scope, { ...edits, [key]: JSON.stringify({ href, ...(newTab ? { target: "_blank" } : {}) }) });
  };
  const apply = () => {
    if (address === destination && !error) return;
    save(address);
  };
  return <ToolGroup title="Link" icon={LinkIcon} defaultOpen>
    <div className="relative space-y-1" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><label htmlFor="link-address">Link Address</label><span>{kind === "email" ? "Email" : kind === "phone" ? "Phone" : kind === "page" ? `Page: ${pages.find(p => p.path === address)?.name ?? address}` : "Web Address"}</span></div>
      <Input id="link-address" aria-label="Link Address" aria-expanded={open} type={kind === "email" ? "email" : kind === "phone" ? "tel" : "text"} value={kind === "email" || kind === "phone" ? address.replace(/^(mailto:|tel:)/i, "") : address} placeholder={kind === "email" ? "name@example.com" : kind === "phone" ? "Phone number" : "https://"} aria-invalid={!!error}
        onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
        onChange={(e) => { setAddress(linkAddress(kind, e.target.value)); setError(""); }} onBlur={apply}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); setOpen(false); } if (e.key === "Escape") setOpen(false); }} />
      {open && <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-md" aria-label="Link Address Options">
        {([["web", "Web Address"], ["page", "Choose a Page"], ["email", "Email"], ["phone", "Phone"]] as const).map(([value, label]) => <Button key={value} variant={kind === value ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onMouseDown={e => e.preventDefault()} onClick={() => { setKind(value); if (value !== "page") { setAddress(value === detectLinkKind(address) ? address : ""); setOpen(false); document.getElementById("link-address")?.focus(); setOpen(false); } }}>{label}</Button>)}
        {kind === "page" && <div className="border-t pt-1"><Input aria-label="Find a Page" placeholder="Find a page" value={pageSearch} onChange={e => setPageSearch(e.target.value)} />{pages.filter(p => validLinkHref(p.path) && !isInternalPath(p.path) && p.name.toLowerCase().includes(pageSearch.toLowerCase())).map(p => <Button key={p.id} variant="ghost" size="sm" className="w-full justify-start" onMouseDown={e => e.preventDefault()} onClick={() => { save(p.path); setOpen(false); }}>{p.name}</Button>)}</div>}
      </div>}
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <label className="flex items-center justify-between gap-2 text-xs">Open in New Tab
      <Switch checked={blank} disabled={!validLinkHref(address) || !!edit?.unlinked} onCheckedChange={(on) => save(address, on)} />
    </label>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => onChange(target.scope, { ...edits, [key]: JSON.stringify({ unlinked: true }) })}><Link2Off className="h-3.5 w-3.5" />Remove Link</Button>
      {value !== undefined && <Button size="sm" variant="ghost" onClick={() => {
        const next = { ...edits }; delete next[key]; onChange(target.scope, next);
      }}>Restore Original Link</Button>}
    </div>
  </ToolGroup>;
}