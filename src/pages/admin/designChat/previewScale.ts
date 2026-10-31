/** Desktop editing renders the site at this virtual width so staff always see the real desktop layout. */
export const DESKTOP_VIRTUAL_WIDTH = 1280;

/** The scale that fits `virtual` pixels into `available` pixels; never enlarges. */
export function fitScale(available: number, virtual: number): number {
  if (!(available > 0) || !(virtual > 0)) return 1;
  return Math.min(1, available / virtual);
}

/** "Showing desktop at 62%" when shrunk, otherwise null. */
export function scaleLabel(scale: number, what = "desktop"): string | null {
  return scale < 0.995 ? `Showing ${what} at ${Math.round(scale * 100)}%` : null;
}

/** Map a rect reported inside the scaled frame to on-screen pixels relative to the wrapper. */
export function scaleRect<T extends { x?: number; y?: number; left?: number; top?: number; width?: number; height?: number }>(rect: T, scale: number): T {
  const out: Record<string, unknown> = { ...rect };
  for (const k of ["x", "y", "left", "top", "width", "height", "right", "bottom"]) if (typeof out[k] === "number") out[k] = (out[k] as number) * scale;
  return out as T;
}

/** Map an on-screen pointer offset back into frame coordinates. */
export function unscalePoint(x: number, y: number, scale: number): { x: number; y: number } {
  return { x: x / scale, y: y / scale };
}
