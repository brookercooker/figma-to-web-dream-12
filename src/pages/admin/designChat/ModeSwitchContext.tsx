import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import ConfirmDialog from "../ConfirmDialog";
import { useDesignChat } from "./DesignChatContext";
import { useEditorSlot } from "./EditorSlot";

type ModeSwitch = {
  requestChat: () => Promise<boolean>;
  requestManual: (open: () => void | Promise<void>) => Promise<boolean>;
};
const Context = createContext<ModeSwitch | null>(null);

/** Only pending confirmation lives here; the mode always comes from editing. */
export function ModeSwitchProvider({ children }: { children: ReactNode }) {
  const { editing, stopEditing, state } = useDesignChat();
  const { hasChanges, saveAll, discardAll } = useEditorSlot();
  const [pending, setPending] = useState<"chat" | "manual" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);
  const openRef = useRef<(() => void | Promise<void>) | null>(null);
  const savingRef = useRef(false);
  const complete = (ok: boolean) => {
    setPending(null); setError("");
    resolveRef.current?.(ok); resolveRef.current = null; openRef.current = null;
  };
  const wait = (next: "chat" | "manual") => {
    if (resolveRef.current) return Promise.resolve(false);
    setPending(next); setError("");
    return new Promise<boolean>((resolve) => { resolveRef.current = resolve; });
  };
  const requestChat = async () => {
    if (!editing) return true;
    if (hasChanges()) return wait("chat");
    stopEditing(); return true;
  };
  const requestManual = async (open: () => void | Promise<void>) => {
    if (state?.busy || (state?.publish?.open ?? 0) > 0 || state?.publish?.status === "reviewing" || state?.approval) {
      if (resolveRef.current) return false;
      openRef.current = open;
      return wait("manual");
    }
    await open(); return true;
  };
  const saveAndSwitch = async () => {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setError("");
    try {
      if (await saveAll()) { stopEditing(); complete(true); }
      else setError("Your edits couldn't be saved. You are still in Manual Edit Mode. Try saving again.");
    } catch {
      setError("Your edits couldn't be saved. You are still in Manual Edit Mode. Try saving again.");
    } finally { savingRef.current = false; setSaving(false); }
  };
  return (
    <Context.Provider value={{ requestChat, requestManual }}>
      {children}
      <ConfirmDialog open={pending !== null} onOpenChange={(open) => { if (!open && !savingRef.current) complete(false); }}
        title={pending === "chat" ? "You Have Unsaved Edits." : state?.busy ? "Claude Is Still Working on a Change" : "Claude Has a Change Waiting for Review"}
        description={<>{pending === "chat" ? "Save them before Claude changes this page?" : "Claude's change may affect this page. Continue editing by hand, or cancel and stay in Chat Mode."}{error && <p role="alert" className="mt-2 text-destructive">{error}</p>}</>}
        destructive={false} confirmLabel={pending === "chat" ? "Save And Switch" : "Continue Editing"}
        cancelLabel={pending === "chat" ? "Keep Editing" : "Cancel"} busy={saving}
        secondaryLabel={pending === "chat" ? "Discard And Switch" : undefined}
        onSecondary={() => { discardAll(); stopEditing(); complete(true); }}
        onConfirm={() => {
          if (pending === "chat") void saveAndSwitch();
          else void Promise.resolve(openRef.current?.()).then(() => complete(true)).catch(() => { toast.error("Couldn't open this page for editing. Try again."); complete(false); });
        }} />
    </Context.Provider>
  );
}

export const useModeSwitch = () => useContext(Context);