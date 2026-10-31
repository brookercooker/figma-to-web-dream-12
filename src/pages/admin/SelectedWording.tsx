import { useLayoutEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { InlineSelection } from "@/components/InlineEditSurface";
import { remoteSnapshot } from "./remoteSelection";
import { replaceWording, wordingText } from "./textWording";
import type { InlineEdits } from "@/lib/inlineEditCore";

export default function SelectedWording({ sel, edits, onChange }: { sel: InlineSelection; edits: InlineEdits; onChange: (next: InlineEdits) => void }) {
  const snap = remoteSnapshot(sel.el);
  const html = edits[sel.key] ?? snap?.html ?? sel.el.innerHTML;
  const value = edits[sel.key] !== undefined ? wordingText(html) : snap?.text ?? wordingText(html);
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
    const observer = new ResizeObserver(() => { if (el.clientWidth !== width) { width = el.clientWidth; resize(); } });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return <Textarea ref={ref} aria-label="Selected Text" rows={2} className="min-h-16 shrink-0 resize-none text-sm" value={value} onChange={e => onChange({ ...edits, [sel.key]: replaceWording(html, e.target.value) })} />;
}