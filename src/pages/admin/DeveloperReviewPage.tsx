import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { RELAY, RELAY_IS_HOSTED, relayHeaders } from "./designChat/helper";

export default function DeveloperReviewPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
        { type: "nova-dev-token", token, page: window.location.origin + "/manage/preview" },
        relayOrigin,
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isAdmin]);

  if (isAdmin === null) return <div className="min-h-screen" />;
  if (!isAdmin) return <Navigate to="/manage/pages" replace />;

  return (
    <div className="h-screen flex flex-col">
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="w-full px-6 py-3 flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link to="/manage/pages"><ArrowLeft className="w-4 h-4" /> Site Manager</Link>
          </Button>
          <h1 className="text-base font-medium tracking-tight">Developer review</h1>
        </div>
      </header>
      {RELAY_IS_HOSTED ? (
        <iframe
          ref={iframeRef}
          title="Developer review"
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
