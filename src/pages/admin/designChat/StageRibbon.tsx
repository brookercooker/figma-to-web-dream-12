import { cn } from "@/lib/utils";
import type { WaitView } from "./waitEstimates";
import WaitProgress from "./WaitProgress";
import { elapsedTime, ribbonSegments } from "./stageRibbon";

export default function StageRibbon({ progress, thin = false, className }: { progress?: WaitView | null; thin?: boolean; className?: string }) {
  if (!progress?.ribbon) return <WaitProgress progress={progress} thin={thin} className={className} />;
  const r = progress.ribbon;
  const label = progress.error || r.paused ? progress.label : progress.done ? "Done" : `${r.current < 2 ? "Making your change" : r.current === 2 ? "Building the preview" : "Updating the preview"} · ${elapsedTime(r.elapsed)}`;
  return <div className={cn("min-w-0 space-y-2 transition-opacity duration-200 motion-reduce:transition-none", progress.fading && "opacity-0", className)}>
    {!thin && <p role="status" className="text-xs text-muted-foreground">{label}{r.long && <span className="mt-1 block">Taking a bit longer than usual. Still working.</span>}</p>}
    <div role="progressbar" aria-valuetext={label} aria-label={label} className="grid grid-cols-4 gap-1.5">
      {ribbonSegments(r).map(segment => <div key={segment.label} className="min-w-0">
        <div className="h-[6px] overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", progress.error ? "bg-destructive" : "bg-review", segment.current && !progress.error && !r.paused && "nova-stage-stripes")} style={{ width: `${segment.fill * 100}%` }} /></div>
        {!thin && <p className={cn("mt-1.5 text-[11px] leading-tight", segment.current ? "font-bold text-foreground" : segment.finished ? "text-foreground" : "text-muted-foreground")}>{segment.label}</p>}
      </div>)}
    </div>
  </div>;
}