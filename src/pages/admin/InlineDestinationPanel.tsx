import { useEffect, useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  useEffect(() => { setAddress(destination); setError(""); }, [destination, target?.scope, target?.key]);
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
    <div className="space-y-1 text-xs"><span className="text-muted-foreground">Goes To</span>
      <p className="break-all">{edit?.unlinked ? "Link Is Off" : destination || "Set By the Page's Code"}</p>
    </div>
    <ToolField label="Link Address">
      <Input value={address} placeholder="Web Address, Page Path, Email Or Phone" aria-invalid={!!error}
        onChange={(e) => { setAddress(e.target.value); setError(""); }} onBlur={apply}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }} />
    </ToolField>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <Select value="" onValueChange={(href) => save(href)}>
      <SelectTrigger aria-label="Choose a Page"><SelectValue placeholder="Choose a Page" /></SelectTrigger>
      <SelectContent>{pages.filter((page) => validLinkHref(page.path)).map((page) => <SelectItem key={page.id} value={page.path}>{page.name}</SelectItem>)}</SelectContent>
    </Select>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => { setAddress(address.startsWith("mailto:") ? address : `mailto:${address}`); setError(""); }}>Email</Button>
      <Button size="sm" variant="outline" onClick={() => { setAddress(address.startsWith("tel:") ? address : `tel:${address}`); setError(""); }}>Phone</Button>
    </div>
    <label className="flex items-center justify-between gap-2 text-xs">Open in New Tab
      <Switch checked={blank} disabled={!validLinkHref(address) || !!edit?.unlinked} onCheckedChange={(on) => save(address, on)} />
    </label>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => onChange(target.scope, { ...edits, [key]: JSON.stringify({ unlinked: true }) })}>Turn Link Off</Button>
      {value !== undefined && <Button size="sm" variant="ghost" onClick={() => {
        const next = { ...edits }; delete next[key]; onChange(target.scope, next);
      }}>Restore Original Link</Button>}
    </div>
  </ToolGroup>;
}