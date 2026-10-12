import { useCallback, useEffect, useRef, useState } from "react";
import { IDLE_HINT } from "./logic";

/** A short message under the chat box. It clears itself, so nothing stale stays on screen. */
export function useHint() {
  const [hint, setHintState] = useState<{ text: string; bad: boolean }>({ text: IDLE_HINT, bad: false });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const setHint = useCallback((text?: string, bad = false, ms?: number) => {
    clearTimeout(timer.current);
    setHintState({ text: text || IDLE_HINT, bad: Boolean(text && bad) });
    if (text && ms !== 0) timer.current = setTimeout(() => setHintState({ text: IDLE_HINT, bad: false }), ms || 7000);
  }, []);
  return { hint, setHint };
}
