import { useCallback, useEffect, useRef, useState } from "react";
import { RELAY, type RelayState } from "./helper";

/**
 * Follows the design helper: asks for its state again and again (often while something is happening, rarely when idle).
 * `delayFor` says how long to wait before the next ask.
 */
export function useHelperState(delayFor: (s: RelayState | null) => number) {
  const [state, setState] = useState<RelayState | null>(null);
  const [offline, setOffline] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const alive = useRef(true);
  const latest = useRef<RelayState | null>(null);
  const delayRef = useRef(delayFor);
  delayRef.current = delayFor;

  const refresh = useCallback(async () => {
    clearTimeout(timer.current);
    try {
      const res = await fetch(`${RELAY}/api/state`, { cache: "no-store" });
      if (!res.ok) throw new Error("not ok");
      const s: RelayState = await res.json();
      if (!alive.current) return;
      latest.current = s;
      setState(s);
      setOffline(false);
    } catch {
      if (!alive.current) return;
      setOffline(true);
      timer.current = setTimeout(refresh, 4000);
      return;
    }
    timer.current = setTimeout(refresh, delayRef.current(latest.current));
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    return () => { alive.current = false; clearTimeout(timer.current); };
  }, [refresh]);

  /** Ask again right away (after sending a request, say). */
  const refreshSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 150);
  }, [refresh]);

  return { state, offline, refreshSoon };
}
