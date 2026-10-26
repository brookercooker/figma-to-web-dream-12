/** In-app navigation of the Chat Mode preview without reloading it. */
const readyWindows = new WeakSet<Window>();

/** The visible Chat Mode preview frame (never the edit frame or the manifest receiver). */
export function shownPreviewFrame(root: ParentNode = document): HTMLIFrameElement | null {
  return root.querySelector<HTMLIFrameElement>('iframe[data-site-preview][data-preview-shown="true"]');
}
function frameOrigin(frame: HTMLIFrameElement): string | null {
  try {
    const origin = new URL(frame.src).origin;
    return origin === "null" || origin === window.location.origin || !frame.src.startsWith("https://") ? null : origin;
  } catch { return null; }
}

/** Records a `preview-ready` from a preview frame whose exact origin matches its address. */
export function notePreviewReady(event: MessageEvent, root: ParentNode = document): boolean {
  const d = event.data;
  if (!d || d.source !== "nova-site" || d.type !== "preview-ready") return false;
  for (const frame of root.querySelectorAll<HTMLIFrameElement>("iframe[data-site-preview][data-preview-shown]")) {
    if (frame.contentWindow && frame.contentWindow === event.source && frameOrigin(frame) === event.origin) {
      readyWindows.add(frame.contentWindow);
      return true;
    }
  }
  return false;
}

export type PreviewNavigate = { action: "back" | "forward" } | { action: "to"; path: string };

/** Posts the navigation to the ready preview frame. False when the message path is unavailable (caller falls back). */
export function postPreviewNavigate(nav: PreviewNavigate, root: ParentNode = document): boolean {
  if (window.self !== window.top) return false;
  const frame = shownPreviewFrame(root);
  const win = frame?.contentWindow;
  const origin = frame && frameOrigin(frame);
  if (!win || !origin || !readyWindows.has(win)) return false;
  if (nav.action === "to" && (!/^\/(?!\/)/.test(nav.path) || nav.path.length > 300)) return false;
  win.postMessage({ source: "nova-manager", type: "preview-navigate", ...nav }, origin);
  return true;
}
