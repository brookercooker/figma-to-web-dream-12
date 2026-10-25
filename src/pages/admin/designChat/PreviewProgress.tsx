import { Check } from "lucide-react";
import { PREVIEW_STEPS, elapsedLabel, previewExpectation, type PreviewStage } from "./previewProgress";
import { cn } from "@/lib/utils";

export default function PreviewProgress({ stage, elapsedMs }: { stage: PreviewStage; elapsedMs: number }) {
  return <div className="pointer-events-none absolute inset-x-3 top-12 z-30 mx-auto max-w-sm rounded-lg border bg-background/95 p-3 shadow-sm" role="status" aria-live="polite" aria-atomic="false">
    <div className="flex items-center justify-between gap-3">
      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">Updating Preview</span>
      <span className="text-xs tabular-nums text-muted-foreground" aria-live="off">{elapsedLabel(elapsedMs)}</span>
    </div>
    <ol className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
      {PREVIEW_STEPS.map((label, i) => <li key={label} aria-current={i + 1 === stage ? "step" : undefined} className={cn("flex min-w-0 items-center gap-1.5 text-xs", i + 1 > stage ? "text-muted-foreground" : "text-foreground", i + 1 === stage && "font-medium")}>
        <span className="flex h-4 w-5 shrink-0 items-center justify-center" aria-hidden>
          {i + 1 < stage ? <Check className="h-3.5 w-3.5" /> : i + 1 === stage ? <span className="flex gap-0.5">{[0, 1, 2].map((n) => <i key={n} className={cn("h-1 w-1 rounded-full bg-primary motion-safe:animate-pulse", n === 1 && "[animation-delay:200ms]", n === 2 && "[animation-delay:400ms]")} />)}</span> : <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />}
        </span><span>{label}</span>
      </li>)}
    </ol>
    <p className="mt-2 text-xs text-muted-foreground">{previewExpectation(elapsedMs)}</p>
  </div>;
}
