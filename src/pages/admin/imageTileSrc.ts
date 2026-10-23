import { isGatedUrl } from "@/lib/assetUrl";

type TileSources = {
  gated?: boolean;
  thumb?: string | null;
  local?: string | null;
  webUrl: string;
};

/** Visibility is not a delivery source: only private staging URLs are excluded. */
export function tileSrcCandidates({ thumb, local, webUrl }: TileSources): string[] {
  return [...new Set([thumb, local, isGatedUrl(webUrl) ? null : webUrl]
    .filter((url): url is string => !!url))];
}

export function pickTileSrc(sources: TileSources): string | null {
  return tileSrcCandidates(sources)[0] ?? null;
}