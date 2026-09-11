// Client-side image optimization: resize to max 1920px, then encode BOTH a
// WebP (primary) and a JPEG (universal fallback) so consumers can serve a
// <picture> element with graceful degradation.
export interface OptimizedImage {
  blob: Blob;
  width: number;
  height: number;
}

export interface OptimizedImagePair extends OptimizedImage {
  /** JPEG fallback for browsers/clients without WebP support. */
  fallbackBlob: Blob;
}

async function drawScaled(file: File, maxSide: number) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  // JPEG has no alpha — paint white behind transparent source pixels.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return { canvas, w, h };
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

export async function optimizeImage(file: File, maxSide = 1920, quality = 0.8): Promise<OptimizedImage> {
  const { canvas, w, h } = await drawScaled(file, maxSide);
  const blob = await encode(canvas, "image/webp", quality);
  return { blob, width: w, height: h };
}

/** Encode the same resized frame as WebP + JPEG in one pass. */
export async function optimizeImagePair(
  file: File,
  maxSide = 1920,
  quality = 0.8,
): Promise<OptimizedImagePair> {
  const { canvas, w, h } = await drawScaled(file, maxSide);
  const blob = await encode(canvas, "image/webp", quality);
  const fallbackBlob = await encode(canvas, "image/jpeg", Math.min(0.9, quality + 0.05));
  return { blob, fallbackBlob, width: w, height: h };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
