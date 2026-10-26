import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { HEADER_HEIGHT_PX } from "./layout";

/** Classes for the component selector panel: drops down under the top toolbar, ~200ms, fade only with reduced motion. */
export const TOP_DROP_PANEL_CLASS =
  "fixed inset-x-0 z-50 mx-auto flex w-full max-w-[720px] max-h-[70vh] flex-col gap-0 overflow-hidden rounded-b-lg border border-t-0 bg-background p-0 shadow-lg duration-200 ease-out " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
  "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full " +
  "motion-reduce:[--tw-enter-translate-y:0] motion-reduce:[--tw-exit-translate-y:0]";

/** Shared panel for the Objects, Images and Videos pickers. Esc/outside click close; focus returns to the opener (Radix). */
export const TopDropContent = forwardRef<ElementRef<typeof DialogPrimitive.Content>, ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, style, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content ref={ref} data-top-drop-panel="" className={cn(TOP_DROP_PANEL_CLASS, className)} style={{ top: HEADER_HEIGHT_PX, ...style }} {...props}>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
TopDropContent.displayName = "TopDropContent";
