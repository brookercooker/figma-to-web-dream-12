/** In-app navigation of the Chat Mode preview without reloading it. */
const readyWindows = new WeakSet<Window>();

function debugUnavailable(reason: string) {
  try { if (sessionStorage.getItem("nova:debug-nav") === "1") console.debug("[nav] unavailable reason", { reason }); } catch { /* Optional diagnostics; no embed addresses. */ }
}

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
  if (!d || (d.source !== undefined && d.source !== "nova-site") || d.type !== "preview-ready") return false;
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
  const frame = shownPreviewFrame(root);
  const win = frame?.contentWindow;
  const origin = frame && frameOrigin(frame);
  // The Manager itself runs inside Lovable's preview. Trust the child frame's exact
  // origin/window, not the Manager's position in its host's frame tree.
  if (!win || !origin || !readyWindows.has(win)) {
    debugUnavailable(!win ? "no shown preview window" : !origin ? "unsafe preview origin" : "preview not ready");
    return false;
  }
  if (nav.action === "to" && (!/^\/(?!\/)/.test(nav.path) || nav.path.length > 300)) { debugUnavailable("invalid path"); return false; }
  win.postMessage({ source: "nova-manager", type: "preview-navigate", ...nav }, origin);
  return true;
}
