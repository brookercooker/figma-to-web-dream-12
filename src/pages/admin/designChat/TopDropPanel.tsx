import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEADER_HEIGHT_PX } from "./layout";

/** Classes for the component selector panel: drops down under the top toolbar, ~200ms, fade only with reduced motion. */
export const TOP_DROP_PANEL_CLASS =
  "fixed inset-x-0 z-50 mx-auto flex w-full max-w-[720px] max-h-[70vh] flex-col gap-0 overflow-hidden rounded-b-lg border border-t-0 bg-background p-0 shadow-lg duration-200 ease-out " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
  "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full " +
  "motion-reduce:[--tw-enter-translate-y:0] motion-reduce:[--tw-exit-translate-y:0]";

/** Shared panel for the Objects, Images and Videos pickers. Esc/outside click close; focus returns to the opener (Radix). */
export const TopDropContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }>(
  ({ className, style, children, hideClose, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content ref={ref} data-top-drop-panel="" className={cn(TOP_DROP_PANEL_CLASS, className)} style={{ top: HEADER_HEIGHT_PX, ...style }} {...props}>
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Close">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
TopDropContent.displayName = "TopDropContent";
