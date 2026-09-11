import { useEffect, useRef, useState } from "react";
import { assetKind } from "./assetType";
import { requestRouteSnapshot, getCachedRouteSnapshot } from "./routeSnapshot";
import { usePageThumbSrc } from "./signedThumb";

/**
 * Static thumbnail tile.
 * - kind="image": plain <img> / <video> — no hover-to-enlarge interaction.
 * - kind="page": lazy captured snapshot of the actual page route via hidden iframe,
 *   triggered when the tile scrolls into view.
 * - kind="object": lightweight label tile (objects render full-size in the gallery).
 */
export default function Thumbnail({
  kind,
  src,
  name,
  route,
  cacheKey,
  width = 140,
  height = 88,
  storedUrl,
  placeholderLabel,
  placeholderSubtext,
}: {
  kind: "page" | "object" | "image";
  src: string;
  name?: string;
  /** Route path for page previews (e.g. "/team"). */
  route?: string;
  /** Cache bust key — pass the page's slug_id + updated_at, etc. */
  cacheKey?: string;
  width?: number;
  height?: number;
  /** Pre-captured, server-side thumbnail URL. Preferred over any live capture. */
  storedUrl?: string | null;
  /** Optional caption shown in the neutral placeholder tile. */
  placeholderLabel?: string;
  /** Optional smaller subtext under the label in the placeholder tile. */
  placeholderSubtext?: string;
}) {
  const small = { width, height };
  const signedStored = usePageThumbSrc(storedUrl);
  return (
    <div className="relative" style={{ width: small.width, height: small.height }}>
      <div className="w-full h-full rounded border overflow-hidden bg-muted/30">
        {kind === "image" ? (
          <ImagePreview src={src} name={name} w={small.width} h={small.height} />
        ) : signedStored ? (
          <img
            src={signedStored}
            alt={name ?? ""}
            className="w-full h-full object-cover object-top bg-muted"
            loading="lazy"
            decoding="async"
            width={small.width}
            height={small.height}
          />
        ) : (
          <GeneratingTile
            label={placeholderLabel ?? name ?? src}
            subtext={placeholderSubtext}
            kind={kind === "page" ? "page" : "object"}
          />
        )}
      </div>
    </div>
  );
}

function GeneratingTile({ kind, label, subtext }: { kind: "page" | "object"; label: string; subtext?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-muted-foreground p-1 text-center gap-1">
      <div className="uppercase tracking-wider text-[8px] opacity-60">
        {kind === "page" ? "Page" : "Object"}
      </div>
      <div className="truncate max-w-full font-medium text-foreground/70">{label}</div>
      <div className="text-[8px] opacity-60">{subtext ?? "Preview generating…"}</div>
    </div>
  );
}

function StaticTile({ kind, label }: { kind: "page" | "object"; label: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-muted-foreground p-1 text-center gap-1">
      <div className="uppercase tracking-wider text-[8px] opacity-60">
        {kind === "page" ? "Page" : "Object"}
      </div>
      <div className="truncate max-w-full font-medium text-foreground/80">{label}</div>
    </div>
  );
}

function PageSnapshot({ route, label, cacheKey }: { route: string; label: string; cacheKey: string }) {
  const [src, setSrc] = useState<string | null>(() => getCachedRouteSnapshot(cacheKey));
  const wrapRef = useRef<HTMLDivElement>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (src || requestedRef.current) return;
    const el = wrapRef.current;
    if (!el) return;
    let cancelled = false;
    const trigger = () => {
      if (requestedRef.current) return;
      requestedRef.current = true;
      requestRouteSnapshot(route, cacheKey).then((v) => { if (!cancelled && v) setSrc(v); });
    };
    if (typeof IntersectionObserver === "undefined") { trigger(); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { trigger(); io.disconnect(); break; }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [route, cacheKey, src]);

  if (src) return <img ref={(n) => { if (n) (wrapRef as any).current = n.parentElement; }}
    src={src} alt={label} className="w-full h-full object-cover object-top" loading="lazy" />;
  return <div ref={wrapRef} className="w-full h-full"><StaticTile kind="page" label={label} /></div>;
}

function ImagePreview({ src, name, w, h }: { src: string; name?: string; w: number; h: number }) {
  const [broken, setBroken] = useState(false);
  const kind = assetKind(name || src);
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center">
        <div className="truncate max-w-full">{name ?? "image"}</div>
      </div>
    );
  }
  if (kind === "video") {
    return <video src={src} className="w-full h-full object-cover bg-muted"
      muted playsInline preload="metadata" width={w} height={h} />;
  }
  if (broken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[9px] text-destructive bg-destructive/10 p-1 text-center gap-0.5">
        <span aria-hidden>⚠</span>
        <div className="font-medium">Broken asset</div>
      </div>
    );
  }
  return (
    <img src={src} alt={name ?? ""} className="w-full h-full object-cover bg-muted"
      loading="lazy" decoding="async" width={w} height={h}
      onError={() => setBroken(true)} />
  );
}
