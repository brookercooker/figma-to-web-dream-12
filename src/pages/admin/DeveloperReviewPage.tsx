import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { RELAY, RELAY_IS_HOSTED, relayHeaders } from "./designChat/helper";
import { useHelperState } from "./designChat/useHelperState";
import { REQUIRE_LOGIN } from "@/lib/authGate";

function ReviewErrorDetails() {
  const { state } = useHelperState(() => 4000);
  const review = state?.draft?.review;
  if (review?.state !== "error") return null;
  return (
    <div role="region" aria-label="Review Error Details" className="border-b px-6 py-4 space-y-2 text-sm">
      <p className="font-medium whitespace-pre-wrap break-words">{review.headline || "No reason was reported by the design service."}</p>
      {review.summary && <p className="whitespace-pre-wrap break-words">{review.summary}</p>}
      <p className="text-xs text-muted-foreground">{review.retry === true ? "Staff can retry this themselves" : "Needs a Developer"}</p>
    </div>
  );
}

export default function DeveloperReviewPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const draftSiteUrl = window.location.origin + "/manage/preview";

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }: any) => {
      if (error || !data.user) { setIsAdmin(false); return; }
      const { data: roleData } = await (supabase as any).rpc("has_role", {
        _user_id: data.user.id, _role: "admin",
      });
      setIsAdmin(!!roleData);
    });
  }, []);

  useEffect(() => {
    if (!RELAY_IS_HOSTED) return;
    let relayOrigin: string;
    try { relayOrigin = new URL(RELAY).origin; } catch { return; }
    const onMessage = async (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (e.origin !== relayOrigin) return;
      if (e.data?.type !== "nova-dev-need-token") return;
      const headers = await relayHeaders();
      const key = Object.keys(headers).find((k) => k.toLowerCase() === "authorization");
      const token = key ? headers[key].replace(/^Bearer /, "") : "";
      if (!token) return;
      iframeRef.current?.contentWindow?.postMessage(
        { type: "nova-dev-token", token, page: draftSiteUrl },
        relayOrigin,
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isAdmin, draftSiteUrl]);

  if (isAdmin === null) return <div className="min-h-screen" />;
  if (REQUIRE_LOGIN && !isAdmin) return <Navigate to="/manage/pages" replace />;

  return (
    <div className="h-screen flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="w-full px-3 min-[480px]:px-6 py-3 flex items-center gap-2 min-[480px]:gap-4">
          <Button asChild variant="ghost" size="sm" className="gap-2 shrink-0">
            <Link to="/manage/pages"><ArrowLeft className="w-4 h-4" /> Site Manager</Link>
          </Button>
          <h1 className="text-base font-medium tracking-tight">Developer Review</h1>
          {isAdmin && RELAY_IS_HOSTED && (
            <Button asChild variant="outline" size="sm" className="ml-auto shrink-0 gap-2 px-2 min-[480px]:px-3">
              <a href={draftSiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Draft Site">
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span className="hidden min-[480px]:inline">Open Draft Site</span>
              </a>
            </Button>
          )}
        </div>
      </header>
      {isAdmin && <ReviewErrorDetails />}
      {!isAdmin ? <div className="p-6 text-sm text-muted-foreground">Sign in to load or save this. Developer review requires an authorized account.</div> : RELAY_IS_HOSTED ? (
        <iframe
          ref={iframeRef}
          title="Developer Review"
          referrerPolicy="no-referrer"
          src={`${RELAY}/dev`}
          className="flex-1 w-full border-0"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          The developer review needs the hosted design service.
        </div>
      )}
    </div>
  );
}
