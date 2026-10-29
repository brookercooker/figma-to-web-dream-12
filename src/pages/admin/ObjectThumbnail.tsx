import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SignedThumbImg } from "./signedThumb";
import { requestObjectThumbnail } from "./objectThumbnailCapture";

/** Saved previews are preferred; missing captures queue once when visible, including Draft and designed objects. */
export default function ObjectThumbnail({ id, storedThumb }: { id: string; storedThumb?: string | null }) {
  const cell = useRef<HTMLDivElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const qc = useQueryClient();
  useEffect(() => {
    if (storedThumb) return;
    let stale = false;
    const generate = () => void requestObjectThumbnail(id).then(url => {
      if (stale || !url) return;
      setCaptured(url); void qc.invalidateQueries({ queryKey: ["admin", "object_registry"] });
    });
    const node = cell.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") { generate(); return () => { stale = true; }; }
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { observer.disconnect(); generate(); } }, { rootMargin: "80px" });
    observer.observe(node);
    return () => { stale = true; observer.disconnect(); };
  }, [id, storedThumb, qc]);
  return <div ref={cell} className="h-full w-full overflow-hidden rounded-lg bg-muted" aria-hidden>
    <SignedThumbImg url={storedThumb || captured} alt="" loading="lazy" className="h-full w-full object-cover object-top" fallback={<div className="h-full w-full bg-muted" />} />
  </div>;
}