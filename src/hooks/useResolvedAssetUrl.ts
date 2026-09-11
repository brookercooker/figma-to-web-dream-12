import { useEffect, useState } from "react";
import { isGatedUrl, resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Resolves a possibly-gated asset URL to something the browser can load.
 *
 * Public URLs pass straight through (no render delay). Gated URLs resolve
 * asynchronously to either the published twin or a short-lived signed URL,
 * and stay empty for anonymous visitors.
 */
export function useResolvedAssetUrl(url?: string | null): string {
  const [resolved, setResolved] = useState(() => (isGatedUrl(url) ? "" : url ?? ""));

  useEffect(() => {
    if (!isGatedUrl(url)) {
      setResolved(url ?? "");
      return;
    }
    let cancelled = false;
    setResolved("");
    resolveAssetUrl(url).then((u) => {
      if (!cancelled) setResolved(u);
    });
    return () => { cancelled = true; };
  }, [url]);

  return resolved;
}
