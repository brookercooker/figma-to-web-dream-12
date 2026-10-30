import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Where the page editor draws its editing options: an element in the left column of the Site Manager.
 * The left column registers it (setSlot as a ref callback); the embedded editor portals its tools into it.
 * The embedded editor also registers its save function here, so pressing Save changes can save everything first.
 */
type SaveFn = () => Promise<boolean>;
export interface HistoryControls { undoLabel: string; redoLabel: string; changeCount?: number; undo: () => void; redo: () => void }
type EditorSlotValue = {
  historyControls: HistoryControls | null;
  registerHistory: (controls: HistoryControls | null) => void;
  slot: HTMLElement | null;
  setSlot: (el: HTMLElement | null) => void;
  registerSave: (fn: SaveFn | null) => void;
  /** Saves whatever the embedded editor holds. True when there was nothing to save or everything saved. */
  saveAll: () => Promise<boolean>;
  registerDiscard: (fn: (() => void | Promise<void>) | null) => void;
  /** Drops whatever the embedded editor holds without saving. */
  discardAll: () => Promise<void>;
  registerHasChanges: (fn: (() => boolean) | null) => void;
  /** True when the embedded editor holds unsaved changes. */
  hasChanges: () => boolean;
  /** The embedded editor's "add a library item beneath the original" handler, used by the top bar in Manual Edit Mode. */
  registerAdd: (fn: ((kind: AddKind) => void) | null) => void;
  /** True when an embedded editor took the request (its picker opened). */
  requestAdd: (kind: AddKind) => boolean;
};
export type AddKind = "objects" | "images" | "videos";

const Ctx = createContext<EditorSlotValue>({ historyControls: null, registerHistory: () => {}, slot: null, setSlot: () => {}, registerSave: () => {}, saveAll: async () => true, registerDiscard: () => {}, discardAll: async () => {}, registerHasChanges: () => {}, hasChanges: () => false, registerAdd: () => {}, requestAdd: () => false });

export function EditorSlotProvider({ children }: { children: ReactNode }) {
  const [historyControls, registerHistory] = useState<HistoryControls | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const saveRef = useRef<SaveFn | null>(null);
  const registerSave = useCallback((fn: SaveFn | null) => { saveRef.current = fn; }, []);
  const saveAll = useCallback(async () => (saveRef.current ? saveRef.current() : true), []);
  const discardRef = useRef<(() => void | Promise<void>) | null>(null);
  const registerDiscard = useCallback((fn: (() => void | Promise<void>) | null) => { discardRef.current = fn; }, []);
  const discardAll = useCallback(async () => { await discardRef.current?.(); }, []);
  const hasChangesRef = useRef<(() => boolean) | null>(null);
  const registerHasChanges = useCallback((fn: (() => boolean) | null) => { hasChangesRef.current = fn; }, []);
  const hasChanges = useCallback(() => (hasChangesRef.current ? hasChangesRef.current() : false), []);
  const addRef = useRef<((kind: AddKind) => void) | null>(null);
  const registerAdd = useCallback((fn: ((kind: AddKind) => void) | null) => { addRef.current = fn; }, []);
  const requestAdd = useCallback((kind: AddKind) => { if (!addRef.current) return false; addRef.current(kind); return true; }, []);
  const value = useMemo(
    () => ({ historyControls, registerHistory, slot, setSlot, registerSave, saveAll, registerDiscard, discardAll, registerHasChanges, hasChanges, registerAdd, requestAdd }),
    [historyControls, slot, registerSave, saveAll, registerDiscard, discardAll, registerHasChanges, hasChanges, registerAdd, requestAdd],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEditorSlot(): EditorSlotValue {
  return useContext(Ctx);
}
