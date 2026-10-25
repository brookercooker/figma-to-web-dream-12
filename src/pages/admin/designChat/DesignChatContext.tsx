import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode, type RefObject } from "react";
import type { RelayState } from "./helper";
import { useLocation } from "react-router-dom";
import { usePreviewNotifications } from "./usePreviewNotifications";
import { useHelperState } from "./useHelperState";
import { usePreview } from "./usePreview";
import { usePreviewPage, type PreviewPage } from "./usePreviewPage";
import { useDrawing, type Drawing } from "./useDrawing";
import type { RegistrablePage } from "./registerPage";
import { syncManifestPages } from "../manifestPageSync";
import { MANIFEST_CHANGED } from "../siteManifest";
import ManifestReceiverFrame from "./ManifestReceiverFrame";
import { useChatReferences, type ChatReferences } from "./useChatReferences";
import { emptyHistory, visit, step, canBack, canForward, type PreviewHistory } from "./previewHistory";

/**
 * One place that holds the design chat's live state, so the chat (always on the right of the Site Manager), the preview
 * (one of the tabs) and the buttons in the top bar all see the same thing, and nothing restarts when someone switches tabs.
 */

export type Device = "mobile" | "tablet" | "desktop";

/** A page the person picked in the Pages tab for the chat to work on. */
export type WorkingPage = { id?: string; name: string; path: string };

/** The working page and whether it is open in the editor. Kept pure so the rules can be tested. */
export type WorkingState = { workingPage: WorkingPage | null; editing: boolean };
export type WorkingAction =
  | { type: "select"; page: WorkingPage }
  | { type: "clear" }
  | { type: "start" }
  | { type: "stop" };

export function workingReducer(s: WorkingState, a: WorkingAction): WorkingState {
  switch (a.type) {
    // Picking a different page while editing keeps editing on; the editor switches to it.
    case "select": return { workingPage: a.page, editing: s.editing && !!a.page.id };
    case "clear": return { workingPage: null, editing: false };
    case "start": return s.workingPage?.id ? { ...s, editing: true } : s;
    case "stop": return s.editing ? { ...s, editing: false } : s;
  }
}

export type DesignChat = {
  mode: "chat" | "manual";
  state: RelayState | null;
  offline: boolean;
  refreshSoon: () => void;
  preview: ReturnType<typeof usePreview>;
  device: Device;
  setDevice: (d: Device) => void;
  /** The element the preview sits in (what "Full screen" expands). Set by the preview. */
  boxRef: RefObject<HTMLDivElement>;
  /** The element the page editor sits in while editing (what "Full screen" expands then). */
  editBoxRef: RefObject<HTMLDivElement>;
  inFull: boolean;
  /** Full screen was done by covering the window, because the browser wouldn't do it. */
  coverFull: boolean;
  toggleFull: () => void;
  workingPage: WorkingPage | null;
  /** The page the chat works on, and the preview shows. */
  selectPage: (page: WorkingPage) => void;
  /** Stop focusing the chat on a page (the preview stays where it is). */
  clearWorkingPage: () => void;
  /** The working page is open in the page editor (on the Preview tab), with its options in the left column. */
  editing: boolean;
  /** Open the working page in the editor. Does nothing without a working page that has an id. */
  startEditing: () => void;
  stopEditing: () => void;
  /** An object opened from the page editor, shown in its place while editing. */
  objectOpen: { id: string; section?: string } | null;
  openObject: (id: string, section?: string) => void;
  closeObject: () => void;
  /** The address the visitor is on inside the preview (null until the site reports one). */
  previewLocation: { path: string; search: string; notFound?: boolean } | null;
  /** The Site Manager page at that address, if any. */
  previewPage: PreviewPage | null;
  previewPageLoading: boolean;
  previewRegistrable: RegistrablePage | null;
  /** The pencil on the preview: marks drawn over it, sent with the next request. */
  drawing: Drawing;
  /** Library items picked from the top bar for the next request. */
  refs: ChatReferences;
  /** Back/Forward through the pages shown in the preview (both off while editing). Optional so older test mocks still fit. */
  previewNav?: { canBack: boolean; canForward: boolean; back: () => void; forward: () => void };
};

const Ctx = createContext<DesignChat | null>(null);

export function helperPollingInterval(s: RelayState | null, recent: boolean): number {
  return s && (s.busy || s.previewChecking === true || s.publish?.status === "reviewing" || recent) ? 1000 : 4000;
}

