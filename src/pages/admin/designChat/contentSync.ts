import { mergeChangeLines } from "../changeLines";
import { toast } from "sonner";
import { postToHelper, RELAY, type RelayState } from "./helper";

export const CONTENT_SAVED = "nova:content-saved";
export const CONTENT_SYNC_CHANGED = "nova:content-sync-changed";
export const SYNC_RETRY_MS = 20_000;
export const SYNC_RETRY_WINDOW_MS = 30 * 60_000;
const STORAGE_KEY = `nova:content-sync-owed:${RELAY}`;
type Owed = { version: number; deferred: boolean; changes?: string[] };
function restore(): Owed | null {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); return value && typeof value.version === "number" ? value : null; } catch { return null; }
}
let owed = restore();
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
let nextRetry = 0;
let deadline = Date.now() + SYNC_RETRY_WINDOW_MS;
let latestState: RelayState | null = null;
export const contentSyncBusy = (s: RelayState | null) => !!s && (s.busy || s.publish?.status === "reviewing" || !!s.approval);
export const contentSyncDeferred = () => !!owed?.deferred;
function persist() {
  try { if (owed) localStorage.setItem(STORAGE_KEY, JSON.stringify(owed)); else localStorage.removeItem(STORAGE_KEY); } catch { /* Memory retry still works when storage is unavailable. */ }
  window.dispatchEvent(new Event(CONTENT_SYNC_CHANGED));
}
function schedule(ms: number) {
  clearTimeout(timer); timer = setTimeout(() => { timer = undefined; void run(); }, ms);
}
async function run() {
  if (!owed || inFlight || Date.now() > deadline) return;
  if (owed.deferred && (!latestState || contentSyncBusy(latestState))) return;
  const version = owed.version;
  const changes = owed.changes ?? [];
  inFlight = true; nextRetry = Date.now() + SYNC_RETRY_MS;
  try {
    const result = await postToHelper("/content/sync", changes.length ? { changes } : {});
    if (result.ok) {
      if (owed?.version === version) owed = null;
      persist();
      // The relay explains anything it left out (for example an archived object).
      const d = result.data ?? {};
      const notes = [...(Array.isArray(d.warnings) ? d.warnings : []), ...(typeof d.warning === "string" ? [d.warning] : [])]
        .map((w: unknown) => (typeof w === "string" ? w : (w as { message?: string })?.message)).filter((w): w is string => !!w);
      notes.forEach((w) => toast.warning(w));
    } else if (result.data?.busy === true && owed) {
      owed.deferred = true; persist();
    }
    // Any unsuccessful sync remains owed, including a temporary outage.
    // Existing status observations drive retries, never another status poller.
  } catch { /* Retain owed sync for the next status or page load. */ }
  finally { inFlight = false; }
}
/** Called with the status already read by useHelperState; no extra relay reads. */
export function observeContentSyncState(state: RelayState | null) {
  latestState = state;
  if (state && owed && !timer && !inFlight && !contentSyncBusy(state) && Date.now() >= nextRetry && Date.now() <= deadline) void run();
}
/** Preview wording updates immediately; relay sync is coalesced and remembered across loads.
 * `changes` are plain lines describing this save; lines from saves sharing one sync are combined and resent on retry. */
export function notifyContentEdited(changes?: string[]) {
  window.dispatchEvent(new Event(CONTENT_SAVED));
  const merged = mergeChangeLines(owed?.changes, changes);
  owed = { version: Math.max(Date.now(), (owed?.version ?? 0) + 1), deferred: owed?.deferred ?? false, ...(merged.length ? { changes: merged } : {}) };
  deadline = Date.now() + SYNC_RETRY_WINDOW_MS;
  persist();
  schedule(owed.deferred ? Math.max(0, nextRetry - Date.now()) : 4000);
}