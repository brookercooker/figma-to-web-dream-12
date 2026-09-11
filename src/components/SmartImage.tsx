import { forwardRef } from "react";
import { useResolvedAssetUrl } from "@/hooks/useResolvedAssetUrl";
import { isGatedUrl } from "@/lib/assetUrl";

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** WebP source (the optimized `web_url` from the Images tool). */
  src: string;
  /** JPEG/PNG fallback (`fallback_url`, or the original) for non-WebP clients. */
  fallbackSrc?: string | null;
  alt: string;
}

/**
 * Renders a <picture> with a WebP source and a JPEG fallback so every browser
 * gets the smallest format it can decode. Falls back to a plain <img> when no
 * fallback URL is known.
 *
 * Gated assets (still in the private staging bucket) resolve to a short-lived
 * signed URL for signed-in Site Manager users and render nothing for anonymous
 * visitors, so an unpublished image can never leak from a draft page.
 *
 * <SmartImage src={img.web_url} fallbackSrc={img.fallback_url} alt="…" />
 */
export const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(
  ({ src, fallbackSrc, alt, loading = "lazy", decoding = "async", ...rest }, ref) => {
    const resolvedSrc = useResolvedAssetUrl(src);
    const resolvedFallback = useResolvedAssetUrl(fallbackSrc);
    const gated = isGatedUrl(src) || isGatedUrl(fallbackSrc);

    // Gated and unresolvable (anonymous visitor, or not yet signed): render
    // nothing rather than a broken image.
    if (!resolvedSrc && !resolvedFallback) {
      return gated ? null : (
        <img ref={ref} src={src} alt={alt} loading={loading} decoding={decoding} {...rest} />
      );
    }

    const primary = resolvedSrc || resolvedFallback;
    const secondary = resolvedFallback && resolvedFallback !== primary ? resolvedFallback : null;

    if (!secondary) {
      return (
        <img ref={ref} src={primary} alt={alt} loading={loading} decoding={decoding} {...rest} />
      );
    }

    return (
      <picture>
        <source srcSet={primary} type="image/webp" />
        <img
          ref={ref}
          src={secondary}
          alt={alt}
          loading={loading}
          decoding={decoding}
          {...rest}
        />
      </picture>
    );
  },
);
SmartImage.displayName = "SmartImage";
