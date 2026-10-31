import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, Minimize2, Monitor, Smartphone, Tablet, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { postToHelper } from "./helper";
import { useDesignChat, type Device } from "./DesignChatContext";

/**
 * The buttons in the Site Manager's top bar that belong to the design chat: while the Preview tab is open, the size buttons
 * and Full screen; always, a link to the published site. Submit for review stays in the top bar (SubmitButton).
 */
export default function PreviewTools({ showViewControls, tight = false, navOnly = false }: { showViewControls: boolean; tight?: boolean; navOnly?: boolean }) {
  const { state, device, setDevice, inFull, toggleFull, previewNav, editing } = useDesignChat();
  // Back/Forward live in the toolbar (never over the site); they are disabled while editing by hand.
  const nav = showViewControls && previewNav && !editing && (
    <div className="flex shrink-0 items-center gap-0.5" data-preview-nav>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={previewNav.back} disabled={!previewNav.canBack} aria-label="Back" title="Back"><ChevronLeft className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={previewNav.forward} disabled={!previewNav.canForward} aria-label="Forward" title="Forward"><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
  if (navOnly) return nav || null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {nav}
      {showViewControls && (
        <>
          {!tight && <ToggleGroup type="single" value={device} onValueChange={(v) => v && setDevice(v as Device)} variant="outline" size="sm"
            className="flex gap-0 [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button+button]:-ml-px" aria-label="Preview Size">
            <ToggleGroupItem value="mobile" aria-label="Mobile Preview" title="Mobile Preview"><Smartphone className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet Preview" title="Tablet Preview"><Tablet className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop Preview" title="Desktop Preview"><Monitor className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>}
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={toggleFull}
            aria-label={inFull ? "Exit Full Screen" : "Full Screen"} title={inFull ? "Exit Full Screen" : "Full Screen"}>
            {inFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </>
      )}
      {state?.liveUrl && !tight && (
        <Button asChild variant="outline" size="icon" className="h-9 w-9">
          <a href={state.liveUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Published Site" title="Open Published Site">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}

/** Submit for review (or Publish, when review is off): changes can be waiting whichever tab is open. */
export function SubmitButton({ compact = false }: { compact?: boolean }) {
  const { state, refreshSoon } = useDesignChat();
  const p = state?.publish ?? { ok: true, open: 0 };
  const reviewOn = state?.review?.enabled;
  const submitDisabled = !state || state.busy || p.open === 0 || (!p.ok && !p.willReview);
  const submit = async () => { await postToHelper("/publish"); refreshSoon(); };
  const label = reviewOn === false ? "Publish" : "Submit for Review";
  return (
    <Button type="button" variant="review" size="sm" className={compact ? "w-9 shrink-0 px-0" : "shrink-0"} aria-label={label} title={label} disabled={submitDisabled} onClick={submit}>
      <Send className="h-4 w-4" aria-hidden />
      {!compact && label}
    </Button>
  );
}
