// Helpers to download original image/video files (single or bulk .zip).
import JSZip from "jszip";
import { supabase } from "@/prototype/client";
import { toast } from "sonner";
import { videoBucketFor } from "@/lib/captureUpload";

const SIGN_EXPIRY = 60 * 60; // 1 hour is plenty for a download

async function signedUrl(bucket: string, path: string): Promise<string> {
  const { data } = await (supabase as any).storage
    .from(bucket)
    .createSignedUrl(path, SIGN_EXPIRY, { download: true });
  return data?.signedUrl ?? "";
}

function triggerBrowserDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

/** Basename-only, safe for filesystems. */
function safeFilename(name: string): string {
  return (name || "download")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ensure uniqueness inside a zip so multiple items with same name don't collide. */
function uniquify(name: string, used: Set<string>): string {
  if (!used.has(name)) { used.add(name); return name; }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let i = 1; i < 10000; i++) {
    const cand = `${base}-${i}${ext}`;
    if (!used.has(cand)) { used.add(cand); return cand; }
  }
  const cand = `${base}-${Date.now()}${ext}`;
  used.add(cand);
  return cand;
}

// ---------- Images ----------

export interface DownloadableImage {
  filename: string;
  original_path?: string | null;
  original_url?: string | null;
  web_url?: string | null;
}

async function getImageDownloadUrl(img: DownloadableImage): Promise<string> {
  if (img.original_path) {
    const u = await signedUrl("images-original", img.original_path);
    if (u) return u;
  }
  return img.original_url || img.web_url || "";
}

export async function downloadOriginalImage(img: DownloadableImage): Promise<void> {
  try {
    const url = await getImageDownloadUrl(img);
    if (!url) throw new Error("no source URL");
    triggerBrowserDownload(url, safeFilename(img.filename));
  } catch (e) {
    toast.error(`Download failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ---------- Videos ----------

export type VideoSourceType = "upload" | "youtube" | "vimeo";

export interface DownloadableVideo {
  name: string;
  source_type: VideoSourceType;
  storage_path?: string | null;
  storage_url?: string | null;
  external_url?: string | null;
  visibility?: string | null;
}

async function getVideoDownloadUrl(v: DownloadableVideo): Promise<string> {
  if (v.source_type === "upload") {
    if (v.storage_path) {
      const bucket = videoBucketFor(v);
      const u = await signedUrl(bucket, v.storage_path);
      if (u) return u;
    }
    return v.storage_url || "";
  }
  return v.external_url || "";
}

export async function downloadOriginalVideo(v: DownloadableVideo): Promise<void> {
  try {
    if (v.source_type !== "upload") {
      // YouTube/Vimeo can't be downloaded directly — open the source page in a new tab.
      if (v.external_url) {
        window.open(v.external_url, "_blank", "noopener,noreferrer");
        toast.info(
          v.source_type === "youtube"
            ? "Opened YouTube in a new tab — use YouTube's download options."
            : "Opened Vimeo in a new tab — use Vimeo's download options.",
        );
        return;
      }
      throw new Error("no external URL");
    }
    const url = await getVideoDownloadUrl(v);
    if (!url) throw new Error("no source URL");
    triggerBrowserDownload(url, safeFilename(v.name));
  } catch (e) {
    toast.error(`Download failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ---------- Bulk (.zip) ----------

async function saveZip(zip: JSZip, filename: string) {
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  triggerBrowserDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function zipStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export async function downloadImagesAsZip(imgs: DownloadableImage[]): Promise<void> {
  if (!imgs.length) return;
  const id = toast.loading(`Preparing ${imgs.length} image${imgs.length === 1 ? "" : "s"}…`);
  try {
    const zip = new JSZip();
    const used = new Set<string>();
    let done = 0;
    for (const img of imgs) {
      try {
        const url = await getImageDownloadUrl(img);
        if (!url) throw new Error("no source URL");
        const blob = await fetchBlob(url);
        zip.file(uniquify(safeFilename(img.filename), used), blob);
      } catch (e) {
        // Skip failed entries but continue.
        console.warn("zip: skipped image", img.filename, e);
      }
      done += 1;
      toast.loading(`Preparing images… (${done}/${imgs.length})`, { id });
    }
    toast.loading("Compressing zip…", { id });
    await saveZip(zip, `images-${zipStamp()}.zip`);
    toast.success(`Downloaded ${imgs.length} image${imgs.length === 1 ? "" : "s"} as .zip`, { id });
  } catch (e) {
    toast.error(`Zip failed: ${e instanceof Error ? e.message : String(e)}`, { id });
  }
}

export async function downloadVideosAsZip(vids: DownloadableVideo[]): Promise<void> {
  if (!vids.length) return;
  const uploads = vids.filter((v) => v.source_type === "upload");
  const external = vids.filter((v) => v.source_type !== "upload");

  const id = toast.loading(`Preparing ${uploads.length} video${uploads.length === 1 ? "" : "s"}…`);
  try {
    const zip = new JSZip();
    const used = new Set<string>();
    let done = 0;
    for (const v of uploads) {
      try {
        const url = await getVideoDownloadUrl(v);
        if (!url) throw new Error("no source URL");
        const blob = await fetchBlob(url);
        zip.file(uniquify(safeFilename(v.name), used), blob);
      } catch (e) {
        console.warn("zip: skipped video", v.name, e);
      }
      done += 1;
      toast.loading(`Preparing videos… (${done}/${uploads.length})`, { id });
    }
    // Include a text file listing external links so they aren't silently dropped.
    if (external.length) {
      const lines = external.map((v) => `${v.name}\t${v.source_type}\t${v.external_url ?? ""}`);
      zip.file(
        "external-video-links.txt",
        [
          "The following videos are hosted externally and can't be included in this .zip.",
          "Open the link to download from the source (YouTube/Vimeo).",
          "",
          "Name\tSource\tURL",
          ...lines,
        ].join("\n"),
      );
    }
    if (!uploads.length && !external.length) {
      toast.error("Nothing to download.", { id });
      return;
    }
    toast.loading("Compressing zip…", { id });
    await saveZip(zip, `videos-${zipStamp()}.zip`);
    toast.success(
      external.length
        ? `Downloaded ${uploads.length} video${uploads.length === 1 ? "" : "s"} as .zip (${external.length} external link${external.length === 1 ? "" : "s"} listed inside)`
        : `Downloaded ${uploads.length} video${uploads.length === 1 ? "" : "s"} as .zip`,
      { id },
    );
  } catch (e) {
    toast.error(`Zip failed: ${e instanceof Error ? e.message : String(e)}`, { id });
  }
}
