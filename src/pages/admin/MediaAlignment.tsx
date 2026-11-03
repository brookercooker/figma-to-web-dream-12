import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolSegment } from "./designChat/ToolPanel";

export default function MediaAlignment({ value, onChange }: { value?: string; onChange: (value: "left" | "center" | "right") => void }) {
  return <div className="space-y-1">
    <p className="text-center text-[11px] text-muted-foreground">Alignment</p>
    <ToolSegment className="flex w-full" >
      {([["left", "Left", AlignLeft], ["center", "Center", AlignCenter], ["right", "Right", AlignRight]] as const).map(([align, label, Icon]) =>
        <Button key={align} type="button" size="sm" className="min-w-0 flex-1 gap-1 px-1 text-xs" variant={value === align ? "default" : "ghost"} aria-label={`Align ${label}`} aria-pressed={value === align} onClick={() => onChange(align)}><Icon className="h-3.5 w-3.5 shrink-0" />{label}</Button>)}
    </ToolSegment>
  </div>;
}