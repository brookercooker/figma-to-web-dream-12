/** True when a page is shown inside the site manager (editor, previews, thumbnails). */
export const inEditorPreview = () => {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/manage")) return true;
  try { return window.self !== window.top; } catch { return true; }
};
