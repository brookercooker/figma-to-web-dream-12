import { ReactNode, useEffect, useRef, useState } from "react";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import AdminAuth from "./AdminAuth";
import AdminIndex from "./AdminIndex";

type GateState = "checking" | "signed-out" | "denied" | "allowed";

/**
 * Site Manager gate: requires a signed-in staff member (is_site_user()).
 * Nothing admin-related renders or loads until the check passes.
 */
export default function AdminGate({ children }: { children?: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const runId = useRef(0);

  useEffect(() => {
    let mounted = true;

    const check = async (hasSession: boolean) => {
      const id = ++runId.current;
      if (!hasSession) { if (mounted) setState("signed-out"); return; }
      setState("checking");
      const isUser = async () => {
        const { data, error } = await supabase.rpc("is_site_user");
        return !error && data === true;
      };
      let ok = await isUser();
      if (!ok) {
        try { await supabase.functions.invoke("admin-bootstrap"); } catch { /* ignore */ }
        ok = await isUser();
      }
      if (mounted && id === runId.current) setState(ok ? "allowed" : "denied");
    };

    supabase.auth.getSession().then(({ data }: any) => check(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((evt: string, session: unknown) => {
      if (evt === "SIGNED_IN" || evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
        // Defer so we never await Supabase calls inside the auth callback.
        setTimeout(() => check(!!session), 0);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === "checking") return <div className="min-h-screen" aria-hidden="true" />;
  if (state === "signed-out") return <AdminAuth />;
  if (state === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Your account doesn't have access to the Site Manager. Ask an administrator.
        </p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  }
  return <>{children ?? <AdminIndex />}</>;
}
