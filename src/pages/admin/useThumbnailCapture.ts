import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BUILD_ID } from "@/lib/buildVersion";

export interface ThumbCandidate {
  kind: "page" | "object";
  id: string;
  path: string;                       // renderable URL path
  updated_at: string;
  thumbnail_updated_at: string | null;
  thumbnail_build_version: string | null;
  thumbnail_url?: string | null;
}

/** A row is stale when it's never been captured, has been meaningfully edited
 *  since last capture, or was last captured against a different app build
 *  version.
 *
 *  NOTE: `object_registry` and `pages` both have a `BEFORE UPDATE` trigger
 *  that bumps `updated_at = now()` on every write — including the thumbnail
 *  write itself. That would make every row look stale ~30ms after capture and
 *  create an infinite regeneration loop (visible as the tiles flashing). We
 *  therefore require a real edit gap (>5s newer than the capture) before
 *  treating an `updated_at` bump as a reason to regenerate. Explicit user
 *  actions still call `regenerateThumbnail` directly, which bypasses this. */
const REGEN_EDIT_GAP_MS = 5_000;
export function isStale(c: ThumbCandidate): boolean {
  if (!c.thumbnail_url || !c.thumbnail_updated_at) return true;
  if ((c.thumbnail_build_version ?? "") !== BUILD_ID) return true;
  const editedAfterCapture =
    new Date(c.updated_at).getTime() - new Date(c.thumbnail_updated_at).getTime();
  if (editedAfterCapture > REGEN_EDIT_GAP_MS) return true;
  return false;
}

// Always screenshot against the published (public) domain. The preview URL
// (id-preview--*.lovable.app) is behind Lovable's own auth wall, so a headless
// browser sees Lovable's login screen instead of the app.
const CAPTURE_ORIGIN = "https://novalightingsandbox.lovable.app";

export class RouteNotResolvedError extends Error {
  constructor(msg = "Captured render is the app's 404 page — publish/build first, then regenerate.") {
    super(msg);
    this.name = "RouteNotResolvedError";
  }
}

async function captureOne(c: ThumbCandidate, force = false): Promise<void> {
  const { data, error } = await supabase.functions.invoke("capture-thumbnail", {
    body: {
      kind: c.kind,
      id: c.id,
      path: c.path,
      origin: CAPTURE_ORIGIN,
      buildVersion: BUILD_ID,
      force,
    },
  });
  // The edge function returns 200 with `skipped: "route_not_resolved"` when the
  // captured render is the app's 404 page — an expected skip, not a failure.
  const payload = (data ?? (error as any)?.context?.body ?? null) as any;
  if (payload?.error === "route_not_resolved" || payload?.skipped === "route_not_resolved") {
    throw new RouteNotResolvedError(payload.detail);
  }
  if (payload?.skipped === "object_not_ready") {
    throw new RouteNotResolvedError("Object is not marked Ready yet — thumbnail skipped.");
  }
  if (error) throw error;
}

/** Auto-trigger capture for any stale candidates, one at a time. */
export function useAutoCaptureThumbnails(
  candidates: ThumbCandidate[],
  invalidateKey: readonly unknown[],
  enabled = true,
) {
  const qc = useQueryClient();
  const inflight = useRef<Set<string>>(new Set());
  // Ids that returned "route_not_resolved" this session — skip auto-retry so
  // we don't blast the edge function for pages that haven't been built yet.
  // Manual "Regenerate thumbnail" still works because it calls captureOne
  // directly, bypassing this set.
  const skip = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    const stale = candidates.filter(
      (c) => isStale(c) && !inflight.current.has(c.id) && !skip.current.has(c.id),
    );
    if (stale.length === 0) return;
    let cancelled = false;

    (async () => {
      for (const c of stale) {
        if (cancelled) return;
        inflight.current.add(c.id);
        try {
          await captureOne(c);
          if (!cancelled) qc.invalidateQueries({ queryKey: invalidateKey });
        } catch (e) {
          if (e instanceof RouteNotResolvedError) {
            skip.current.add(c.id);
            console.info("thumbnail capture skipped (route not resolved yet)", c.id);
          } else {
            console.warn("thumbnail capture failed", c.id, e);
          }
        } finally {
          inflight.current.delete(c.id);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.map((c) => `${c.id}:${c.updated_at}:${c.thumbnail_updated_at}`).join("|"), enabled]);
}

/** Manual "Regenerate thumbnail" trigger — always forces a fresh capture. */
export async function regenerateThumbnail(c: ThumbCandidate): Promise<void> {
  await captureOne(c, true);
}
