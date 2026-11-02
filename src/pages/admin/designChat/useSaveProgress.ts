import { useEffect, useReducer, useRef, useState } from "react";
import { CONTENT_SYNC_CHANGED, contentSyncFailed, contentSyncPending, contentSyncStartedAt, contentSyncDeferred } from "./contentSync";
import { timedProgress, type WaitView } from "./waitEstimates";

export function useSaveProgress(saving: boolean, stillDirty = false) {
  const [now, setNow] = useState(Date.now);
  const [, refresh] = useReducer(n => n + 1, 0);
  const t = useRef<{ start: number; high: number; done?: number; failed?: boolean } | null>(null);
  const lastSaving = useRef(false);
  useEffect(() => {
    const update = () => { setNow(Date.now()); refresh(); };
    const timer = setInterval(update, 250);
    window.addEventListener(CONTENT_SYNC_CHANGED, update);
    return () => { clearInterval(timer); window.removeEventListener(CONTENT_SYNC_CHANGED, update); };
  }, []);
  if (saving && !lastSaving.current) t.current = { start: now, high: 0 };
  // Sync debt persists across reloads and outlives the Manual Edit toolbar.
  if (!t.current && contentSyncPending()) t.current = { start: contentSyncStartedAt() ?? now, high: 0 };
  lastSaving.current = saving;
  const track = t.current;
  if (!track) return null;
  let progress: WaitView;
  if (contentSyncFailed()) progress = { value: track.high, label: "Your changes are saved, but couldn't reach the draft", error: true };
  else if (contentSyncDeferred()) progress = { value: track.high, label: "Waiting for the current task to finish" };
  else if (!saving && stillDirty && !contentSyncPending()) progress = { value: track.high, label: "Your changes couldn't be saved", error: true };
  else if (!saving && !contentSyncPending()) {
    track.done ??= now;
    if (now - track.done > 1700) return null;
    progress = { value: 1, label: "Done", done: true, fading: now - track.done >= 1500 };
  } else {
    progress = timedProgress("save", 0, (now - track.start) / 1000, "Adding your edits to the draft", track.high);
    track.high = progress.value;
  }
  return progress;
}