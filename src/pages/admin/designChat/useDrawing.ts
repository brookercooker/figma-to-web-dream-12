import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreviewCamera } from "./capture";
import { MAX_STROKES, askSite, buildMarks, type MarksPayload, type Stroke } from "./drawing";

/**
 * The pencil's state, shared by the preview (where the drawing shows), the top bar (the pencil button) and the chat (which
 * sends the drawing with a request). Drawing mode is also what keeps the preview from scrolling, so what was drawn stays
 * over what it was drawn on: it lasts until the drawing is sent or cancelled.
 */
export type DrawingPrepared = { marks: MarksPayload; image: string | null };

export function useDrawing(o: { device: string; path: string | null }) {
  const [on, setOn] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [picture, setPictureState] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const camera = useRef<PreviewCamera | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;
  const latest = useRef(o);
  latest.current = o;

  const stopCamera = useCallback(() => { camera.current?.stop(); setPictureState(false); }, []);

  const cancel = useCallback(() => { setOn(false); setStrokes([]); setNote(null); stopCamera(); }, [stopCamera]);
  const start = useCallback(() => { setOn(true); setNote(null); }, []);
  const toggle = useCallback(() => { if (on) cancel(); else start(); }, [on, cancel, start]);
  const undo = useCallback(() => setStrokes((s) => s.slice(0, -1)), []);
  const clear = useCallback(() => setStrokes([]), []);
  const add = useCallback((s: Stroke) => {
    setStrokes((cur) => {
      if (cur.length >= MAX_STROKES) { setNote(`That's the most marks for one request (${MAX_STROKES}). Undo one, or send this request first.`); return cur; }
      setNote(null);
      return [...cur, s];
    });
  }, []);

  /** Turns the picture on (the browser asks the person once) or off. */
  const setPicture = useCallback(async (want: boolean) => {
    if (!want) { stopCamera(); return; }
    const area = areaRef.current;
    if (!area) return;
    camera.current ??= new PreviewCamera();
    camera.current.onEnded = () => { setPictureState(false); setNote("Picture sharing stopped. The drawing will be sent without a picture."); };
    const r = await camera.current.start(area);
    if (r.ok) { setPictureState(true); setNote(null); } else { setPictureState(false); setNote(r.error); }
  }, [stopCamera]);

  // Anything that changes what is under the strokes ends the drawing: a different size, a different page.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (strokesRef.current.length) { setStrokes([]); setNote("The preview changed, so the drawing was cleared."); }
  }, [o.device, o.path]);

  useEffect(() => () => camera.current?.stop(), []);

  /** At send time: ask the site what is under the strokes, and take the picture if it is on. Null when there is no drawing. */
  const prepare = useCallback(async (): Promise<DrawingPrepared | null> => {
    const list = strokesRef.current;
    const area = areaRef.current;
    if (!list.length || !area || area.clientWidth === 0) return null;
    const frame = area.querySelector<HTMLIFrameElement>('iframe[data-preview-shown="true"]');
    const reply = await askSite(frame, list);
    const marks = buildMarks({ strokes: list, width: area.clientWidth, height: area.clientHeight, device: latest.current.device, path: latest.current.path, reply });
    let image: string | null = null;
    if (camera.current?.active) {
      setCapturing(true); // hides the toolbar for the moment the picture is taken
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      try { image = await camera.current.grab(area); } catch { image = null; }
      setCapturing(false);
      if (!image) setNote("The picture couldn't be taken, so the drawing was sent without one.");
    }
    return { marks, image };
  }, []);

  return useMemo(
    () => ({ on, strokes, picture, note, capturing, areaRef, start, cancel, toggle, undo, clear, add, setPicture, prepare, pictureSupported: PreviewCamera.supported() }),
    [on, strokes, picture, note, capturing, start, cancel, toggle, undo, clear, add, setPicture, prepare],
  );
}

export type Drawing = ReturnType<typeof useDrawing>;
