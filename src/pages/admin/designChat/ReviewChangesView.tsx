import { useEffect, useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDesignChat } from "./DesignChatContext";
import { SubmitButton } from "./PreviewTools";
import ReviewProblems from "./ReviewProblems";
import type { DraftRequest } from "./helper";
import { atMs, CHANGE_LABEL, changeKind, changeTitle, newestFirst, relativeTime, waitingLine } from "./reviewChanges";

/** Changes waiting for review, from the relay's draft.requests only (never the chat history). Replaces the chat in the left column. */
export default function ReviewChangesView({ onShowPreview }: { onShowPreview: () => void }) {
  const { state, setReviewOpen, showPreviewPath } = useDesignChat();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const requests = state?.draft?.requests;
  const count = state?.publish?.open ?? requests?.length ?? 0;
  const view = (r: DraftRequest) => { onShowPreview(); if (r.page?.path) showPreviewPath(r.page.path); };
  return (
    <section aria-label="Changes Waiting for Review" className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => setReviewOpen(false)}>
          <ArrowLeft className="h-3 w-3" aria-hidden />Back to Chat
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 text-sm">
        <h2 className="font-sans text-base font-semibold">Changes Waiting for Review</h2>
        <p className="text-muted-foreground">{waitingLine(count)}</p>
        {!requests && count > 0 && <p className="text-xs text-muted-foreground">Individual change details aren't available from the design service yet.</p>}
        <SubmitButton />
        <ReviewProblems />
        {requests && requests.length > 0 && (
          <TooltipProvider delayDuration={200}>
            <ul className="space-y-2" aria-label="Changes">
              {newestFirst(requests).map((r) => <ChangeCard key={r.id} r={r} now={now} onView={() => view(r)} />)}
            </ul>
          </TooltipProvider>
        )}
      </div>
    </section>
  );
}

function ChangeCard({ r, now, onView }: { r: DraftRequest; now: number; onView: () => void }) {
  const [more, setMore] = useState(false);
  const { title, body } = changeTitle(r);
  const ms = atMs(r.at);
  const long = body.length > 160 || body.split("\n").length > 3;
  return (
    <li data-change-id={r.id} className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-normal">{CHANGE_LABEL[changeKind(r)]}</Badge>
        {Number.isFinite(ms) && (
          <Tooltip><TooltipTrigger asChild>
            <time tabIndex={0} dateTime={new Date(ms).toISOString()} className="text-xs text-muted-foreground">{relativeTime(ms, now)}</time>
          </TooltipTrigger><TooltipContent>{new Date(ms).toLocaleString()}</TooltipContent></Tooltip>
        )}
      </div>
      {title && <h3 className="font-sans text-sm font-semibold">{title}</h3>}
      <p className={`whitespace-pre-wrap break-words ${more ? "" : "line-clamp-3"}`}>{body}</p>
      {long && <button type="button" className="text-xs underline underline-offset-2" aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Show Less" : "Show More"}</button>}
      {r.page && <p className="truncate text-xs text-muted-foreground" title={`${r.page.name} ${r.page.path}`}>Page: {r.page.name} <span className="font-mono">{r.page.path}</span></p>}
      <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onView}>
        <Eye className="h-3.5 w-3.5" aria-hidden />{r.page ? "View Page on Preview" : "Open Draft Preview"}
      </Button>
    </li>
  );
}
