import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "./ConfirmDialog";

export default function ResetEditsAction({ name, object = false, onReset }: { name: string; object?: boolean; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const subject = object ? "object" : "page";
  const label = `Reset All Edits on This ${object ? "Object" : "Page"}`;
  return <div className="mt-6 border-t pt-4">
    <Button variant="ghost" size="sm" className="h-auto w-full justify-start gap-2 whitespace-normal text-left text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
      <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />{label}
    </Button>
    <ConfirmDialog open={open} onOpenChange={setOpen} title={label}
      description={`Reset all edits on ${name}? This removes every saved hand edit on this ${subject}. This can't be undone.`}
      confirmLabel="Reset All Edits" onConfirm={onReset} />
  </div>;
}