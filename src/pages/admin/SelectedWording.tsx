import { useLayoutEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { InlineSelection } from "@/components/InlineEditSurface";
import { remoteSnapshot, remoteTextRestore } from "./remoteSelection";
import { replaceWording, wordingText } from "./textWording";
import type { InlineEdits } from "@/lib/inlineEditCore";

export default function SelectedWording({ sel, edits, onChange }: { sel: InlineSelection; edits: InlineEdits; onChange: (next: InlineEdits) => void }) {
  const snap = remoteSnapshot(sel.el);
  const stale = remoteTextRestore(sel.el);
  const key = edits[`text:${sel.key}`] !== undefined ? `text:${sel.key}` : sel.key;
  const html = stale ? snap?.html ?? sel.el.innerHTML : edits[key] ?? snap?.html ?? sel.el.innerHTML;
  const value = !stale && edits[key] !== undefined ? wordingText(html) : snap?.text ?? wordingText(html);
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resize = () => {
      const css = getComputedStyle(el);
      const cap = (parseFloat(css.lineHeight) || 20) * 8 + (parseFloat(css.paddingTop) || 0) + (parseFloat(css.paddingBottom) || 0) + 2;
      el.style.height = "0px";
      el.style.height = `${Math.min(el.scrollHeight + 2, cap)}px`;
      el.style.overflowY = el.scrollHeight > cap ? "auto" : "hidden";
    };
    resize();
    let width = el.clientWidth;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => { if (el.clientWidth !== width) { width = el.clientWidth; resize(); } });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return <>
    {stale && <div role="status" className="space-y-2 text-sm text-muted-foreground"><p>A later chat change replaced your edit here.</p><Button variant="outline" size="sm" onClick={stale.restore}>Put My Edit Back</Button></div>}
    <Textarea ref={ref} aria-label="Selected Text" rows={2} className="min-h-16 shrink-0 resize-none text-sm" value={value} onChange={e => onChange({ ...edits, [key]: replaceWording(html, e.target.value) })} />
  </>;
}