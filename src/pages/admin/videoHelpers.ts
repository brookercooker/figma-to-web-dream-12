// Helpers for the Video tool: URL parsing, poster capture, metadata probing.

export type VideoSource = "upload" | "youtube" | "vimeo";

export interface ParsedExternal {
  source: "youtube" | "vimeo";
  videoId: string;
  canonicalUrl: string;
  posterUrl: string;
  suggestedName: string;
}

/** Parse a pasted URL into a YouTube or Vimeo reference. Returns null if unsupported. */
export function parseExternalVideoUrl(input: string): ParsedExternal | null {
  const raw = input.trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube
  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0];
    if (id) return youtubeRef(id);
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v) return youtubeRef(v);
    const parts = u.pathname.split("/").filter(Boolean);
    // /shorts/<id>, /embed/<id>, /live/<id>
    if (parts.length >= 2 && ["shorts", "embed", "live"].includes(parts[0])) {
      return youtubeRef(parts[1]);
    }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts.find((p) => /^\d+$/.test(p));
    if (id) {
      return {
        source: "vimeo",
        videoId: id,
        canonicalUrl: `https://vimeo.com/${id}`,
        // Vimeo requires an oEmbed lookup for the true thumbnail; use a
        // best-effort image endpoint and let the UI fall back if it 404s.
        posterUrl: `https://vumbnail.com/${id}.jpg`,
        suggestedName: `Vimeo ${id}`,
      };
    }
  }

  return null;
}

function youtubeRef(id: string): ParsedExternal {
  return {
    source: "youtube",
    videoId: id,
    canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    posterUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    suggestedName: `YouTube ${id}`,
  };
}

/** Load a video file into a hidden <video> to read duration/dimensions. */
export async function probeVideoFile(file: File): Promise<{ duration: number; width: number; height: number; posterBlob: Blob | null; }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    v.src = url;
    const cleanup = () => { URL.revokeObjectURL(url); };
    const bail = () => { cleanup(); resolve({ duration: 0, width: 0, height: 0, posterBlob: null }); };
    v.onerror = bail;
    v.onloadedmetadata = () => {
      const width = v.videoWidth || 0;
      const height = v.videoHeight || 0;
      const duration = isFinite(v.duration) ? v.duration : 0;
      // Seek to a frame that's likely non-black.
      const target = Math.min(duration > 1 ? 0.5 : 0.05, Math.max(0, duration - 0.05));
      const finish = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxW = 640;
          const scale = width > maxW ? maxW / width : 1;
          canvas.width = Math.round(width * scale) || 640;
          canvas.height = Math.round(height * scale) || 360;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => { cleanup(); resolve({ duration, width, height, posterBlob: blob }); },
            "image/webp", 0.8,
          );
        } catch {
          cleanup();
          resolve({ duration, width, height, posterBlob: null });
        }
      };
      v.onseeked = finish;
      try {
        v.currentTime = target;
        // Safari sometimes doesn't fire seeked without a play tick.
        setTimeout(() => { if (v.readyState >= 2 && !v.paused) return; if (v.readyState >= 2) finish(); }, 800);
      } catch { finish(); }
    };
  });
}

/**
 * Load an already-hosted video URL and grab a poster frame at ~5s (fallback ~1s,
 * else the first available frame). Non-blocking: bails after ~9s if the video's
 * metadata/index isn't reachable quickly (e.g. non-faststart uploads).
 */
export async function capturePosterFromUrl(url: string): Promise<{ blob: Blob | null; width: number; height: number; duration: number; }> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    v.src = url;

    let done = false;
    const finish = (blob: Blob | null, w: number, h: number, d: number) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      try { v.src = ""; v.removeAttribute("src"); v.load?.(); } catch { /* noop */ }
      resolve({ blob, width: w, height: h, duration: d });
    };
    const bail = () => finish(null, 0, 0, 0);
    const timeout = setTimeout(bail, 9000);
    v.onerror = bail;

    v.onloadedmetadata = () => {
      const width = v.videoWidth || 0;
      const height = v.videoHeight || 0;
      const duration = isFinite(v.duration) ? v.duration : 0;
      // Prefer 5s; fall back to 1s; else first frame.
      const target = duration >= 5.2
        ? 5
        : duration >= 1.2
          ? 1
          : Math.max(0, duration - 0.05);

      const grab = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxW = 640;
          const scale = width > maxW ? maxW / width : 1;
          canvas.width = Math.round(width * scale) || 640;
          canvas.height = Math.round(height * scale) || 360;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => finish(blob, width, height, duration),
            "image/webp", 0.8,
          );
        } catch {
          finish(null, width, height, duration);
        }
      };
      v.onseeked = grab;
      try { v.currentTime = target; }
      catch { grab(); }
    };
  });
}

export function formatDuration(secs?: number | null): string {
  if (!secs || secs <= 0) return "—";
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}
