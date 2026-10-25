import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDesignChat, type Device } from "./DesignChatContext";
import PreviewProgress from "./PreviewProgress";
import DrawLayer from "./DrawLayer";

const WIDTH: Record<Device, string> = { mobile: "390px", tablet: "820px", desktop: "100%" };

/**
 * The draft preview of the design site: the picture that fills the Preview tab. The buttons that go with it (sizes, full
 * screen, submit) are in the top bar, see PreviewTools.tsx.
 */
export default function PreviewPanel() {
  const { preview, device, boxRef, inFull, coverFull, toggleFull, drawing, editing, previewNav } = useDesignChat();
  const location = useLocation();
  const pending = !editing && !!preview.progressStage;
  const visible = location.pathname.split("/")[2] === "preview" && !editing;

  useEffect(() => {
    drawing.setAvailable(visible && !pending);
    return () => drawing.setAvailable(false);
  }, [drawing.setAvailable, visible, pending]);

  return (
    <section className="h-full min-h-0" aria-label="Preview">
      <div ref={boxRef} className={cn("relative h-full min-h-0 bg-muted flex justify-center", coverFull && "fixed inset-0 z-50 bg-background")}>


        <div ref={drawing.areaRef} className={cn("relative h-full max-w-full overflow-hidden bg-background")}
          style={{ width: WIDTH[device] }}>
          {preview.frames.map((f) => (
            <iframe
              key={f.id}
              src={f.url}
              title={f.id === preview.shownId || preview.shownId === 0 ? "Design Preview" : "Design Preview (Loading)"}
              referrerPolicy="origin"
              data-preview-shown={f.id === preview.shownId || preview.shownId === 0 ? "true" : "false"}
              onLoad={() => preview.finish(f.id)}
              className={cn("absolute inset-0 h-full w-full border-0 bg-background transition-opacity duration-300 motion-reduce:transition-none", pending && "opacity-[0.58]", f.id !== preview.shownId && preview.shownId !== 0 && "invisible")}
            />
          ))}
          {visible && !pending && previewNav && !drawing.on && !drawing.capturing && (
            <div className="pointer-events-none absolute left-2 top-2 z-20 flex gap-1">
              <Button type="button" variant="outline" size="icon"
                className="pointer-events-auto h-8 w-8 rounded-md bg-background/85 shadow-sm backdrop-blur-sm hover:bg-background"
                onClick={previewNav.back} disabled={!previewNav.canBack} aria-label="Back" title="Back">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon"
                className="pointer-events-auto h-8 w-8 rounded-md bg-background/85 shadow-sm backdrop-blur-sm hover:bg-background"
                onClick={previewNav.forward} disabled={!previewNav.canForward} aria-label="Forward" title="Forward">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!pending && drawing.on && preview.loaded && <DrawLayer />}
        </div>

        {!preview.loaded && !preview.error && (
          <div aria-label="Preview Loading" className="pointer-events-none absolute inset-0 bg-background p-6">
            <div className="mx-auto max-w-3xl space-y-6 opacity-[0.58]">
              <div className="h-12 border bg-muted/40" /><div className="h-64 border bg-muted/40" />
              <div className="h-5 w-3/4 bg-muted" /><div className="h-5 bg-muted" /><div className="h-5 w-1/2 bg-muted" />
            </div>
          </div>
        )}
        {!preview.loaded && preview.error && <div role="alert" className="absolute inset-0 grid place-items-center bg-background p-6 text-center text-sm text-muted-foreground">{preview.error}</div>}
        {pending && preview.progressStage && <PreviewProgress stage={preview.progressStage} elapsedMs={preview.elapsedMs} />}

        {inFull && !drawing.capturing && (
          <Button type="button" size="sm" aria-label="Exit Full Screen" title="Exit Full Screen" className="absolute right-4 top-4 z-40 gap-2 bg-foreground/80 text-background shadow-sm hover:bg-foreground/90" onClick={toggleFull}>
            <Minimize2 className="h-4 w-4" /> Minimize
          </Button>
        )}
      </div>
    </section>
  );
}
