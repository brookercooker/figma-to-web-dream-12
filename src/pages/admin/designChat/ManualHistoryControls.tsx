import { Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEditorSlot } from "./EditorSlot";
export default function ManualHistoryControls({ disabled }: { disabled: boolean }) {
  const { historyControls } = useEditorSlot();
  return <TooltipProvider>{(["undo", "redo"] as const).map(kind => {
    const label = kind === "undo" ? "Undo" : "Redo";
    const action = historyControls?.[`${kind}Label`];
    const Icon = kind === "undo" ? Undo2 : Redo2;
    return <Tooltip key={kind}><TooltipTrigger asChild><span className="inline-flex"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={label}
      disabled={disabled || !action} onClick={() => historyControls?.[kind]()}><Icon className="h-4 w-4" aria-hidden /></Button></span></TooltipTrigger>
      <TooltipContent>{action ? `${label}: ${action}` : label}</TooltipContent></Tooltip>;
  })}</TooltipProvider>;
}