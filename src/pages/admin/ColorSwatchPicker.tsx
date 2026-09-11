import { Check } from "lucide-react";
import { PALETTE } from "./labelColors";

interface Props {
  value: number | null | undefined;
  onChange: (idx: number) => void;
  /** Small = 16px swatches (row / picker), Md = 20px (form). */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Grid of the 16 palette swatches. Click to pick a color for a label.
 * Shows a check on the currently-selected color.
 */
export default function ColorSwatchPicker({ value, onChange, size = "sm", className = "" }: Props) {
  const dim = size === "md" ? "w-5 h-5" : "w-4 h-4";
  const check = size === "md" ? "w-3 h-3" : "w-2.5 h-2.5";
  return (
    <div className={`grid grid-cols-8 gap-1 ${className}`} role="radiogroup" aria-label="Choose label color">
      {PALETTE.map((c) => {
        const selected = value === c.idx;
        return (
          <button
            key={c.idx}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${c.name} color`}
            title={c.name}
            onClick={(e) => { e.stopPropagation(); onChange(c.idx); }}
            className={`${dim} rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${
              selected ? "ring-2 ring-offset-1 ring-foreground/60" : ""
            }`}
            style={{ background: c.swatch }}
          >
            {selected && <Check className={`${check} text-white drop-shadow`} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
