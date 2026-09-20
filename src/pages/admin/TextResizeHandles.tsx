import { useCallback, useEffect, useRef, useState } from "react";
import type { FreeSection } from "@/components/ObjectSections";

type Rect = { part: string; left: number; top: number; width: number; height: number };

/** Parts that are wording (not pictures or videos) and can be resized by dragging. */
export function isTextPart(part: string): boolean {
  return (
    part === "eyebrow" ||
    part === "heading" ||
    part === "body" ||
    part === "button" ||
    /^text:\d+$/.test(part)
  );
}

/**
 * Drag handles drawn around the selected text box in the block canvas so its
 * width and height can be set by dragging instead of typing numbers.
 */
export default function TextResizeHandles({
  containerRef,
  activePart,
  rotation = 0,
  onResize,
}: {
  section: FreeSection;
  containerRef: React.RefObject<HTMLDivElement>;
  /** Part name of the item being edited — handles show only on that text box. */
  activePart: string;
  /** Degrees the item is turned by, so a handle grows it along its own axis. */
  rotation?: number;
  onResize: (part: string, size: { width?: number; height?: number }) => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const dragging = useRef(false);

  const measure = useCallback(() => {
    const host = containerRef.current;
    if (!host || !activePart || !isTextPart(activePart)) { setRect(null); return; }
    const base = host.getBoundingClientRect();
    // the wrapper carries the dragged width/height, so measure it when present
    const el =
      host.querySelector<HTMLElement>(`[data-part-box="${activePart}"]`) ??
      host.querySelector<HTMLElement>(`[data-part="${activePart}"]`);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) { setRect(null); return; }
    setRect({
      part: activePart,
      left: r.left - base.left,
      top: r.top - base.top,
      width: r.width,
      height: r.height,
    });
  }, [containerRef, activePart]);

  useEffect(() => {
    measure();
    const host = containerRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => { if (!dragging.current) measure(); });
    ro.observe(host);
    // follow the box while wording is typed into it
    const mo = new MutationObserver(() => { if (!dragging.current) measure(); });
    mo.observe(host, { characterData: true, childList: true, subtree: true });
    window.addEventListener("resize", measure);
    const t = window.setTimeout(measure, 300);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [measure, containerRef]);

  /** dx / dy: which way a drag on this handle grows the box (+1 right/down, -1 left/up, 0 none). */
  const startDrag = (e: React.PointerEvent, r: Rect, dx: -1 | 0 | 1, dy: -1 | 0 | 1) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = Math.round(r.width);
    const startH = Math.round(r.height);
    const move = (ev: PointerEvent) => {
      const size: { width?: number; height?: number } = {};
      if (dx) size.width = Math.max(32, startW + dx * (ev.clientX - startX));
      if (dy) size.height = Math.max(16, startH + dy * (ev.clientY - startY));
      onResize(r.part, size);
      // keep the outline and handles glued to the box while it is being dragged
      setRect((prev) =>
        prev && prev.part === r.part
          ? { ...prev, width: size.width ?? prev.width, height: size.height ?? prev.height }
          : prev,
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

  if (!rect) return null;

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
      <div
        className="absolute"
        style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
      >
        <div className="absolute inset-0 rounded-sm ring-1 ring-primary/30" />
        {handles.map((h) => (
          <button
            key={h.key}
            type="button"
            aria-label={h.label}
            title={h.label}
            onPointerDown={(e) => startDrag(e, rect, h.dx, h.dy)}
            onClick={(e) => e.stopPropagation()}
            className={`pointer-events-auto absolute rounded-sm border border-background bg-primary ${h.className}`}
          />
        ))}
      </div>
    </div>
  );
}
