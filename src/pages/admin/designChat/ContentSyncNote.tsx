import { useEffect, useState } from "react";
import { CONTENT_SYNC_CHANGED, contentSyncDeferred, contentSyncFailed, retryContentSync } from "./contentSync";
import { Button } from "@/components/ui/button";

export default function ContentSyncNote({ previewFailed = false }: { previewFailed?: boolean }) {
  const [deferred, setDeferred] = useState(contentSyncDeferred);
  const [failed, setFailed] = useState(contentSyncFailed);
  useEffect(() => {
    const update = () => { setDeferred(contentSyncDeferred()); setFailed(contentSyncFailed()); };
    window.addEventListener(CONTENT_SYNC_CHANGED, update);
    return () => window.removeEventListener(CONTENT_SYNC_CHANGED, update);
  }, []);
  if (failed || previewFailed) return <div role="alert" className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2 text-xs"><span>Your changes are saved but the preview couldn't update. Try again</span><Button variant="outline" size="sm" onClick={retryContentSync}>Retry</Button></div>;
  return deferred ? <p role="status" className="shrink-0 border-b bg-muted px-3 py-2 text-xs text-muted-foreground">Your edits are saved. They'll be added after the current review finishes.</p> : null;
}