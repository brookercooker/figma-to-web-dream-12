import { forwardRef } from "react";
import { useResolvedAssetUrl } from "@/hooks/useResolvedAssetUrl";

export interface SmartVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /** Primary playback URL (usually the WebM copy when one exists). */
  src: string;
  /** Alternate-format URL (usually the MP4 copy) for browsers that need it. */
  altSrc?: string | null;
  /** Poster frame URL. */
  poster?: string;
}

function mimeFor(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".ogv") || clean.endsWith(".ogg")) return "video/ogg";
  if (clean.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}

/**
 * Renders a <video> with one <source> per available format so the browser
 * picks the smallest file it can decode — WebM where supported, MP4 elsewhere.
 *
 * <SmartVideo src={v.alt_url ?? v.storage_url} altSrc={v.storage_url} poster={v.poster_url} controls />
 */
export const SmartVideo = forwardRef<HTMLVideoElement, SmartVideoProps>(
  ({ src, altSrc, poster, playsInline = true, preload = "metadata", children, ...rest }, ref) => {
    // Gated assets (unpublished) resolve to a signed URL for signed-in Site
    // Manager users and to nothing at all for anonymous visitors.
    const resolvedSrc = useResolvedAssetUrl(src);
    const resolvedAlt = useResolvedAssetUrl(altSrc);
    const resolvedPoster = useResolvedAssetUrl(poster);
    const sources = [resolvedSrc, resolvedAlt].filter((u): u is string => !!u);
    // WebM first: browsers take the first source they can play.
    sources.sort((a, b) => Number(mimeFor(b) === "video/webm") - Number(mimeFor(a) === "video/webm"));
    const unique = Array.from(new Set(sources));
    return (
      <video ref={ref} poster={resolvedPoster || undefined} playsInline={playsInline} preload={preload} {...rest}>
        {unique.map((u) => (
          <source key={u} src={u} type={mimeFor(u)} />
        ))}
        {children}
      </video>
    );
  },
);
SmartVideo.displayName = "SmartVideo";

export default SmartVideo;
