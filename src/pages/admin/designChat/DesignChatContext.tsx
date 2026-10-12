import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { RelayState } from "./helper";
import { useHelperState } from "./useHelperState";
import { usePreview } from "./usePreview";

/**
 * One place that holds the design chat's live state, so the chat (always on the right of the Site Manager), the preview
 * (one of the tabs) and the buttons in the top bar all see the same thing, and nothing restarts when someone switches tabs.
 */

export type Device = "mobile" | "tablet" | "desktop";

/** A page the person picked in the Pages tab for the chat to work on. */
export type WorkingPage = { name: string; path: string };

export type DesignChat = {
  state: RelayState | null;
  offline: boolean;
  refreshSoon: () => void;
  preview: ReturnType<typeof usePreview>;
  device: Device;
  setDevice: (d: Device) => void;
  /** The element the preview sits in (what "Full screen" expands). Set by the preview. */
  boxRef: RefObject<HTMLDivElement>;
  inFull: boolean;
  /** Full screen was done by covering the window, because the browser wouldn't do it. */
  coverFull: boolean;
  toggleFull: () => void;
  workingPage: WorkingPage | null;
  /** The page the chat works on, and the preview shows. */
  selectPage: (page: WorkingPage) => void;
  /** Stop focusing the chat on a page (the preview stays where it is). */
  clearWorkingPage: () => void;
};

const Ctx = createContext<DesignChat | null>(null);

export function DesignChatProvider({ children }: { children: ReactNode }) {
  // The preview hook needs the helper's state; the helper's polling speed needs to know when the preview last reloaded.
  const lastReload = useRef<{ current: number } | null>(null);
  const { state, offline, refreshSoon } = useHelperState((s: RelayState | null) => {
    const recent = lastReload.current ? Date.now() - lastReload.current.current < 180_000 : false;
    return s && (s.busy || s.publish?.status === "reviewing" || recent) ? 1000 : 4000;
  });

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [workingPage, setWorkingPage] = useState<WorkingPage | null>(null);
  const preview = usePreview(state, previewPath);
  lastReload.current = preview.lastReloadAt;

  const [device, setDevice] = useState<Device>("desktop");
  const [full, setFull] = useState(false); // full screen done by the browser
  const [coverFull, setCoverFull] = useState(false); // or, if it won't, by covering the window
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setFull(Boolean(document.fullscreenElement));
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setCoverFull(false); };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("fullscreenchange", sync); document.removeEventListener("keydown", esc); };
  }, []);

  const toggleFull = useCallback(async () => {
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return; }
    if (coverFull) { setCoverFull(false); return; }
    try { await boxRef.current?.requestFullscreen(); } catch { setCoverFull(true); }
  }, [coverFull]);

  const selectPage = useCallback((page: WorkingPage) => {
    setWorkingPage(page);
    setPreviewPath(page.path);
  }, []);
  const clearWorkingPage = useCallback(() => setWorkingPage(null), []);

  const value = useMemo<DesignChat>(() => ({
    state, offline, refreshSoon, preview, device, setDevice, boxRef,
    inFull: full || coverFull, coverFull, toggleFull, workingPage, selectPage, clearWorkingPage,
  }), [state, offline, refreshSoon, preview, device, full, coverFull, toggleFull, workingPage, selectPage, clearWorkingPage]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The design chat's state. Only works inside <DesignChatProvider>. */
export function useDesignChat(): DesignChat {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDesignChat needs <DesignChatProvider> around it.");
  return v;
}

/** Same, but returns null outside the provider, for screens that can also be shown without the chat. */
export function useDesignChatOptional(): DesignChat | null {
  return useContext(Ctx);
}
