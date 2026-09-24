import { useIsThumbnail } from "@/lib/thumbnail";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

interface CarouselControlProps {
  total?: number;
  intervalMs?: number;
}

const CarouselControl = ({ total = 4, intervalMs = 3500 }: CarouselControlProps) => {
  const [current, setCurrent] = useState(1);
  const [playing, setPlaying] = useState(true);

  const isThumb = useIsThumbnail();
  useEffect(() => {
    if (!playing || isThumb) return;
    const id = window.setInterval(() => {
      setCurrent((c) => (c % total) + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, total, intervalMs, isThumb]);

  return (
    <div className="inline-flex items-center gap-4 bg-cream border border-sand rounded-full px-5 py-2 shadow-[0_2px_12px_-6px_hsl(var(--brass)/0.4)]">
      <span className="font-sans text-sm font-light text-ink tabular-nums tracking-wide">
        <span className="text-ink">{String(current).padStart(2, "0")}</span>
        <span className="text-stone mx-1.5">/</span>
        <span className="text-stone">{String(total).padStart(2, "0")}</span>
      </span>

      <span className="h-4 w-px bg-sand" aria-hidden="true" />

      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause slideshow" : "Play slideshow"}
        className="h-8 w-8 rounded-full border border-ink/80 text-ink flex items-center justify-center transition-colors hover:bg-ink hover:text-cream"
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" strokeWidth={2} fill="currentColor" />
        ) : (
          <Play className="h-3.5 w-3.5 translate-x-[1px]" strokeWidth={2} fill="currentColor" />
        )}
      </button>
    </div>
  );
};

export default CarouselControl;
