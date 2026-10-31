import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PALETTE = ["ink", "stone", "garnet", "brass", "sand", "cream", "white"] as const;
export const validHexColour = (value: string) => /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
export default function SelectionColourPicker({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const pick = (colour: string) => { onChange(colour); setOpen(false); };
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) setHex(value && validHexColour(value) ? value : ""); }}>
    <PopoverTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label="Colour" title="Colour" onMouseDown={e => e.preventDefault()}>
      {value ? <span className="h-4 w-4 rounded-sm border" style={{ backgroundColor: value }} /> : <Palette className="h-4 w-4" />}
    </Button></PopoverTrigger>
    <PopoverContent align="end" className="z-[10050] w-56 space-y-3 p-3" onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
      <div className="flex gap-1">
        {PALETTE.map(token => { const name = token[0].toUpperCase() + token.slice(1); const colour = `hsl(var(--nova-${token === "white" ? "cream" : token}))`;
          return <Button key={token} variant="outline" size="icon" className="h-6 w-6 shrink-0" title={name} aria-label={name} aria-pressed={value === colour} onMouseDown={e => e.preventDefault()} onClick={() => pick(colour)}><span className="h-4 w-4 rounded-sm" style={{ backgroundColor: colour }} /></Button>;
        })}
      </div>
      <Button variant="ghost" size="sm" className="h-7 w-full justify-start" onMouseDown={e => e.preventDefault()} onClick={() => pick("")}>Default</Button>
      <div className="flex items-center gap-2"><Input aria-label="Custom Colour (Hex)" placeholder="#212121" value={hex} className="h-8 min-w-0" onChange={e => setHex(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && validHexColour(hex)) { e.preventDefault(); pick(hex); } }} /><Button variant="outline" size="sm" className="h-8" disabled={!validHexColour(hex)} onClick={() => pick(hex)}>Apply</Button></div>
    </PopoverContent>
  </Popover>;
}