import { Button } from "@/components/ui/button";
import type { Finding } from "./designChat/helper";

/** What the automatic review found, with "Fix this for me". Developer Review only; everyone else just sees that a review is needed. */
export function FindingsList({ items, onFix }: { items: Finding[]; onFix: (ids: string[]) => Promise<void> }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <h2 className="font-semibold">Review Findings</h2>
      {items.map((f) => (
        <div key={f.id} className="rounded-md border bg-background p-2 text-xs space-y-1">
          <div>{f.issue}</div>
          {f.request && <div className="text-muted-foreground">From the request: {f.request}</div>}
          {f.file && <div className="text-muted-foreground">File: {f.file}</div>}
          {f.fix && <div className="text-muted-foreground">Suggested fix: {f.fix}</div>}
          <Button type="button" size="sm" variant="outline" onClick={(ev) => { (ev.currentTarget as HTMLButtonElement).disabled = true; void onFix([f.id]); }}>
            Fix this for me
          </Button>
        </div>
      ))}
      {items.length > 1 && (
        <Button type="button" size="sm" onClick={(ev) => { (ev.currentTarget as HTMLButtonElement).disabled = true; void onFix(items.map((f) => f.id)); }}>
          Fix All {items.length} for me
        </Button>
      )}
    </div>
  );
}
