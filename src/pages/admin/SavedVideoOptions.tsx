import { Film, Play, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { parseExternalVideoUrl } from "./videoHelpers";

export type SavedVideo = { id?: string; url: string; poster?: string; caption?: string; title?: string };
export function videoThumbnail(video: SavedVideo): string | undefined {
  if (video.poster) return video.poster;
  const parsed = parseExternalVideoUrl(video.url);
  return parsed?.source === "youtube" && /^[\w-]+$/.test(parsed.videoId) ? parsed.posterUrl : undefined;
}
export function SavedVideoPreview({ video, compact = false }: { video: SavedVideo; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const thumbnail = videoThumbnail(video);
  return <div className="min-w-0 space-y-1">
    <div className={compact ? "relative w-20 aspect-video overflow-hidden rounded-lg bg-muted" : "relative w-full aspect-video overflow-hidden rounded-lg bg-muted"}>
      {thumbnail && !failed ? <img src={thumbnail} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <Film className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />}
      <span className="absolute bottom-1 right-1 rounded-full bg-background/90 p-1 text-foreground"><Play className="h-3 w-3" aria-hidden /></span>
    </div>
    <p className="break-all text-xs text-muted-foreground">{video.title || video.caption || video.url}</p>
    <p className="text-[11px] text-muted-foreground">Placeholder in editor, plays on the live page</p>
  </div>;
}
export default function SavedVideoOptions({ video, onDelete, onReset }: { video: SavedVideo; onDelete: () => void; onReset: () => void }) {
  return <div className="space-y-2" aria-label="Saved Video Options">
    <SavedVideoPreview key={video.url} video={video} />
    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" />Delete Video</Button>
    <Button variant="outline" size="sm" className="w-full justify-start gap-2 whitespace-normal text-left" onClick={onReset}><Undo2 className="h-4 w-4 shrink-0" />Undo All Changes to Video</Button>
  </div>;
}