export function DesignChatProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const sync = () => { void syncManifestPages(); };
    sync();
    window.addEventListener(MANIFEST_CHANGED, sync);
    return () => window.removeEventListener(MANIFEST_CHANGED, sync);
  }, []);
  // The preview hook needs the helper's state; the helper's polling speed needs to know when the preview last reloaded.
  const lastReload = useRef<{ current: number } | null>(null);
  const { state, offline, refreshSoon } = useHelperState((s: RelayState | null) => {
    const recent = lastReload.current ? Date.now() - lastReload.current.current < 180_000 : false;
    return helperPollingInterval(s, recent);
  });

  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [navNonce, setNavNonce] = useState(0);
  const preview = usePreview(state, previewPath, navNonce);
  lastReload.current = preview.lastReloadAt;

  const [device, setDevice] = useState<Device>("desktop");
  const [full, setFull] = useState(false); // full screen done by the browser
  const [coverFull, setCoverFull] = useState(false); // or, if it won't, by covering the window
  const boxRef = useRef<HTMLDivElement>(null);
  const editBoxRef = useRef<HTMLDivElement>(null);
  const [work, dispatch] = useReducer(workingReducer, { workingPage: null, editing: false });
  const editing = work.editing;
  const mode = editing ? "manual" : "chat";
  const location = useLocation();
  usePreviewNotifications(preview.completedAt, location.pathname, editing);

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
    try { await (editing ? editBoxRef.current : boxRef.current)?.requestFullscreen(); } catch { setCoverFull(true); }
  }, [coverFull, editing]);
  // Leaving edit mode leaves full screen too.
  useEffect(() => {
    if (editing) return;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setCoverFull(false);
  }, [editing]);

  const workingPage = work.workingPage;
  const selectPage = useCallback((page: WorkingPage) => {
    dispatch({ type: "select", page });
    setPreviewPath(page.path);
    setObjectOpen(null);
  }, []);
  const clearWorkingPage = useCallback(() => { dispatch({ type: "clear" }); setObjectOpen(null); }, []);
  const startEditing = useCallback(() => dispatch({ type: "start" }), []);
  const stopEditing = useCallback(() => { dispatch({ type: "stop" }); setObjectOpen(null); }, []);
  const [objectOpen, setObjectOpen] = useState<{ id: string; section?: string } | null>(null);
  const openObject = useCallback((id: string, section?: string) => { if (editing) setObjectOpen({ id, section }); }, [editing]);
  const closeObject = useCallback(() => setObjectOpen(null), []);

  const [previewLocation, setPreviewLocation] = useState<{ path: string; search: string; notFound?: boolean } | null>(null);
  const rememberPath = preview.rememberPath;
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const d = event.data;
      if (!d || typeof d !== "object" || d.source !== "nova-site" || d.type !== "location") return;
      if (typeof d.path !== "string" || !d.path.startsWith("/") || d.path.length > 300) return;
      if (!event.source || !Array.from(document.querySelectorAll("iframe")).some((f) => f.contentWindow === event.source)) return;
      if (Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[data-manifest-receiver]")).some((f) => f.contentWindow === event.source)) return;
      console.debug("[preview] location", d.path);
      const search = typeof d.search === "string" && d.search.length <= 300 ? d.search : "";
      const notFound = d.notFound === true;
      setPreviewLocation((cur) => (cur && cur.path === d.path && cur.search === search && Boolean(cur.notFound) === notFound ? cur : { path: d.path, search, ...(notFound ? { notFound: true } : {}) }));
      rememberPath(d.path + search);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [rememberPath]);
  // Back/Forward: every address the preview reports is visited; arrivals from Back/Forward match the current entry and add nothing.
  const [history, setHistory] = useState<PreviewHistory>(emptyHistory);
  useEffect(() => {
    if (previewLocation) setHistory((h) => visit(h, previewLocation.path + previewLocation.search));
  }, [previewLocation]);
  const historyRef = useRef(history);
  historyRef.current = history;
  const go = useCallback((by: -1 | 1) => {
    if (editing) return; // the editor is on screen; leaving it goes through Finish Editing / Discard Changes
    const r = step(historyRef.current, by);
    if (!r.address) return;
    setHistory(r.history);
    setPreviewPath(r.address);
    setNavNonce((n) => n + 1);
  }, [editing]);
  const previewNav = useMemo(() => ({
    canBack: !editing && canBack(history), canForward: !editing && canForward(history),
    back: () => go(-1), forward: () => go(1),
  }), [history, go, editing]);
  const { page: previewPage, loading: previewPageLoading, registrable: previewRegistrable } = usePreviewPage(previewLocation?.path ?? null, previewLocation?.notFound);
  const drawing = useDrawing({ device, path: previewLocation?.path ?? null });
  const refs = useChatReferences();

  const value = useMemo<DesignChat>(() => ({
    mode,
    state, offline, refreshSoon, preview, device, setDevice, boxRef, editBoxRef,
    inFull: full || coverFull, coverFull, toggleFull, workingPage, selectPage, clearWorkingPage,
    editing, startEditing, stopEditing, previewLocation, previewPage, previewPageLoading, previewRegistrable, drawing, objectOpen, openObject, closeObject, refs, previewNav,
  }), [mode, refs, previewNav, objectOpen, openObject, closeObject, previewLocation, previewPage, previewPageLoading, previewRegistrable, state, offline, refreshSoon, preview, device, full, coverFull, toggleFull, workingPage, selectPage, clearWorkingPage, editing, startEditing, stopEditing, drawing]);

  return <Ctx.Provider value={value}><ManifestReceiverFrame />{children}</Ctx.Provider>;
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
