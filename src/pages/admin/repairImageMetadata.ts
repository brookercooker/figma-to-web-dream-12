import { supabase } from "@/prototype/client";
import { isImageAsset } from "./assetType";

export interface RepairImage {
  id: string;
  web_url: string;
  filename?: string | null;
  width: number | null;
  height: number | null;
  web_bytes: number | null;
  original_bytes: number | null;
}

export interface RepairResult {
  scanned: number;
  updated: number;
  broken: number;
  brokenIds: string[];
}

function loadDims(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (v: { width: number; height: number } | null) => {
      if (done) return;
      done = true;
      resolve(v);
    };
    img.onload = () => finish({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
    img.onerror = () => finish(null);
    setTimeout(() => finish(null), 15000);
    img.src = url;
  });
}

async function fetchBytes(url: string): Promise<number | null> {
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) {
      const len = head.headers.get("content-length");
      if (len) {
        const n = parseInt(len, 10);
        if (n > 0) return n;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const b = await r.blob();
    return b.size > 0 ? b.size : null;
  } catch {
    return null;
  }
}

export async function repairImageMetadata(
  imgs: RepairImage[],
  onProgress?: (done: number, total: number) => void,
): Promise<RepairResult> {
  let done = 0;
  let updated = 0;
  const brokenIds: string[] = [];

  for (const img of imgs) {
    try {
      // Non-image assets (video, etc.) don't have decodable dimensions.
      // Reachability is proven by a successful byte fetch — never mark broken
      // just because <img> can't decode them.
      const isImage = isImageAsset(img.filename ?? img.web_url);
      const needDims = isImage && (!img.width || !img.height);
      const needBytes = !img.web_bytes;

      if (needDims || needBytes) {
        const patch: Record<string, number> = {};
        let bytesOk = !needBytes;

        if (needBytes) {
          const bytes = await fetchBytes(img.web_url);
          if (bytes && bytes > 0) { patch.web_bytes = bytes; bytesOk = true; }
        }

        if (needDims) {
          const dims = await loadDims(img.web_url);
          if (dims && dims.width > 0 && dims.height > 0) {
            if (!img.width) patch.width = dims.width;
            if (!img.height) patch.height = dims.height;
          } else if (!bytesOk) {
            // Only flag broken when even the byte fetch failed.
            brokenIds.push(img.id);
          }
        } else if (needBytes && !bytesOk && isImage) {
          brokenIds.push(img.id);
        }

        if (Object.keys(patch).length) {
          const { error } = await (supabase as any).from("images").update(patch).eq("id", img.id);
          if (!error) updated++;
        }
      }
    } catch {
      // Only treat as broken for image assets; a video that throws here is inconclusive.
      if (isImageAsset(img.filename ?? img.web_url)) brokenIds.push(img.id);
    }
    done++;
    onProgress?.(done, imgs.length);
  }

  return { scanned: imgs.length, updated, broken: brokenIds.length, brokenIds };
}
