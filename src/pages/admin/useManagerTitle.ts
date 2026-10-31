import { useLayoutEffect } from "react";

/** Capture roots run visitor effects in this document; they may not claim the Manager's title. */
export function useManagerTitle(label: string) {
  useLayoutEffect(() => {
    const title = `${label} · Site Manager`;
    const own = Object.getOwnPropertyDescriptor(document, "title");
    const native = Object.getOwnPropertyDescriptor(Document.prototype, "title");
    const write = () => { if (native?.set) native.set.call(document, title); };
    write();
    Object.defineProperty(document, "title", { configurable: true, get: () => title, set: () => { write(); } });
    const observer = new MutationObserver(() => { if (document.querySelector("title")?.textContent !== title) write(); });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      if (own) Object.defineProperty(document, "title", own); else Reflect.deleteProperty(document, "title");
    };
  }, [label]);
}