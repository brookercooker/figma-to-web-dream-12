/** Private staging URLs are never a usable tile fallback. */
export function pickTileSrc({ gated, thumb, local, webUrl }: {
  gated: boolean;
  thumb?: string | null;
  local?: string | null;
  webUrl: string;
}): string | null {
  return thumb || local || (gated ? null : webUrl);
}