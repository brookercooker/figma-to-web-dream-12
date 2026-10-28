import { forwardRef, useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementRef, type RefObject } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEADER_HEIGHT_PX } from "./layout";
import { topDropPlacement } from "./topDropPlacement";

let requestedAnchor: HTMLElement | null = null;
export function rememberTopDropAnchor(button: HTMLElement) { requestedAnchor = button; }

/** Classes for the component selector panel: drops down under the top toolbar, ~200ms, fade only with reduced motion. */
export const TOP_DROP_PANEL_CLASS =
  "fixed z-50 flex w-full max-w-[720px] max-h-[70vh] flex-col gap-0 overflow-hidden rounded-b-lg border bg-background p-0 shadow-lg duration-200 ease-out " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
  "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full " +
  "motion-reduce:[--tw-enter-translate-y:0] motion-reduce:[--tw-exit-translate-y:0]";

/** Shared panel for the Objects, Images and Videos pickers. Esc/outside click close; focus returns to the opener (Radix). */
export const TopDropContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean; anchorRef?: RefObject<HTMLElement> }>(
  ({ className, style, children, hideClose, anchorRef, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
    const opener = useRef<HTMLElement | null>(null);
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const [placement, setPlacement] = useState<ReturnType<typeof topDropPlacement> | null>(null);
    const contentRef = useCallback((node: HTMLDivElement | null) => {
      if (typeof ref === "function") ref(node); else if (ref) ref.current = node;
      if (!node) return;
      const active = document.activeElement;
      opener.current = anchorRef?.current ?? requestedAnchor ?? (active instanceof HTMLElement && active !== document.body ? active : null);
      requestedAnchor = null; setAnchor(opener.current);
    }, [ref, anchorRef]);
    useEffect(() => {
      if (!anchor) return;
      const area = anchor.closest<HTMLElement>("[data-picker-area]");
      const toolbar = area?.querySelector<HTMLElement>("[data-top-bar]") ?? document.querySelector<HTMLElement>("[data-top-bar]");
      const measure = () => setPlacement(topDropPlacement(anchor.getBoundingClientRect(), area?.getBoundingClientRect() ?? { left: 0, right: window.innerWidth, width: window.innerWidth, bottom: 0 }, window.innerWidth, toolbar?.getBoundingClientRect().bottom ?? anchor.getBoundingClientRect().bottom));
      const pressed = anchor.getAttribute("aria-pressed");
      anchor.setAttribute("aria-pressed", "true"); anchor.setAttribute("data-picker-open", "true");
      measure();
      const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
      for (const el of [anchor, area, toolbar, anchor.parentElement]) if (el) observer?.observe(el);
      window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true);
      return () => { observer?.disconnect(); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); anchor.removeAttribute("data-picker-open"); if (pressed === null) anchor.removeAttribute("aria-pressed"); else anchor.setAttribute("aria-pressed", pressed); };
    }, [anchor]);
    return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content ref={contentRef} data-top-drop-panel="" className={cn(TOP_DROP_PANEL_CLASS, className)} style={{ top: HEADER_HEIGHT_PX, ...style, ...(placement ? { top: placement.top, left: placement.left, width: placement.width, transformOrigin: `${placement.origin}px 0` } : {}) }}
        onOpenAutoFocus={event => {
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={event => { onCloseAutoFocus?.(event); if (opener.current?.isConnected) { event.preventDefault(); opener.current.focus(); } setAnchor(null); }} {...props}>
        {placement && anchor && <span aria-hidden="true" data-picker-connector="" className="pointer-events-none absolute top-0 h-1 bg-primary" style={{ left: placement.connectorLeft, width: placement.connectorWidth }} />}
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Close">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
    );
  },
);
TopDropContent.displayName = "TopDropContent";
