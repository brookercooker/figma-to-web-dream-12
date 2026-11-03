import { useState } from "react";
import { Palette, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SELECTION_PALETTE, paletteColour, selectionColourDisplay, colourRgb } from "./selectionColourDisplay";

export const validHexColour = (value: string) => /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);
export default function SelectionColourPicker({ value, onChange, fontColor = false }: { value?: string; onChange: (value: string) => void; fontColor?: boolean }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const [pending, setPending] = useState(value ?? "");
  const [custom, setCustom] = useState(false);
  const display = selectionColourDisplay(value);
  const preview = selectionColourDisplay(pending);
  // Resolve Manager-only CSS tokens before crossing into the public frame.
  const pick = (colour: string) => {
    const rgb = colourRgb(colour);
    onChange(rgb ? `#${rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}` : colour);
    setOpen(false);
  };
  return <Popover open={open} onOpenChange={next => { setOpen(next); if (next) { setHex(display.hex); setPending(value ?? ""); setCustom(false); } }}>
    <PopoverTrigger asChild><Button variant="outline" size="icon" className={fontColor ? "h-8 min-w-12 flex-[1_1_48px]" : "h-8 w-8 shrink-0"} aria-label={fontColor ? "Text Color" : "Colour"} title={`${fontColor ? "Text Color" : "Colour"} · ${display.name}`} onMouseDown={e => e.preventDefault()}>
      {fontColor ? <span aria-hidden className="flex w-5 flex-col items-center leading-none"><span className="text-base font-semibold">A</span><span data-font-color-bar className="mt-0.5 h-1 w-full rounded-sm bg-muted-foreground" style={display.hex ? { backgroundColor: display.hex } : undefined} /></span> : value ? <span className="h-4 w-4 rounded-sm border" style={{ backgroundColor: value }} /> : <Palette className="h-4 w-4" />}
    </Button></PopoverTrigger>
    <PopoverContent align="end" className="z-[10050] w-64 max-w-[calc(100vw-24px)] space-y-3 p-3" onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}>
      <div aria-label="Color Preview" className="h-8 rounded-md border" style={pending ? { backgroundColor: pending } : undefined} />
      <div className="flex flex-wrap gap-2">
        {SELECTION_PALETTE.map(token => { const name = token[0].toUpperCase() + token.slice(1); const colour = paletteColour(token);
          return <Button key={token} variant="outline" size="icon" className="h-6 w-6 shrink-0 rounded-full p-0.5" title={name} aria-label={name} aria-pressed={preview.token === token} onMouseDown={e => e.preventDefault()} onClick={() => { setPending(colour); setHex(selectionColourDisplay(colour).hex); setCustom(false); }}><span className="h-full w-full rounded-full" style={{ backgroundColor: colour }} /></Button>;
        })}
      </div>
      <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-[image:var(--nova-color-spectrum)]" aria-label="Custom Color" title="Custom Color" aria-pressed={custom} onMouseDown={e => e.preventDefault()} onClick={() => setCustom(true)} />
      {custom && <div className="space-y-2"><Input type="color" aria-label={fontColor ? "Text Color Spectrum" : "Colour Spectrum"} className="h-10 w-full cursor-pointer p-1" value={validHexColour(hex) ? selectionColourDisplay(hex).hex : display.hex || "#212121"} onChange={e => { setHex(e.target.value); setPending(e.target.value); }} />
      <Input aria-label="Custom Colour (Hex)" placeholder="#212121" value={hex} className="h-8 min-w-0" onChange={e => { setHex(e.target.value); setPending(e.target.value); }} /></div>}
      <div className="flex gap-2"><Button type="button" size="sm" className="flex-1" disabled={custom && !validHexColour(hex)} onMouseDown={e => e.preventDefault()} onClick={() => pick(pending)}>Apply</Button><Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button></div>
      <Button type="button" variant="ghost" size="sm" className="h-7 w-full justify-start border-t pt-2" onMouseDown={e => e.preventDefault()} onClick={() => { setPending(""); setHex(""); setCustom(false); }}><Undo2 className="mr-2 h-3.5 w-3.5" />Reset</Button>
    </PopoverContent>
  </Popover>;
}