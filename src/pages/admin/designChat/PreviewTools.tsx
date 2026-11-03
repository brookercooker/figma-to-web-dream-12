import { Monitor, Smartphone, Tablet, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { postToHelper } from "./helper";
import { useDesignChat, type Device } from "./DesignChatContext";
import WaitProgress from "./WaitProgress";

/**
 * The buttons in the Site Manager's top bar that belong to the design chat: while the Preview tab is open, the size buttons
 * and Full screen; always, a link to the published site. Submit for review stays in the top bar (SubmitButton).
 */
export default function PreviewTools({ showViewControls, tight = false }: { showViewControls: boolean; tight?: boolean }) {
  const { device, setDevice } = useDesignChat();

  return (
    <div className="flex shrink-0 items-center gap-2">
      {showViewControls && (
        <>
          {!tight && <ToggleGroup type="single" value={device} onValueChange={(v) => v && setDevice(v as Device)} variant="outline" size="sm"
            className="flex gap-0 [&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button+button]:-ml-px" aria-label="Preview Size">
            <ToggleGroupItem value="mobile" aria-label="Mobile Preview" title="Mobile Preview"><Smartphone className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet Preview" title="Tablet Preview"><Tablet className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop Preview" title="Desktop Preview"><Monitor className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>}
        </>
      )}
    </div>
  );
}

/** Submit for review (or Publish, when review is off): changes can be waiting whichever tab is open. */
export function SubmitButton({ compact = false, showProgress = true }: { compact?: boolean; showProgress?: boolean }) {
  const { state, refreshSoon, waitProgress } = useDesignChat();
  const p = state?.publish ?? { ok: true, open: 0 };
  const reviewOn = state?.review?.enabled;
  const submitDisabled = !state || state.busy || p.open === 0 || (!p.ok && !p.willReview);
  const submit = async () => { await postToHelper("/publish"); refreshSoon(); };
  const label = reviewOn === false ? "Publish" : "Submit for Review";
  return (
    <div className="shrink-0"><Button type="button" variant="review" size="sm" className={compact ? "w-9 shrink-0 px-0" : "shrink-0"} aria-label={label} title={label} disabled={submitDisabled} onClick={submit}>
      <Send className="h-4 w-4" aria-hidden />
      {!compact && label}
    </Button>{showProgress && <WaitProgress progress={waitProgress?.submit} className="mt-2 w-full max-w-64" />}</div>
  );
}
