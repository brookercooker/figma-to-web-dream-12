import { cn } from "@/lib/utils";
import type { WaitView } from "./waitEstimates";
import WaitError from "./WaitError";

export default function WaitProgress({ progress, thin = false, className }: { progress: WaitView | null | undefined; thin?: boolean; className?: string }) {
  if (!progress) return null;
  if (progress.error && progress.errorControls) return <WaitError progress={progress} className={className} />;
  return <div className={cn("min-w-0 space-y-1.5 transition-opacity duration-200 motion-reduce:transition-none", progress.fading && "opacity-0", className)}>
    {!thin && <p className="text-xs leading-snug text-muted-foreground">{progress.label}</p>}
    <div role="progressbar" aria-valuetext={progress.label} aria-label={progress.label} className="h-[6px] overflow-hidden rounded-full bg-review/15">
      <div className={cn("h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none", progress.error ? "bg-destructive" : "bg-review")} style={{ width: `${progress.value * 100}%` }} />
    </div>
  </div>;
}