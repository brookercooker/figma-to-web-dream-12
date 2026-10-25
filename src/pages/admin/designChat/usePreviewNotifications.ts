import { useEffect, useRef } from "react";
import { toast } from "sonner";
const PREFIX = "Preview Updated · ";

/** Notify only after a confirmed build's loaded frame is swapped, never on timer fallbacks. */
export function usePreviewNotifications(completedAt: number, pathname: string, editing: boolean) {
  const seen = useRef(completedAt);
  const pending = useRef(false);
  useEffect(() => {
    const returned = () => {
      if (document.visibilityState !== "hidden" && document.hasFocus()) {
        pending.current = false;
        if (document.title.startsWith(PREFIX)) document.title = document.title.slice(PREFIX.length);
      }
    };
    window.addEventListener("focus", returned);
    document.addEventListener("visibilitychange", returned);
    return () => {
      window.removeEventListener("focus", returned);
      document.removeEventListener("visibilitychange", returned);
      if (pending.current && document.title.startsWith(PREFIX)) document.title = document.title.slice(PREFIX.length);
    };
  }, []);
  useEffect(() => {
    if (!completedAt || seen.current === completedAt) return;
    seen.current = completedAt;
    if (editing) return;
    if (document.visibilityState === "hidden" || !document.hasFocus()) {
      pending.current = true;
      if (!document.title.startsWith(PREFIX)) document.title = PREFIX + document.title;
    }
    if (pathname.startsWith("/manage/") && pathname !== "/manage/preview") toast("Your Preview Is Updated");
  }, [completedAt, pathname, editing]);
}
