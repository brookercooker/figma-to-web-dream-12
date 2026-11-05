import { RefObject, useEffect } from "react";

/** Also remove tab stops for browsers/assistive tools without inert support. */
export function useInertPreview(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.setAttribute("inert", "");
    root.setAttribute("aria-hidden", "true");
    const disableFocus = () => root.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,iframe,[tabindex],[contenteditable]').forEach(node => {
      if (node.getAttribute("tabindex") !== "-1") node.setAttribute("tabindex", "-1");
    });
    disableFocus();
    const observer = new MutationObserver(disableFocus);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex", "href", "contenteditable"] });
    return () => observer.disconnect();
  }, [ref]);
}