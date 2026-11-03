import { Film, Play, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { parseExternalVideoUrl } from "./videoHelpers";
import { Input } from "@/components/ui/input";
import { ToolGroup, ToolSegment } from "./designChat/ToolPanel";
import MediaAlignment from "./MediaAlignment";

export type SavedVideo = { id?: string; url: string; poster?: string; caption?: string; title?: string };
export function videoThumbnail(video: SavedVideo): string | undefined {
  if (video.poster) return video.poster;
  const parsed = parseExternalVideoUrl(video.url);
  return parsed?.source === "youtube" && /^[\w-]+$/.test(parsed.videoId) ? parsed.posterUrl : undefined;
}
export function SavedVideoPreview({ video, compact = false }: { video: SavedVideo; compact?: boolean }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const thumbnail = [video.poster, videoThumbnail({ ...video, poster: undefined })].find(src => src && !failedSources.includes(src));
  return <div className="min-w-0 space-y-1">
    <div className={compact ? "relative w-20 aspect-video overflow-hidden rounded-lg bg-muted" : "relative w-full aspect-video overflow-hidden rounded-lg bg-muted"}>
      {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover" onError={() => setFailedSources(previous => [...previous, thumbnail])} /> : <Film className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />}
      <span className="absolute bottom-1 right-1 rounded-full bg-background/90 p-1 text-foreground"><Play className="h-3 w-3" aria-hidden /></span>
    </div>
    <p className="break-all text-xs text-muted-foreground">{video.title || video.caption || video.url}</p>
    <p className="text-[11px] text-muted-foreground">Placeholder in editor, plays on the live page</p>
  </div>;
}
export default function SavedVideoOptions({ video, onDelete, onReset, layout }: { video: SavedVideo; onDelete: () => void; onReset: () => void; layout?: { align?: string; width?: number; pixels?: boolean; onAlign: (align: "left" | "center" | "right") => void; onWidth: (width: number | undefined) => void } }) {
  return <div className="space-y-2" aria-label="Saved Video Options">
    <SavedVideoPreview key={video.url} video={video} />
    {layout && <ToolGroup title="Video Layout" defaultOpen>
      <MediaAlignment value={layout.align} onChange={layout.onAlign} />
      <div className="space-y-1">
        <p className="text-center text-[11px] text-muted-foreground">Width ({layout.pixels ? "px" : "%"})</p>
        <div className="flex min-w-0 gap-1">
          <Input type="number" aria-label="Video Width" min={1} max={layout.pixels ? undefined : 100} placeholder={layout.pixels ? "Full" : "100"} value={layout.width ?? ""} className="h-8 w-16 min-w-0 shrink-0 px-1 text-xs" onChange={e => { const n = Number(e.target.value); if (!e.target.value) layout.onWidth(undefined); else if (Number.isFinite(n) && n > 0 && (layout.pixels || n <= 100)) layout.onWidth(n); }} />
          <ToolSegment className="flex min-w-0 flex-1">
            {([ ["Small", layout.pixels ? 320 : 25], ["Medium", layout.pixels ? 640 : 50], ["Large", layout.pixels ? 960 : 75], ["Full", layout.pixels ? undefined : 100] ] as const).map(([label, width]) => <Button type="button" key={label} size="sm" className="min-w-0 flex-1 px-0.5 text-[10px]" variant={layout.width === width ? "default" : "ghost"} aria-pressed={layout.width === width} onClick={() => layout.onWidth(width)}>{label}</Button>)}
          </ToolSegment>
        </div>
      </div>
    </ToolGroup>}
    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" />Delete Video</Button>
    <Button variant="outline" size="sm" className="w-full justify-start gap-2 whitespace-normal text-left" onClick={onReset}><Undo2 className="h-4 w-4 shrink-0" />Undo All Changes to Video</Button>
  </div>;
}