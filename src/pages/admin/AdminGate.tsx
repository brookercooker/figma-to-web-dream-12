import { ReactNode, useEffect, useRef, useState } from "react";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import AdminAuth from "./AdminAuth";
import AdminIndex from "./AdminIndex";
import { REQUIRE_LOGIN } from "@/lib/authGate";

type GateState = "checking" | "signed-out" | "denied" | "allowed";

/**
 * Site Manager gate: requires a signed-in staff member (is_site_user()).
 * Nothing admin-related renders or loads until the check passes.
 */
export default function AdminGate({ children }: { children?: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const runId = useRef(0);
  const [hasUser, setHasUser] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async (hasSession: boolean) => {
      const id = ++runId.current;
      if (mounted) setHasUser(hasSession);
      if (!REQUIRE_LOGIN) { if (mounted) { setState("allowed"); if (hasSession) setShowLogin(false); } return; }
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

  if (!REQUIRE_LOGIN && showLogin) return <AdminAuth />;
  if (REQUIRE_LOGIN && state === "checking") return <div className="min-h-screen" aria-hidden="true" />;
  if (state === "signed-out") return <AdminAuth />;
  if (state === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Your account doesn't have access to the Site Manager. Ask an administrator.
        </p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign Out</Button>
      </div>
    );
  }
  return <>{children ?? <AdminIndex />}{!REQUIRE_LOGIN && hasUser === false && <aside role="status" className="fixed bottom-2 left-2 right-2 z-50 mx-auto flex max-w-xl items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm"><span>Login is turned off for review. Saving and sending requests need a sign-in. Sign in to load or save this.</span><Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setShowLogin(true)}>Sign In</Button></aside>}</>;
}
