import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SELECTION_PALETTE, paletteColour, selectionColourDisplay, colourRgb } from "./selectionColourDisplay";

export const validHexColour = (value: string) => /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
export default function SelectionColourPicker({ value, onChange, fontColor = false }: { value?: string; onChange: (value: string) => void; fontColor?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const display = selectionColourDisplay(value);
  // Resolve Manager-only CSS tokens before crossing into the public frame.
  const pick = (colour: string) => {
    const rgb = colourRgb(colour);
    onChange(rgb ? `#${rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}` : colour);
    setOpen(false);
  };
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) setHex(display.hex); }}>
    <PopoverTrigger asChild><Button variant="outline" size="icon" className={fontColor ? "h-8 min-w-8 flex-1" : "h-8 w-8 shrink-0"} aria-label={fontColor ? "Text Color" : "Colour"} title={`${fontColor ? "Text Color" : "Colour"} · ${display.name}`} onMouseDown={e => e.preventDefault()}>
      {fontColor ? <span aria-hidden className="flex w-5 flex-col items-center leading-none"><span className="text-base font-semibold">A</span><span data-font-color-bar className="mt-0.5 h-1 w-full rounded-sm bg-muted-foreground" style={display.hex ? { backgroundColor: display.hex } : undefined} /></span> : value ? <span className="h-4 w-4 rounded-sm border" style={{ backgroundColor: value }} /> : <Palette className="h-4 w-4" />}
    </Button></PopoverTrigger>
    <PopoverContent align="end" className="z-[10050] w-56 space-y-3 p-3" onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
      <div className="flex flex-wrap gap-1">
        {SELECTION_PALETTE.map(token => { const name = token[0].toUpperCase() + token.slice(1); const colour = paletteColour(token);
          return <Button key={token} variant="outline" size="icon" className="h-6 w-6 shrink-0" title={name} aria-label={name} aria-pressed={display.token === token} onMouseDown={e => e.preventDefault()} onClick={() => pick(colour)}><span className="h-4 w-4 rounded-sm" style={{ backgroundColor: colour }} /></Button>;
        })}
      </div>
      {fontColor && <Input type="color" aria-label="Text Color Spectrum" className="h-10 w-full cursor-pointer p-1" value={validHexColour(hex) && hex.length === 7 ? hex : display.hex || "#212121"} onChange={e => { setHex(e.target.value); pick(e.target.value); }} />}
      <Button variant="ghost" size="sm" className="h-7 w-full justify-start" onMouseDown={e => e.preventDefault()} onClick={() => pick("")}>{fontColor ? "Reset" : "Default"}</Button>
      <div className="flex items-center gap-2"><Input aria-label="Custom Colour (Hex)" placeholder="#212121" value={hex} className="h-8 min-w-0" onChange={e => setHex(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && validHexColour(hex)) { e.preventDefault(); pick(hex); } }} /><Button variant="outline" size="sm" className="h-8" disabled={!validHexColour(hex)} onClick={() => pick(hex)}>Apply</Button></div>
    </PopoverContent>
  </Popover>;
}