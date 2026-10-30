import type { Section } from "@/components/ObjectSections";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { layoutFields, setLayout, sectionLabel } from "./objectSectionsEdit";

/** "Section Layout": the selected designed-object section's own layout settings, nothing else. */
export default function SectionLayoutGroup({ section, onChange }: { section: Section; onChange: (next: Section) => void }) {
  const values = section as unknown as Record<string, unknown>;
  return (
    <section aria-label="Section Layout" className="space-y-3 rounded-md border p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide">Section Layout</h3>
      <p className="text-xs text-muted-foreground">{sectionLabel(section)}</p>
      {layoutFields(section).map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-2 text-xs">
          <span>{f.label}</span>
          {f.kind === "choice" ? (
            <select aria-label={f.label} className="h-7 max-w-[60%] rounded-md border bg-background px-2 text-xs"
              value={values[f.key] == null ? "" : String(values[f.key])}
              onChange={(e) => onChange(setLayout(section, f.key, e.target.value))}>
              {!f.options.some((o) => o.value === "") && <option value="">Default</option>}
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : f.kind === "toggle" ? (
            <Switch aria-label={f.label} checked={values[f.key] === true} onCheckedChange={(v) => onChange(setLayout(section, f.key, v))} />
          ) : (
            <span className="flex items-center gap-1">
              <Input aria-label={f.label} type="number" className="h-7 w-20 text-xs" min={f.min} max={f.max} step={f.step ?? 1}
                value={typeof values[f.key] === "number" ? String(values[f.key]) : ""}
                onChange={(e) => { const n = e.target.value === "" ? null : Math.max(f.min, Math.min(f.max, Number(e.target.value))); onChange(setLayout(section, f.key, n)); }} />
              {f.unit && <span className="text-muted-foreground">{f.unit}</span>}
            </span>
          )}
        </label>
      ))}
    </section>
  );
}
