import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Where the page editor draws its editing options: an element in the left column of the Site Manager.
 * The left column registers it (setSlot as a ref callback); the embedded editor portals its tools into it.
 */
type EditorSlotValue = { slot: HTMLElement | null; setSlot: (el: HTMLElement | null) => void };

const Ctx = createContext<EditorSlotValue>({ slot: null, setSlot: () => {} });

export function EditorSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ slot, setSlot }), [slot]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditorSlot(): EditorSlotValue {
  return useContext(Ctx);
}
