import { useEffect, useState } from "react";
import { CONTENT_SYNC_CHANGED, contentSyncDeferred } from "./contentSync";

export default function ContentSyncNote() {
  const [deferred, setDeferred] = useState(contentSyncDeferred);
  useEffect(() => {
    const update = () => setDeferred(contentSyncDeferred());
    window.addEventListener(CONTENT_SYNC_CHANGED, update);
    return () => window.removeEventListener(CONTENT_SYNC_CHANGED, update);
  }, []);
  return deferred ? <p role="status" className="shrink-0 border-b bg-muted px-3 py-2 text-xs text-muted-foreground">Your edits are saved. They'll be added after the current review finishes.</p> : null;
}