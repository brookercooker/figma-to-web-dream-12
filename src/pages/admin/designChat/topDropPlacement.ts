export interface PickerRect { left: number; right: number; bottom: number; width: number }
/** Widest the Objects/Images/Videos pickers get: room for three cards across. Keep in sync with TOP_DROP_PANEL_CLASS. */
export const TOP_DROP_MAX_WIDTH = 1040;
/** Prefer left alignment, flip to the opener's right edge, then clamp within the editing area. */
export function topDropPlacement(anchor: PickerRect, area: PickerRect, viewportWidth: number, toolbarBottom: number) {
  const min = Math.max(0, area.left);
  const max = Math.min(viewportWidth, area.right);
  const width = Math.max(0, Math.min(TOP_DROP_MAX_WIDTH, max - min));
  const aligned = anchor.left + width <= max ? anchor.left : anchor.right - width;
  const left = Math.max(min, Math.min(aligned, max - width));
  return { left, top: toolbarBottom, width, origin: Math.max(0, Math.min(width, anchor.left + anchor.width / 2 - left)), connectorLeft: Math.max(0, anchor.left - left), connectorWidth: Math.max(0, Math.min(anchor.right, left + width) - Math.max(anchor.left, left)) };
}