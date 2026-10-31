import { useCallback, useEffect, useRef, useState } from "react";
import { EMBED_FN, SUPABASE_KEY, type RelayState } from "./helper";
import { publicPreviewBase, publicPreviewPage } from "./publicPreviewUrl";
import { setManifestBase, resetSiteManifestCache, isSafePublicFrameUrl } from "../siteManifest";
import { previewExcluded, previewStage, type PreviewStage } from "./previewProgress";
import { syncManifestPages } from "../manifestPageSync";

/**
 * The draft preview and how it keeps up with changes.
 *
 * The builder finishes a change before the preview has rebuilt (that takes another half minute or so, and nothing says when it
 * is done), so the preview reloads when the builder finishes, a few more times on a timer, when the helper sees the new build,
 * and a few times just after that. Every reload loads a fresh copy in a hidden frame and swaps it in once it is ready, so the
 * preview never flashes blank and the old and new pages are never on screen together. While this goes on, a message sits over
 * the preview ("Loading your updated preview…"); it clears when the reload that follows the new build is on screen.
 */

const RELOAD_AFTER_MS = [6000, 15000, 30000, 60000, 120000]; // after the builder finishes
const AFTER_BUILD_MS = [4000, 10000, 20000]; // after the helper sees the new build
const CLEAR_AT_MS = 10000; // the message clears with the reload this long after the new build is seen
const UPDATING_FALLBACK_MS = 70000; // longest the message stays when no new build is reported (a rebuild shows within about 50 s)
const REFRESH_MARGIN_MS = 5 * 60 * 1000; // ask for a new preview address this long before the old one expires
const SWAP_TIMEOUT_MS = 10000; // Fail visibly rather than claim an unconfirmed public frame loaded.

type Frame = { id: number; url: string };

