// Shared helpers to classify catalog asset URLs/filenames.
// The images table stores mixed asset types (images and the occasional video);
// there is no content_type column, so we infer from the filename/URL extension.

const IMAGE_EXTS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "bmp", "ico", "tiff", "tif",
]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v", "ogv"]);

function ext(nameOrUrl: string | null | undefined): string {
  if (!nameOrUrl) return "";
  const clean = nameOrUrl.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

export function assetKind(nameOrUrl: string | null | undefined): "image" | "video" | "other" {
  const e = ext(nameOrUrl);
  if (IMAGE_EXTS.has(e)) return "image";
  if (VIDEO_EXTS.has(e)) return "video";
  return "other";
}

export const isImageAsset = (nameOrUrl: string | null | undefined) => assetKind(nameOrUrl) === "image";
export const isVideoAsset = (nameOrUrl: string | null | undefined) => assetKind(nameOrUrl) === "video";
