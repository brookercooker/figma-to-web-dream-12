import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fitScale, scaleLabel } from "./previewScale";

/**
 * Renders its children at a fixed virtual width and shrinks them to fit with a CSS transform, so the site inside sees a
 * real desktop width. The iframe is transformed as a whole, so clicks inside it land on the right element.
 */
export default function ScaledViewport({ virtualWidth, enabled = true, what = "desktop", className, children }: {
  virtualWidth: number; enabled?: boolean; what?: string; className?: string; children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = enabled ? fitScale(size.w, virtualWidth) : 1;
  const label = enabled ? scaleLabel(scale, what) : null;
  return (
    <div ref={outer} data-scaled-viewport className={cn("relative w-full", enabled && "h-full overflow-hidden", className)}>
      <div data-scale={scale.toFixed(3)} style={scale < 1 ? { width: virtualWidth, height: size.h / scale, transform: `scale(${scale})`, transformOrigin: "top left" } : enabled ? { width: "100%", height: "100%" } : undefined}
        className="relative">
        {children}
      </div>
      {label && <div role="status" className="pointer-events-none absolute bottom-2 right-2 z-30 rounded-full border bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm">{label}</div>}
    </div>
  );
}
