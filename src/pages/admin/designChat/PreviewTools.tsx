import { ExternalLink, Maximize2, Minimize2, Monitor, Pencil, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { postToHelper } from "./helper";
import { useDesignChat, type Device } from "./DesignChatContext";

/**
 * The buttons in the Site Manager's top bar that belong to the design chat: while the Preview tab is open, the size buttons
 * and Full screen; always, a link to the published site. Submit for review lives in the chat column's header (SubmitButton).
 */
export default function PreviewTools({ showViewControls, tight = false }: { showViewControls: boolean; tight?: boolean }) {
  const { state, device, setDevice, inFull, toggleFull, drawing, editing, preview } = useDesignChat();

  return (
    <div className="flex shrink-0 items-center gap-2">
      {showViewControls && (
        <>
          {!editing && (
            <Button type="button" variant={drawing.on ? "default" : "outline"} size="icon" className="h-9 w-9" onClick={drawing.toggle}
              disabled={!preview.loaded} aria-pressed={drawing.on}
              aria-label={drawing.on ? "Stop drawing" : "Draw on the preview"} title={drawing.on ? "Stop drawing and remove the marks" : "Draw on the preview to show what to change"}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {!tight && <ToggleGroup type="single" value={device} onValueChange={(v) => v && setDevice(v as Device)} variant="outline" size="sm"
            className="hidden lg:flex gap-0 [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button+button]:-ml-px" aria-label="Preview size">
            <ToggleGroupItem value="mobile" aria-label="Mobile preview" title="Mobile preview"><Smartphone className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet preview" title="Tablet preview"><Tablet className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop preview" title="Desktop preview"><Monitor className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>}
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={toggleFull}
            aria-label={inFull ? "Exit full screen" : "Full screen"} title={inFull ? "Exit full screen" : "Full screen"}>
            {inFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </>
      )}
      {state?.liveUrl && !tight && (
        <Button asChild variant="outline" size="icon" className="h-9 w-9">
          <a href={state.liveUrl} target="_blank" rel="noopener noreferrer" aria-label="Open published site" title="Open published site">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}

/** Submit for review (or Publish, when review is off): changes can be waiting whichever tab is open. */
export function SubmitButton() {
  const { state, refreshSoon } = useDesignChat();
  const p = state?.publish ?? { ok: true, open: 0 };
  const reviewOn = state?.review?.enabled;
  const submitDisabled = !state || state.busy || p.open === 0 || (!p.ok && !p.willReview);
  const submit = async () => { await postToHelper("/publish"); refreshSoon(); };
  return (
    <Button type="button" size="sm" disabled={submitDisabled} onClick={submit}>
      {reviewOn === false ? "Publish" : "Submit for review"}
    </Button>
  );
}
