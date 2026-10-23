import { useCallback, useEffect, useRef, useState } from "react";
import { RELAY, relayHeaders, type RelayState } from "./helper";

export function helperPollDelay(normal: number, hidden: boolean, failures: number): number {
  const base = hidden ? Math.max(30_000, normal) : normal;
  return failures > 0 ? Math.min(60_000, base * 2 ** Math.min(failures, 6)) : base;
}

/**
 * Follows the design helper: asks for its state again and again (often while something is happening, rarely when idle).
 * `delayFor` says how long to wait before the next ask.
 */
export function useHelperState(delayFor: (s: RelayState | null) => number) {
  const [state, setState] = useState<RelayState | null>(null);
  const [offline, setOffline] = useState(false);
  const delayRef = useRef(delayFor);
  delayRef.current = delayFor;
  const requestRefresh = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest: RelayState | null = null;
    let failures = 0;
    let lastStarted = -Infinity;
    let inFlight = false;
    let refreshOnFinish = false;
    const controller = new AbortController();
    const hidden = () => document.visibilityState === "hidden";
    const delay = () => helperPollDelay(delayRef.current(latest), hidden(), failures);
    const schedule = (wait: number) => {
      clearTimeout(timer);
      timer = setTimeout(refresh, wait);
    };
    const refresh = async () => {
      if (!alive || inFlight) return;
      clearTimeout(timer);
      inFlight = true;
      lastStarted = Date.now();
      try {
        const headers = await relayHeaders();
        if (!alive) return;
        const res = await fetch(`${RELAY}/api/state`, { cache: "no-store", headers, signal: controller.signal });
        if (!res.ok) throw new Error("not ok");
        const s: RelayState = await res.json();
        if (!alive) return;
        latest = s;
        failures = 0;
        setState(s);
        setOffline(false);
      } catch {
        if (!alive) return;
        failures += 1;
        setOffline(true);
      } finally {
        inFlight = false;
        if (alive) {
          schedule(refreshOnFinish && !hidden() ? 0 : delay());
          refreshOnFinish = false;
        }
      }
    };
    const onVisibility = () => {
      clearTimeout(timer);
      if (hidden()) {
        refreshOnFinish = false;
        if (!inFlight) schedule(delay());
      } else if (inFlight) {
        refreshOnFinish = true;
      } else {
        void refresh();
      }
    };
    requestRefresh.current = () => {
      if (!alive || inFlight) return;
      // Sends cannot bypass hidden-tab throttling or an active failure back-off.
      schedule(hidden() || failures > 0 ? Math.max(0, lastStarted + delay() - Date.now()) : 150);
    };
    document.addEventListener("visibilitychange", onVisibility);
    void refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      requestRefresh.current = () => {};
    };
  }, []);

  /** Ask again right away (after sending a request, say). */
  const refreshSoon = useCallback(() => requestRefresh.current(), []);

  return { state, offline, refreshSoon };
}
