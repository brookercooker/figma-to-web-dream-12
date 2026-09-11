import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function InlineEdit({ value, onSave, placeholder = "Add description…", multiline = true }: {
  value: string; onSave: (v: string) => Promise<void> | void; placeholder?: string; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const start = (e: React.MouseEvent) => { e.stopPropagation(); setDraft(value ?? ""); setEditing(true); };
  const save = async (e?: React.MouseEvent) => { e?.stopPropagation(); await onSave(draft); setEditing(false); };
  const cancel = (e?: React.MouseEvent) => { e?.stopPropagation(); setEditing(false); };

  if (editing) {
    return (
      <div onClick={(e) => e.stopPropagation()} className="flex items-start gap-1">
        {multiline ? (
          <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            className="flex-1 border rounded p-1 text-xs min-h-[60px]" placeholder={placeholder} />
        ) : (
          <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 text-xs" placeholder={placeholder} />
        )}
        <Button size="sm" variant="ghost" onClick={save} className="h-7 w-7 p-0"><Check className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={cancel} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 min-w-0">
      <span
        className="text-muted-foreground text-xs flex-1 min-w-0 truncate"
        title={value || ""}
      >
        {value || <span className="italic opacity-60">{placeholder}</span>}
      </span>
      <button
        onClick={start}
        className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
        title="Edit"
      >
        Edit
      </button>
    </div>
  );
}
