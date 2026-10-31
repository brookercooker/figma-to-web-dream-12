import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MATERIAL_ERROR, parseMaterialIcon } from "./materialIcon";

export default function MaterialIconField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value.startsWith("material:") ? value.split(":")[2] : "");
  const [error, setError] = useState("");
  const [helpHovered, setHelpHovered] = useState(false);
  const [helpFocused, setHelpFocused] = useState(false);
  useEffect(() => { setText(value.startsWith("material:") ? value.split(":")[2] : ""); }, [value]);
  const [, style, name] = value.split(":");
  useEffect(() => {
    if (!value.startsWith("material:")) return;
    const id = `nova-material-${style}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link"); link.id = id; link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=Material+Symbols+${style === "sharp" ? "Sharp" : style === "rounded" ? "Rounded" : "Outlined"}`;
    document.head.append(link);
  }, [value, style]);
  return <div className="space-y-1">
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><label htmlFor="google-icon">Paste a Google Icon</label>
      <TooltipProvider delayDuration={0}><Tooltip open={helpHovered || helpFocused}><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label="Google Icon Help" onPointerEnter={() => setHelpHovered(true)} onPointerLeave={() => setHelpHovered(false)} onFocus={() => setHelpFocused(true)} onBlur={() => setHelpFocused(false)}><CircleHelp className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent className="z-[10000] max-w-72">Find an icon at fonts.google.com/icons, open it, and copy the code under 'Inserting the icon'. Paste it here and the icon appears next to this item.</TooltipContent></Tooltip></TooltipProvider>
    </div>
    <div className="flex items-center gap-2"><Input id="google-icon" value={text} placeholder="home or pasted icon code" onChange={e => {
      setText(e.target.value); const parsed = parseMaterialIcon(e.target.value);
      if (!parsed) { setError(e.target.value ? MATERIAL_ERROR : ""); return; }
      setError(""); onChange(parsed.value);
    }} />{value.startsWith("material:") && <span aria-label={`${name} icon preview`} className={`material-symbols-${style} shrink-0`}>{name}</span>}</div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </div>;
}