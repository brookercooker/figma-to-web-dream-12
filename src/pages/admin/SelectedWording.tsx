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
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }, [value]);
  return <Textarea ref={ref} aria-label="Selected Text" rows={2} className="min-h-16 resize-none text-sm" value={value} onChange={e => onChange({ ...edits, [sel.key]: replaceWording(html, e.target.value) })} />;
}