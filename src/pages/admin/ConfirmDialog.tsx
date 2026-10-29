import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
}

export default function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = "Confirm", destructive = true, onConfirm,
  cancelLabel = "Cancel", secondaryLabel, onSecondary, busy = false, confirmIcon, secondaryIcon, cancelIcon,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap gap-2 sm:space-x-0">
          <AlertDialogCancel className="gap-2" disabled={busy}>{cancelIcon}{cancelLabel}</AlertDialogCancel>
          {secondaryLabel && <Button type="button" variant="outline" className="gap-2" disabled={busy} onClick={onSecondary}>{secondaryIcon}{secondaryLabel}</Button>}
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => { if (secondaryLabel || busy) event.preventDefault(); onConfirm(); }}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmIcon}{confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
