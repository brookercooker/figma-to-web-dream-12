import { Suspense } from "react";
import { useParams } from "react-router-dom";
import { objectRegistry } from "@/components/objects/registry";

/**
 * Minimal renderer for /preview/object/:key.
 *
 * Only mounts the requested Object component with no shell, no header, no
 * footer. Purpose: to be loaded inside a hidden iframe by the Site Manager's
 * snapshot capture so we can generate a static thumbnail for the Objects list
 * without ever mounting the live component in the list itself.
 *
 * If the key is unknown we render a neutral placeholder so html2canvas still
 * has something to paint (avoids blank thumbnails).
 */
export default function ObjectPreview() {
  const { key } = useParams();
  const entry = key ? objectRegistry[key] : undefined;

  if (!entry) {
    return (
      <div className="min-h-[600px] flex items-center justify-center bg-muted/20 text-muted-foreground text-sm">
        No preview available
      </div>
    );
  }

  const C = entry.component as React.ComponentType;
  return (
    <div className="bg-background text-foreground">
      <Suspense fallback={<div className="h-[400px] bg-muted animate-pulse" />}>
        <C />
      </Suspense>
    </div>
  );
}
