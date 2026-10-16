import { Loader2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDesignChat, type Device } from "./DesignChatContext";
import DrawLayer from "./DrawLayer";

const WIDTH: Record<Device, string> = { mobile: "390px", tablet: "820px", desktop: "100%" };

/**
 * The draft preview of the design site: the picture that fills the Preview tab. The buttons that go with it (sizes, full
 * screen, submit) are in the top bar, see PreviewTools.tsx.
 */
export default function PreviewPanel() {
  const { preview, device, boxRef, inFull, coverFull, toggleFull, drawing } = useDesignChat();

  return (
    <section className="h-full min-h-0" aria-label="Preview">
      <div ref={boxRef} className={cn("relative h-full min-h-0 bg-muted flex justify-center", coverFull && "fixed inset-0 z-50 bg-background")}>


        <div ref={drawing.areaRef} className={cn("relative h-full max-w-full overflow-hidden bg-white")}
          style={{ width: WIDTH[device] }}>
          {preview.frames.map((f) => (
            <iframe
              key={f.id}
              src={f.url}
              title={f.id === preview.shownId || preview.shownId === 0 ? "Design preview" : "Design preview (loading)"}
              referrerPolicy="origin"
              data-preview-shown={f.id === preview.shownId || preview.shownId === 0 ? "true" : "false"}
              onLoad={() => preview.finish(f.id)}
              className={cn("absolute inset-0 h-full w-full border-0 bg-white", f.id !== preview.shownId && preview.shownId !== 0 && "invisible")}
            />
          ))}
          {drawing.on && preview.loaded && <DrawLayer />}
        </div>

        {!preview.loaded && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-background p-6 text-center text-sm text-muted-foreground">
            {preview.error ?? "Starting the preview…"}
          </div>
        )}

        {preview.updating && preview.loaded && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-background/50" role="status" aria-live="polite">
            <div className="flex max-w-[min(92%,420px)] items-center gap-3 rounded-xl border bg-background px-4 py-3.5 shadow-lg">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold">Loading your updated preview…</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Your change is built. The preview takes a moment to catch up.</div>
              </div>
            </div>
          </div>
        )}

        {coverFull && (
          <Button type="button" size="sm" className="absolute right-4 top-4 z-30 gap-2 bg-foreground/80" onClick={toggleFull}>
            <Minimize2 className="h-4 w-4" /> Exit full screen
          </Button>
        )}
      </div>
    </section>
  );
}
