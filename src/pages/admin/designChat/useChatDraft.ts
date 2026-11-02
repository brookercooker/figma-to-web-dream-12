import { useRef, useState } from "react";

/** Lives with the Manager session, not with a particular composer render. */
export function useChatDraft() {
  const [text, setText] = useState("");
  const selection = useRef({ start: 0, end: 0, direction: "none" as "forward" | "backward" | "none", focused: false });
  return { text, setText, selection };
}