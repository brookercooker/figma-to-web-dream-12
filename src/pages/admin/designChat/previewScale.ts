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

/** Below this the desktop is too small to read or click; the tablet layout is recommended instead. */
export const MIN_READABLE_SCALE = 0.5;
/** A realistic desktop viewport height: max(800, 1280 × 10/16). */
export const MAX_VIRTUAL_HEIGHT = Math.max(800, DESKTOP_VIRTUAL_WIDTH * 10 / 16);

export interface ScaledPlan { scaled: boolean; width: number; height: number; scale: number; label: string | null }

/** How a scaled frame is laid out: which virtual width, its scale, a capped virtual height and the label to show. */
export function scaledViewportPlan({ available, height, virtualWidth, enabled, fallbackWidth, explicit = false, what = "desktop", fallbackWhat = "tablet" }: {
  available: number; height: number; virtualWidth: number; enabled: boolean; fallbackWidth?: number; explicit?: boolean; what?: string; fallbackWhat?: string;
}): ScaledPlan {
  const none: ScaledPlan = { scaled: false, width: available, height, scale: 1, label: null };
  if (!enabled || !(available > 0)) return none;
  let width = virtualWidth;
  let scale = fitScale(available, width);
  let label = scaleLabel(scale, what);
  if (scale < MIN_READABLE_SCALE && fallbackWidth) {
    if (explicit) label = `${label}; ${fallbackWhat[0].toUpperCase()}${fallbackWhat.slice(1)} recommended at this size`;
    else {
      width = fallbackWidth; scale = fitScale(available, width);
      label = scale < 0.995 ? `Showing ${fallbackWhat} at ${Math.round(scale * 100)}% (recommended at this size)` : `Showing ${fallbackWhat} (recommended at this size)`;
    }
  }
  if (scale >= 0.995) return { ...none, label: width !== virtualWidth ? label : null };
  const virtualHeight = Math.min(height / scale, MAX_VIRTUAL_HEIGHT);
  return { scaled: true, width, height: virtualHeight, scale, label };
}
