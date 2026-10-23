import { useCallback, useEffect, useRef, useState } from "react";
import { EMBED_FN, SUPABASE_KEY, type RelayState } from "./helper";
import { withPath } from "./logic";
import { setManifestBase, resetSiteManifestCache } from "../siteManifest";
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
const SWAP_TIMEOUT_MS = 20000; // show a copy even if its load event never comes

type Frame = { id: number; url: string };

/** `path` is the page of the design site to show (null = its home page). Changing it loads that page. */
export function usePreview(state: RelayState | null, path: string | null = null, nav = 0) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [shownId, setShownId] = useState(0);
  const [loaded, setLoaded] = useState(false); // the first copy is on screen
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seq = useRef(0);
  const shown = useRef(0);
  const loading = useRef(false);
  const alive = useRef(true);
  const pathRef = useRef<string | null>(path);
  pathRef.current = path;
  /** Where the visitor has gone inside the preview, used for the next fresh copy instead of `path`. */
  const remembered = useRef<string | null>(null);
  const rememberPath = useCallback((p: string | null) => { remembered.current = p; }, []);
  const reloadAfter = useRef(false); // the page changed while an address was being fetched: fetch once more
  const expiry = useRef<ReturnType<typeof setTimeout>>();
  const swapTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const reloadTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const followTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const updatingTimer = useRef<ReturnType<typeof setTimeout>>();
  const clearOnSwap = useRef(false);
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
  const finish = useCallback((id: number) => {
    clearTimeout(swapTimers.current[id]);
    delete swapTimers.current[id];
    if (!alive.current) return;
    if (id < shown.current) { setFrames((fs) => fs.filter((f) => f.id !== id)); return; }
    shown.current = id;
    setShownId(id);
    setLoaded(true);
    resetSiteManifestCache();
    void syncManifestPages();
    setError(null);
    setFrames((fs) => fs.filter((f) => f.id >= id)); // older copies go; newer ones still loading stay
    if (clearOnSwap.current) { clearOnSwap.current = false; hideUpdating(); }
  }, [hideUpdating]);

  const loadPreview = useCallback(async () => {
    if (loading.current) return;
    if (!EMBED_FN) { setError("The preview isn't set up yet."); return; }
    loading.current = true;
    clearTimeout(expiry.current);
    try {
      const res = await fetch(EMBED_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(SUPABASE_KEY ? { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } : {}) },
        body: JSON.stringify({ parent_origin: window.location.origin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.embed_url) throw new Error(data.error || "Couldn't load the preview.");
      if (!alive.current) return;
      setManifestBase(data.embed_url);
      const id = ++seq.current;
      setFrames((fs) => [...fs, { id, url: withPath(data.embed_url, remembered.current ?? pathRef.current) }]);
      swapTimers.current[id] = setTimeout(() => finish(id), SWAP_TIMEOUT_MS);
      const wait = Math.max(30_000, new Date(data.expires_at).getTime() - Date.now() - REFRESH_MARGIN_MS);
      expiry.current = setTimeout(loadPreview, wait);
    } catch (e) {
      if (alive.current && shown.current === 0) setError(e instanceof Error ? e.message : "Couldn't load the preview.");
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
    resetSiteManifestCache();
    void syncManifestPages();
    loadPreview();
    followTimers.current.forEach(clearTimeout);
    followTimers.current = AFTER_BUILD_MS.map((ms) => setTimeout(() => {
      if (ms === CLEAR_AT_MS) clearOnSwap.current = true;
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

  return { frames, shownId, loaded, updating, error, finish, lastReloadAt, rememberPath };
}
