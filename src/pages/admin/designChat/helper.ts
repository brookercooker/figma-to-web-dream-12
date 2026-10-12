/**
 * How the Design Chat tab talks to the design helper (prototyper-local) and to the preview-address function.
 * The helper runs on the computer being used for now; its address can be changed with VITE_DESIGN_RELAY_URL.
 */

export const RELAY = (import.meta.env.VITE_DESIGN_RELAY_URL as string | undefined)?.replace(/\/$/, "") || "http://127.0.0.1:4321/__prototyper";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const EMBED_FN = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/lovable-embed-url` : "";

export type Entry = { role: "user" | "assistant" | "note" | "error"; text: string; ts?: number };

export type Finding = {
  id: string;
  issue: string;
  fix?: string;
  request?: string;
  severity?: string;
  area?: string;
  file?: string;
  accepted?: boolean;
};

export type Job = { kind?: string; status: string; startedAt: number; stepStartedAt?: number };

export type UploadRules = { maxFiles: number; maxBytes: number; accept: string };

export type RelayState = {
  busy: boolean;
  job: Job | null;
  previewVersion: number;
  previewBuiltAt?: number | null;
  history: Entry[];
  publish?: { ok?: boolean; open: number; status?: string; willReview?: boolean };
  draft?: { review?: { state?: string; locked?: boolean; findings?: Finding[] } };
  review?: { enabled?: boolean; mode?: string };
  liveUrl?: string | null;
  embedEnabled?: boolean;
  uploads?: UploadRules;
};

/** Used until the helper has said what it accepts (these match the helper's own rules). */
export const DEFAULT_UPLOADS: UploadRules = {
  maxFiles: 5,
  maxBytes: 10 * 1024 * 1024,
  accept: ".png,.jpg,.jpeg,.gif,.webp,.pdf,.docx,.doc,.txt,.md,.csv",
};

/** POST JSON to the helper. Returns { ok } or { ok: false, error } with a message fit to show. */
export async function postToHelper(path: string, body?: unknown): Promise<{ ok: boolean; error?: string; data?: any }> {
  try {
    const res = await fetch(`${RELAY}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "That didn't go through. Try again.", data };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Can't reach the design service right now. Try again in a moment." };
  }
}
