import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "./ConfirmDialog";

export default function ResetEditsAction({ name, object = false, onReset }: { name: string; object?: boolean; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const subject = object ? "object" : "page";
  const label = `Restore Original ${object ? "Object" : "Page"}`;
  return <div className="mt-6 border-t pt-4">
    <Button variant="ghost" size="sm" className="h-auto w-full justify-start gap-2 whitespace-normal text-left text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
      <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />{label}
    </Button>
    <ConfirmDialog open={open} onOpenChange={setOpen} title={`Restore the original ${name}?`}
      description={`This removes every hand edit ever saved on this ${subject}, not just today's, and puts it back the way it was built. Nothing changes for visitors until you Save Changes and it is reviewed.`}
      confirmLabel={label} primaryFirst onConfirm={onReset} />
  </div>;
}