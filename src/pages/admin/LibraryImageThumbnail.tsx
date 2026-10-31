import { useState } from "react";
import { ImageIcon } from "lucide-react";

/** Failed sources advance without exposing broken-image alt text or changing the saved image. */
export default function LibraryImageThumbnail({ candidates, className = "", onSource }: { candidates: string[]; className?: string; onSource?: (url: string) => void }) {
  const [failed, setFailed] = useState(new Set<string>());
  const src = candidates.find(url => !failed.has(url));
  if (!src) return <span className={`grid place-items-center bg-muted ${className}`} aria-label="Image Preview Unavailable"><ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden /></span>;
  return <img key={src} src={src} alt="" loading="lazy" className={className} onLoad={() => onSource?.(src)} onError={() => setFailed(previous => new Set([...previous, src]))} />;
}