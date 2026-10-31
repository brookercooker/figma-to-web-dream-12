import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { scaledViewportPlan } from "./previewScale";

/**
 * Renders its children at a fixed virtual width and shrinks them to fit with a CSS transform, so the site inside sees a
 * real desktop width. The iframe is transformed as a whole, so clicks inside it land on the right element.
 *
 * - `fill`: the children fill the available height (the iframe owns scrolling). Without it they keep their natural height.
 * - `fallbackWidth`: used instead when `virtualWidth` would shrink below 50% (unless `explicit`, the person chose it).
 * - The virtual viewport is capped at a realistic desktop height, so 100vh sections look as they do on a real screen.
 */
export default function ScaledViewport({ virtualWidth, enabled = true, fill = true, what = "desktop", fallbackWidth, fallbackWhat = "tablet", explicit = false, className, children }: {
  virtualWidth: number; enabled?: boolean; fill?: boolean; what?: string; fallbackWidth?: number; fallbackWhat?: string; explicit?: boolean; className?: string; children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const plan = scaledViewportPlan({ available: size.w, height: size.h, virtualWidth, enabled: enabled && fill, fallbackWidth, explicit, what, fallbackWhat });
  return (
    <div ref={outer} data-scaled-viewport data-virtual-width={plan.scaled ? plan.width : undefined}
      className={cn("relative w-full", fill && "h-full min-h-0 overflow-hidden", plan.scaled && "bg-muted", className)}>
      <div data-scale={plan.scale.toFixed(3)}
        style={plan.scaled ? { width: plan.width, height: plan.height, transform: `scale(${plan.scale})`, transformOrigin: "top left" } : fill ? { width: "100%", height: "100%" } : undefined}
        className="relative">
        {children}
      </div>
      {plan.label && <div role="status" className="pointer-events-none absolute bottom-2 right-2 z-30 max-w-[calc(100%-1rem)] rounded-full border bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm">{plan.label}</div>}
    </div>
  );
}
