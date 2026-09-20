import { useCallback, useEffect, useRef, useState } from "react";
import type { FreeSection } from "@/components/ObjectSections";

type Rect = { part: string; groupKey: number; left: number; top: number; width: number; height: number };

/**
 * Drag handles drawn over each image in the block canvas so height and width
 * can be set by dragging instead of typing numbers.
 */
export default function ImageResizeHandles({
  section,
  containerRef,
  activePart,
  onResize,
}: {
  section: FreeSection;
  containerRef: React.RefObject<HTMLDivElement>;
  /** Part name of the item being edited — handles show only on that image. */
  activePart: string;
  onResize: (
    groupKey: number,
    size: { imageHeightPx?: number; imageWidthPx?: number },
    info?: { part: string; widthPct?: number },
  ) => void;
}) {
  const [rects, setRects] = useState<Rect[]>([]);
  const dragging = useRef(false);

  const measure = useCallback(() => {
    const host = containerRef.current;
    if (!host) return;
    const base = host.getBoundingClientRect();
    const next: Rect[] = [];
    host.querySelectorAll<HTMLElement>('[data-part^="image:"]').forEach((el) => {
      const part = el.dataset.part as string;
      const index = Number(part.split(":")[1]);
      const img = section.images[index];
      if (!img) return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      next.push({
        part,
        groupKey: img.group ?? 0,
        left: r.left - base.left,
        top: r.top - base.top,
        width: r.width,
        height: r.height,
      });
    });
    setRects(next);
  }, [containerRef, section.images]);

  useEffect(() => {
    measure();
    const host = containerRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => { if (!dragging.current) measure(); });
    ro.observe(host);
    host.querySelectorAll("img").forEach((im) => im.addEventListener("load", measure));
    window.addEventListener("resize", measure);
    const t = window.setTimeout(measure, 400);
    return () => {
      ro.disconnect();
      host.querySelectorAll("img").forEach((im) => im.removeEventListener("load", measure));
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [measure, containerRef, section]);

  /** dx / dy: which way a drag on this handle grows the image (+1 right/down, -1 left/up, 0 none). */
  const startDrag = (e: React.PointerEvent, rect: Rect, dx: -1 | 0 | 1, dy: -1 | 0 | 1) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = Math.round(rect.width);
    const startH = Math.round(rect.height);
    const hostWidth = containerRef.current?.getBoundingClientRect().width ?? 0;
    const move = (ev: PointerEvent) => {
      const size: { imageHeightPx?: number; imageWidthPx?: number } = {};
      let widthPct: number | undefined;
      if (dx) {
        const w = Math.max(24, startW + dx * (ev.clientX - startX));
        size.imageWidthPx = w;
        if (hostWidth > 0) widthPct = (w / hostWidth) * 100;
      }
      if (dy) size.imageHeightPx = Math.max(24, startH + dy * (ev.clientY - startY));
      onResize(rect.groupKey, size, { part: rect.part, widthPct });
      // keep the handles glued to the picture while it is being dragged
      setRects((prev) =>
        prev.map((p) =>
          p.part === rect.part
            ? { ...p, width: size.imageWidthPx ?? p.width, height: size.imageHeightPx ?? p.height }
            : p,
        ),
      );
    };
    const up = () => {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      measure();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const focusIndex = (() => {
    const m = /^(?:image|caption|imagetext):(\d+)/.exec(activePart ?? "");
    return m ? Number(m[1]) : -1;
  })();
  const shown = rects.filter((r) => r.part === `image:${focusIndex}`);
  if (!shown.length) return null;

  const handles: {
    key: string;
    label: string;
    dx: -1 | 0 | 1;
    dy: -1 | 0 | 1;
    className: string;
  }[] = [
    { key: "e", label: "Drag to set width", dx: 1, dy: 0, className: "right-[-5px] top-1/2 h-6 w-2.5 -translate-y-1/2 cursor-ew-resize" },
    { key: "w", label: "Drag to set width", dx: -1, dy: 0, className: "left-[-5px] top-1/2 h-6 w-2.5 -translate-y-1/2 cursor-ew-resize" },
    { key: "s", label: "Drag to set height", dx: 0, dy: 1, className: "bottom-[-5px] left-1/2 h-2.5 w-6 -translate-x-1/2 cursor-ns-resize" },
    { key: "n", label: "Drag to set height", dx: 0, dy: -1, className: "top-[-5px] left-1/2 h-2.5 w-6 -translate-x-1/2 cursor-ns-resize" },
    { key: "se", label: "Drag to set size", dx: 1, dy: 1, className: "bottom-[-5px] right-[-5px] h-3 w-3 cursor-nwse-resize" },
    { key: "sw", label: "Drag to set size", dx: -1, dy: 1, className: "bottom-[-5px] left-[-5px] h-3 w-3 cursor-nesw-resize" },
    { key: "ne", label: "Drag to set size", dx: 1, dy: -1, className: "right-[-5px] top-[-5px] h-3 w-3 cursor-nesw-resize" },
    { key: "nw", label: "Drag to set size", dx: -1, dy: -1, className: "left-[-5px] top-[-5px] h-3 w-3 cursor-nwse-resize" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {shown.map((r) => (
        <div
          key={r.part}
          className="absolute"
          style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
        >
          <div className="absolute inset-0 rounded-sm ring-1 ring-primary/30" />
          {handles.map((h) => (
            <button
              key={h.key}
              type="button"
              aria-label={h.label}
              title={h.label}
              onPointerDown={(e) => startDrag(e, r, h.dx, h.dy)}
              onClick={(e) => e.stopPropagation()}
              className={`pointer-events-auto absolute rounded-sm border border-background bg-primary ${h.className}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
