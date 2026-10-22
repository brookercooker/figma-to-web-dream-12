import { useCallback, useState } from "react";
import { referenceKey, type ChatReference } from "./references";

/** Library items picked for the next chat request. The same item is never added twice. */
export function useChatReferences() {
  const [references, setReferences] = useState<ChatReference[]>([]);
  const [focusTick, setFocusTick] = useState(0);
  const addReference = useCallback((r: ChatReference) => {
    setReferences((cur) => (cur.some((x) => referenceKey(x) === referenceKey(r)) ? cur : [...cur, r]));
    setFocusTick((n) => n + 1); // the chat box takes focus
  }, []);
  const removeReference = useCallback((key: string) => setReferences((cur) => cur.filter((x) => referenceKey(x) !== key)), []);
  const clearReferences = useCallback(() => setReferences([]), []);
  return { references, addReference, removeReference, clearReferences, focusTick };
}
export type ChatReferences = ReturnType<typeof useChatReferences>;
