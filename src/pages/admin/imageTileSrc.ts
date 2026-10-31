import { isGatedUrl } from "@/lib/assetUrl";

type TileSources = {
  gated?: boolean;
  thumb?: string | null;
  local?: string | null;
  webUrl: string;
  fallbackUrl?: string | null;
  originalUrl?: string | null;
};

export function libraryImageCandidates(row: { web_url?: string | null; fallback_url?: string | null; original_url?: string | null }): string[] {
  return [...new Set([row.web_url, row.fallback_url, row.original_url].filter((url): url is string => !!url && !isGatedUrl(url)))];
}

/** Visibility is not a delivery source: only private staging URLs are excluded. */
export function tileSrcCandidates({ thumb, local, webUrl, fallbackUrl, originalUrl }: TileSources): string[] {
  return [...new Set([thumb, local, ...libraryImageCandidates({ web_url: webUrl, fallback_url: fallbackUrl, original_url: originalUrl })]
    .filter((url): url is string => !!url))];
}

export function pickTileSrc(sources: TileSources): string | null {
  return tileSrcCandidates(sources)[0] ?? null;
}