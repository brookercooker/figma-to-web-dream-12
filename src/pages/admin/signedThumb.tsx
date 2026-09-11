import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/prototype/client";
import { isGatedUrl } from "@/lib/assetUrl";
import { useResolvedAssetUrl } from "@/hooks/useResolvedAssetUrl";

const BUCKET = "page-thumbnails";

/** Extract the storage path from a stored thumbnail URL that references
 *  the `page-thumbnails` bucket. Returns `null` for any other URL. */
export function extractPageThumbPath(url: string | null | undefined): string | null {
  if (!url) return null;
  // Matches either `/storage/v1/object/public/page-thumbnails/<path>`
  // or a bare `page-thumbnails/<path>` prefix. Strips ?query.
  const m = url.match(/page-thumbnails\/([^?#]+)/);
  return m ? m[1] : null;
}

/** Signs a stored `page-thumbnails` URL on read. Returns the original URL
 *  for anything else (e.g. images-web fully-qualified URLs). */
export function usePageThumbSrc(url: string | null | undefined): string | undefined {
  const path = extractPageThumbPath(url);
  // Gated (private staging bucket) URLs resolve to a signed URL or, once
  // published, to their public twin.
  const gatedResolved = useResolvedAssetUrl(isGatedUrl(url) ? url : null);
  const { data } = useQuery({
    queryKey: ["page-thumb-signed", path],
    enabled: !!path,
    staleTime: 55 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).storage
        .from(BUCKET)
        .createSignedUrl(path!, 60 * 60);
      if (error) return null;
      return (data?.signedUrl as string) ?? null;
    },
  });
  if (!url) return undefined;
  if (isGatedUrl(url)) return gatedResolved || undefined;
  if (!path) return url; // not a page-thumbnails URL — pass through
  return data ?? undefined;
}

/** Drop-in <img> replacement that resolves signed URLs for private
 *  page-thumbnails storage. Non-page-thumbnails URLs pass through. */
export function SignedThumbImg({
  url,
  fallback,
  ...imgProps
}: {
  url: string | null | undefined;
  fallback?: React.ReactNode;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const src = usePageThumbSrc(url);
  if (!src) return <>{fallback ?? null}</>;
  return <img src={src} {...imgProps} />;
}
