import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type Device = "desktop" | "tablet" | "phone";
export const DEVICE_WIDTH: Record<Device, number | null> = { desktop: null, tablet: 820, phone: 390 };

/**
 * Renders children inside a same-origin iframe so the site's screen-size
 * rules respond to the frame width (true tablet / phone layout).
 */
export function DeviceFrame({ children, className, title }: { children: ReactNode; className?: string; title: string }) {
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!frame) return;
    const doc = frame.contentDocument;
    if (!doc) return;
    const sync = () => {
      doc.head.querySelectorAll("[data-copied]").forEach((n) => n.remove());
      document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => {
        const c = n.cloneNode(true) as HTMLElement;
        c.setAttribute("data-copied", "");
        doc.head.appendChild(c);
      });
    };
    sync();
    doc.documentElement.className = document.documentElement.className;
    doc.body.className = "bg-background text-foreground";
    doc.body.style.margin = "0";
    setBody(doc.body);
    const mo = new MutationObserver(sync);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [frame]);

  return (
    <iframe ref={setFrame} title={title} className={className}>
      {body && createPortal(children, body)}
    </iframe>
  );
}