/** `path` is the page of the design site to show (null = its home page). Changing it loads that page. */
export function usePreview(state: RelayState | null, path: string | null = null, nav = 0) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [shownId, setShownId] = useState(0);
  const [loaded, setLoaded] = useState(false); // the first copy is on screen
  const [updating, setUpdating] = useState(false);
  const [completedAt, setCompletedAt] = useState(0);
  const [buildDetected, setBuildDetected] = useState(false);
  const buildFrame = useRef<number | null>(null);
  const stateRef = useRef(state); stateRef.current = state;
  const [clock, setClock] = useState(Date.now());
  const updateStart = useRef<number | null>(null);
  const highStage = useRef<PreviewStage | null>(null);
  const jobStart = useRef<number | null>(null);
  const completedJob = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seq = useRef(0);
  const shown = useRef(0);
  const loading = useRef(false);
  const alive = useRef(true);
  const pathRef = useRef<string | null>(path);
  pathRef.current = path;
  /** Where the visitor has gone inside the preview, used for the next fresh copy instead of `path`. */
  const remembered = useRef<string | null>(null);
  /** A page picked on purpose sticks until the preview reports it: earlier reports (e.g. the home page still loading) never override it. */
  const pinned = useRef<string | null>(null);
  const rememberPath = useCallback((p: string | null) => {
    if (pinned.current && p !== pinned.current && p?.split("?")[0] !== pinned.current) return;
    pinned.current = null;
    remembered.current = p;
  }, []);
  const reloadAfter = useRef(false); // the page changed while an address was being fetched: fetch once more
  const expiry = useRef<ReturnType<typeof setTimeout>>();
  const swapTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const reloadTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const followTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const updatingTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastVersion = useRef<number | null>(null);
  const lastBuiltAt = useRef<number | null>(null);
  /** When the last reload was started, so the page can ask the helper for news more often for a while. */
  const lastReloadAt = useRef(0);

  const hideUpdating = useCallback(() => { clearTimeout(updatingTimer.current); setUpdating(false); }, []);
  const showUpdating = useCallback((clearAfterMs: number) => {
    setUpdating(true);
    clearTimeout(updatingTimer.current);
    updatingTimer.current = setTimeout(() => setUpdating(false), clearAfterMs);
  }, []);

  /** A copy has loaded (or timed out): it becomes the one shown, unless a newer one is already on screen. */
  const finish = useCallback((id: number, confirmed = true) => {
    clearTimeout(swapTimers.current[id]);
    delete swapTimers.current[id];
    if (!alive.current) return;
    if (id < shown.current) { setFrames((fs) => fs.filter((f) => f.id !== id)); return; }
    shown.current = id;
    setShownId(id);
    setLoaded(true);
    void syncManifestPages();
    setError(null);
    setFrames((fs) => fs.filter((f) => f.id >= id)); // older copies go; newer ones still loading stay
    if (confirmed && buildFrame.current !== null && id >= buildFrame.current && !previewExcluded(stateRef.current)) {
      buildFrame.current = null;
      setBuildDetected(false);
      hideUpdating();
      highStage.current = null;
      updateStart.current = null;
      completedJob.current = stateRef.current?.job?.startedAt ?? jobStart.current;
      setCompletedAt(Date.now());
    }
  }, [hideUpdating]);

  const loadPreview = useCallback(async () => {
    if (loading.current) return;
    if (!EMBED_FN) { setError("The preview isn't set up yet."); return; }
    loading.current = true;
    clearTimeout(expiry.current);
    try {
      const res = await fetch(EMBED_FN, {
        method: "POST",
        signal: AbortSignal.timeout(5000),
        headers: { "Content-Type": "application/json", ...(SUPABASE_KEY ? { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } : {}) },
        body: JSON.stringify({ parent_origin: window.location.origin }),
      });
      const data = await res.json().catch(() => ({}));
      const base = publicPreviewBase(res.ok ? data.embed_url : null);
      if (!isSafePublicFrameUrl(base)) throw new Error("Couldn't load the preview.");
      if (!alive.current) return;
      setManifestBase(base);
      const id = ++seq.current;
      setFrames((fs) => [...fs, { id, url: publicPreviewPage(base, remembered.current ?? pathRef.current) }]);
      swapTimers.current[id] = setTimeout(() => { if (alive.current) setError("The live preview couldn't load. Try again."); }, SWAP_TIMEOUT_MS);
      const expires = new Date(data.expires_at).getTime();
      const wait = Number.isFinite(expires) ? Math.min(2_147_483_647, Math.max(30_000, expires - Date.now() - REFRESH_MARGIN_MS)) : 30 * 60_000;
      expiry.current = setTimeout(loadPreview, wait);
    } catch (e) {
      if (alive.current) {
        try {
          const base = publicPreviewBase(null);
          setManifestBase(base);
          const id = ++seq.current;
          setFrames(fs => [...fs, { id, url: publicPreviewPage(base, remembered.current ?? pathRef.current) }]);
          swapTimers.current[id] = setTimeout(() => { if (alive.current) setError("The live preview couldn't load. Try again."); }, SWAP_TIMEOUT_MS);
        } catch { setError(e instanceof Error ? e.message : "Couldn't load the preview."); }
      }
    } finally {
      loading.current = false;
      if (reloadAfter.current && alive.current) { reloadAfter.current = false; void loadPreview(); }
    }
  }, [finish]);

  /** The builder finished a change: reload now and a few more times, and say so over the preview. */
  const reloadSoon = useCallback(() => {
    resetSiteManifestCache();
    lastReloadAt.current = Date.now();
    followTimers.current.forEach(clearTimeout); followTimers.current = [];
    reloadTimers.current.forEach(clearTimeout);
    loadPreview();
    showUpdating(UPDATING_FALLBACK_MS);
    reloadTimers.current = RELOAD_AFTER_MS.map((ms) => setTimeout(loadPreview, ms));
  }, [loadPreview, showUpdating]);

  /** The helper saw the preview's new build: reload now and a few times just after (the build is served a little later). */
  const buildSeen = useCallback((showing: boolean) => {
    // A confirmed build supersedes the older builder-finished retry series.
    reloadTimers.current.forEach(clearTimeout); reloadTimers.current = [];
    resetSiteManifestCache();
    void syncManifestPages();
    buildFrame.current = seq.current + 1;
    setBuildDetected(true);
    loadPreview();
    followTimers.current.forEach(clearTimeout);
    followTimers.current = AFTER_BUILD_MS.map((ms) => setTimeout(() => {
      // Completion is acknowledged by the confirmed build frame load, not a timer.
      loadPreview();
    }, ms));
    if (showing) showUpdating(CLEAR_AT_MS + 8000);
  }, [loadPreview, showUpdating]);

  // First copy.
  useEffect(() => {
    alive.current = true;
    loadPreview();
    return () => {
      alive.current = false;
      clearTimeout(expiry.current);
      clearTimeout(updatingTimer.current);
      reloadTimers.current.forEach(clearTimeout);
      followTimers.current.forEach(clearTimeout);
      Object.values(swapTimers.current).forEach(clearTimeout);
    };
  }, [loadPreview]);

  // A different page was picked (or Back/Forward, which bumps `nav`): load it (without the "updating" message, nothing was changed).
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) { firstPath.current = false; return; }
    remembered.current = null; // a page was picked on purpose
    reloadTimers.current.forEach(clearTimeout); reloadTimers.current = [];
    followTimers.current.forEach(clearTimeout); followTimers.current = [];
    pinned.current = path;
    if (loading.current) reloadAfter.current = true; // an address is being fetched for the old page; fetch again when it's done
    else loadPreview();
  }, [path, nav, loadPreview]);

  // Follow the helper.
  const version = state?.previewVersion;
  const builtAt = state?.previewBuiltAt ?? null;
  const embedEnabled = state?.embedEnabled !== false;
  useEffect(() => {
    if (version === undefined) return;
    if (lastVersion.current !== null && version !== lastVersion.current && embedEnabled) reloadSoon();
    lastVersion.current = version;
  }, [version, embedEnabled, reloadSoon]);
  useEffect(() => {
    if (state === null) return;
    if (builtAt && builtAt !== lastBuiltAt.current && lastBuiltAt.current !== null) buildSeen(updating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    lastBuiltAt.current = builtAt ?? 0;
  }, [builtAt, state === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const candidate = state?.job?.startedAt && state.job.startedAt === completedJob.current && !buildDetected ? null : previewStage(state, updating, buildDetected);
  const start = state?.job?.startedAt;
  if (start && start !== jobStart.current) {
    jobStart.current = start; highStage.current = null; updateStart.current = start;
  }
  if (candidate) {
    highStage.current = Math.max(highStage.current ?? 1, candidate) as PreviewStage;
    updateStart.current ??= start ?? state?.job?.stepStartedAt ?? Date.now();
  } else if (previewExcluded(state)) { highStage.current = null; updateStart.current = null; }
  const progressStage = previewExcluded(state) ? null : highStage.current;
  useEffect(() => {
    if (!progressStage) return;
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [progressStage]);
  useEffect(() => {
    if (!previewExcluded(state)) return;
    buildFrame.current = null; setBuildDetected(false); hideUpdating();
  }, [state, hideUpdating]);
  return { frames, shownId, loaded, updating, error, finish, retry: loadPreview, lastReloadAt, rememberPath,
    progressStage, elapsedMs: Math.max(0, clock - (updateStart.current ?? clock)), completedAt };
}
