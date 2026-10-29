import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  cancelLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  busy?: boolean;
  confirmIcon?: ReactNode;
  secondaryIcon?: ReactNode;
  cancelIcon?: ReactNode;
  /** Show the confirm button first (left), then secondary, then cancel. */
  primaryFirst?: boolean;
}

export default function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = "Confirm", destructive = true, onConfirm,
  cancelLabel = "Cancel", secondaryLabel, onSecondary, busy = false, confirmIcon, secondaryIcon, cancelIcon, primaryFirst = false,
}: Props) {
  const cancel = <AlertDialogCancel className="mt-0 gap-2" disabled={busy}>{cancelIcon}{cancelLabel}</AlertDialogCancel>;
  const secondary = secondaryLabel ? <Button type="button" variant="outline" className="gap-2" disabled={busy} onClick={onSecondary}>{secondaryIcon}{secondaryLabel}</Button> : null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={primaryFirst ? "flex-row flex-wrap justify-start gap-2 sm:justify-start sm:space-x-0" : "flex-wrap gap-2 sm:space-x-0"}>
          {!primaryFirst && cancel}
          {!primaryFirst && secondary}
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => { if (secondaryLabel || busy) event.preventDefault(); onConfirm(); }}
            className={cn("gap-2", destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "")}
          >
            {confirmIcon}{confirmLabel}
          </AlertDialogAction>
          {primaryFirst && secondary}
          {primaryFirst && cancel}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
