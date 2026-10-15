import { postToHelper } from "./helper";

/**
 * Tells the design helper that hand edits were saved, so they join the same
 * draft preview and "Submit for review" as chat changes. Debounced; never
 * throws or shows a toast, so editing is never interrupted.
 */
const DEBOUNCE_MS = 4000;
const BUSY_RETRY_MS = 8000;
const BUSY_MAX = 20;
const DOWN_RETRY_MS = 15000;
const DOWN_MAX = 5;

let timer: ReturnType<typeof setTimeout> | undefined;
let busyTries = 0;
let downTries = 0;

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(run, ms);
}

async function run() {
  timer = undefined;
  try {
    const r = await postToHelper("/content/sync");
    if (r.ok) return;
    if (r.data?.off === true) {
      console.debug("content sync: switched off on the helper");
      return;
    }
    if (r.data?.busy === true) {
      if (busyTries < BUSY_MAX) { busyTries++; schedule(BUSY_RETRY_MS); }
      else console.debug("content sync: helper still busy, giving up");
      return;
    }
    if (!r.data) {
      if (downTries < DOWN_MAX) { downTries++; schedule(DOWN_RETRY_MS); }
      else console.debug("content sync: helper not reachable, giving up");
      return;
    }
    console.debug("content sync failed", r.error);
  } catch (e) {
    console.debug("content sync failed", e);
  }
}

export function notifyContentEdited() {
  busyTries = 0;
  downTries = 0;
  schedule(DEBOUNCE_MS);
}
