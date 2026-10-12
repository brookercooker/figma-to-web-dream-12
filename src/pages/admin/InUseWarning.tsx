import { AlertTriangle } from "lucide-react";
import type { AssetUsage } from "./assetUsages";

export interface InUseItem { label: string; usages: AssetUsage[] }

/** The items that are on at least one page, each with the names of up to `max` pages and how many more there are. */
export function inUseSummary(items: InUseItem[], max = 4) {
  return items
    .filter((i) => i.usages.length > 0)
    .map((i) => {
      const names = Array.from(new Set(i.usages.map((u) => u.name || u.path)));
      return { label: i.label, pages: names.slice(0, max), more: Math.max(0, names.length - max) };
    });
}

/**
 * Shown inside a delete confirmation when something being deleted is on pages. Says which pages, so the person knows what
 * will be left with a gap. Renders nothing when none of the items is in use.
 */
export default function InUseWarning({ items }: { items: InUseItem[] }) {
  const used = inUseSummary(items);
  if (used.length === 0) return null;
  return (
    <div role="alert" className="mb-3 flex gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">
          {used.length === 1 ? "This is on a page that visitors can see." : `${used.length} of these are on pages that visitors can see.`}
        </p>
        <ul className="space-y-0.5 text-xs">
          {used.map((u) => (
            <li key={u.label}>
              <span className="font-medium">{u.label}</span>: {u.pages.join(", ")}{u.more > 0 ? ` and ${u.more} more` : ""}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Deleting it leaves a gap there until the page is changed.</p>
      </div>
    </div>
  );
}
