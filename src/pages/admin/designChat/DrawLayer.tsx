import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Camera, Eraser, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDesignChat } from "./DesignChatContext";
import { MAX_STROKES, MIN_STROKE_PX, addPoint, lengthPx, paintStrokes, thin, type Stroke } from "./drawing";

/**
 * The pencil: a see-through sheet over the preview to draw on (ring something, underline a word, draw an arrow to where it
 * should go), plus a small toolbar. While it is on, the preview underneath can't be scrolled or clicked, so the marks stay
 * over what they were drawn on. The drawing is sent with the next request.
 */
export default function DrawLayer() {
  const { drawing } = useDesignChat();
  const { strokes, add, undo, clear, cancel, picture, pictureSupported, setPicture, note, capturing } = drawing;
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const paint = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { w, h } = size.current;
    ctx.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
    paintStrokes(ctx, live.current ? [...strokesRef.current, live.current] : strokesRef.current, w, h);
  }, []);

  // Keep the canvas as big as the preview, sharp on high-density screens. A preview that is hidden (another tab) ends the drawing.
  useLayoutEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const fit = () => {
      const w = c.clientWidth, h = c.clientHeight;
      if (w === 0 || h === 0) { if (size.current.w !== 0) cancel(); return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.current = { w, h };
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [paint, cancel]);

  useEffect(paint, [strokes, paint]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [cancel, undo]);

  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (strokesRef.current.length >= MAX_STROKES) { add([]); return; } // add() says why it can't
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = at(e);
    live.current = [{ x: Math.min(1, Math.max(0, p.x)), y: Math.min(1, Math.max(0, p.y)) }];
    paint();
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!live.current) return;
    const { w, h } = size.current;
    // Pens and fast mice report in bursts: take the extra points too.
    const batch = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    const r = e.currentTarget.getBoundingClientRect();
    const events = batch.length ? batch : [e.nativeEvent];
    let changed = false;
    for (const ev of events) changed = addPoint(live.current, { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height }, w, h) || changed;
    if (changed) paint();
  };
  const up = () => {
    const s = live.current;
    live.current = null;
    const { w, h } = size.current;
    if (s && lengthPx(s, w, h) >= MIN_STROKE_PX) add(thin(s));
    else paint();
  };

  return (
    <div className="absolute inset-0 z-20" data-draw-layer>
      <canvas
        ref={canvas}
        role="img"
        aria-label="Drawing sheet over the preview. Draw with the mouse, a finger or a pen."
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none select-none"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className={cn("pointer-events-none absolute left-3 top-3 right-3 flex flex-col items-start gap-1.5", capturing && "invisible")}>
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-md border bg-background/95 p-1 shadow-md" role="toolbar" aria-label="Drawing tools">
          <span className="px-2 text-xs font-medium" aria-live="polite">
            {strokes.length === 0 ? "Draw on the page" : `${strokes.length} ${strokes.length === 1 ? "mark" : "marks"}`}
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={strokes.length === 0} aria-label="Undo the last mark" title="Undo the last mark (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={clear} disabled={strokes.length === 0} aria-label="Clear all marks" title="Clear all marks">
            <Eraser className="h-4 w-4" />
          </Button>
          {pictureSupported && (
            <Button type="button" variant={picture ? "secondary" : "ghost"} size="sm" className="h-8 gap-1.5 px-2 text-xs" aria-pressed={picture}
              onClick={() => void setPicture(!picture)} title="Send a picture of the page with your marks on it, along with the written description. Your browser asks you once to share this tab.">
              <Camera className="h-4 w-4" /> {picture ? "Picture on" : "Add a picture"}
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={cancel} aria-label="Stop drawing and remove the marks" title="Stop drawing and remove the marks (Esc)">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="pointer-events-none max-w-[min(100%,26rem)] rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
          {note ?? "Scroll the preview first, then draw. Ring what to change, or draw an arrow to where it should go, then say what you want in the chat."}
        </p>
      </div>
    </div>
  );
}
