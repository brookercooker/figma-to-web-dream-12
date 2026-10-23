import { useEffect, useRef, useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TEXT_COLORS } from "@/components/ObjectSections";
import { changeInlineLink, linkAtRange, validInlineHref } from "./inlineLinks";

const ERROR = "Use a web address, an email, a phone number, a page path starting with /, or #section.";
export default function InlineLinkControl() {
  const saved = useRef<{ host: HTMLElement; range: Range } | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [href, setHref] = useState("");
  const [underline, setUnderline] = useState(true);
  const [color, setColor] = useState("");
  const [error, setError] = useState("");
  const capture = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    const el = node instanceof HTMLElement ? node : node.parentElement;
    const host = el?.closest<HTMLElement>('[contenteditable="true"]');
    if (!host || !host.contains(range.endContainer)) return;
    saved.current = { host, range: range.cloneRange() };
    const link = linkAtRange(host, range);
    setActive(!!link);
    setDisabled(host.dataset.inlineNoLinks === "true" || !!host.closest('button,[role="button"]') || !!host.parentElement?.closest("a"));
  };
  useEffect(() => {
    const check = () => { if (!open) capture(); };
    check();
    document.addEventListener("selectionchange", check);
    return () => document.removeEventListener("selectionchange", check);
  }, [open]);
  const close = () => {
    setOpen(false);
    const current = saved.current;
    if (current?.host.isConnected) {
      current.host.focus();
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(current.range);
    }
  };
  const apply = (remove = false) => {
    const current = saved.current;
    if (!current || disabled) return;
    const address = href.trim();
    if (!remove && !validInlineHref(address)) { setError(ERROR); return; }
    if (changeInlineLink(current.host, current.range, remove ? null : address, { underline, color }) === null) return;
    close();
  };
  return <Popover open={open} onOpenChange={(next) => {
    if (!next) { close(); return; }
    capture();
    const current = saved.current;
    if (!current) return;
    const link = linkAtRange(current.host, current.range);
    setHref(link?.getAttribute("href") ?? "");
    setUnderline(link?.getAttribute("data-underline") !== "0");
    setColor(link?.getAttribute("data-color") ?? "");
    setError(""); setOpen(true);
  }}>
    <PopoverTrigger asChild>
      <Button type="button" size="sm" variant={active ? "secondary" : "outline"} aria-pressed={active} disabled={disabled}
        title={disabled ? "Links can't go inside buttons or linked cards." : "Link"} onMouseDown={(e) => { e.preventDefault(); capture(); }}>
        <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Link
      </Button>
    </PopoverTrigger>
    <PopoverContent data-inline-link-popup="" className="w-80 max-w-[92vw] space-y-3" onCloseAutoFocus={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); apply(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }}>
      <label className="block space-y-1 text-xs">Address
        <Input autoFocus value={href} placeholder="https://, /page, mailto:, tel: or #section" onChange={(e) => { setHref(e.target.value); setError(""); }} aria-invalid={!!error} />
      </label>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <label className="flex items-center gap-2 text-xs"><Checkbox checked={underline} onCheckedChange={(on) => setUnderline(on === true)} /> Underline</label>
      <div className="flex flex-wrap gap-1.5" aria-label="Link Colour">
        <Button size="sm" variant={color ? "ghost" : "secondary"} onClick={() => setColor("")}>Default Colour</Button>
        {TEXT_COLORS.map((c) => <Button key={c.value} size="icon" variant={color === c.value ? "secondary" : "ghost"} title={c.label} aria-label={c.label} onClick={() => setColor(c.value)}>
          <span className="h-4 w-4 rounded-full border" style={{ background: c.swatch }} />
        </Button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => apply()}>Apply Link</Button>
        <Button size="sm" variant="outline" onClick={close}>Cancel</Button>
        {active && <Button size="sm" variant="ghost" onClick={() => apply(true)}>Remove Link</Button>}
      </div>
    </PopoverContent>
  </Popover>;
}