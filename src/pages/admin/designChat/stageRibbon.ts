export interface RibbonState {
  received: boolean;
  changed: boolean;
  built: boolean;
  ready: boolean;
  current: number;
  partial: number;
  elapsed: number;
  paused?: boolean;
  long?: boolean;
}
export const RIBBON_LABELS = ["Received", "Change made", "Building preview", "Ready"] as const;
export function ribbonSegments(state: RibbonState) {
  const finished = [state.received, state.changed, state.built, state.ready];
  return RIBBON_LABELS.map((label, index) => ({ label, finished: finished[index], current: index === state.current && !finished[index],
    fill: finished[index] ? 1 : index === state.current ? Math.min(1 - 1e-9, Math.max(0, state.partial)) : 0 }));
}
export const elapsedTime = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, "0")}`;