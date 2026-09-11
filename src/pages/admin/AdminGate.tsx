import { ReactNode, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminAuth from "./AdminAuth";
import AdminIndex from "./AdminIndex";

/** Gate wrapper: shows the sign-in / sign-up form when there is no session. */
export default function AdminGate({ children }: { children?: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "in" | "out" | "bypass">("loading");
  // Track which user ids we've already bootstrapped this session so repeated
  // onAuthStateChange fires (INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED)
  // don't re-invoke the edge function on every event.
  const bootstrapped = useRef<Set<string>>(new Set());
  const inflight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let mounted = true;

    // Screenshot render-token bypass: if the URL carries a valid, unexpired
    // token in `render_tokens`, skip the sign-in gate entirely so ScreenshotOne
    // can capture the real page (not the login form).
    const params = new URLSearchParams(window.location.search);
    const token = params.get("render_token");
    if (token) {
      (async () => {
        const { data } = await supabase.functions.invoke("verify-render-token", {
          body: { token },
        });
        if (mounted) setStatus((data as any)?.valid ? "bypass" : "out");
      })();
      return () => { mounted = false; };
    }



    const validateSession = async (session: any) => {
      if (!session?.user?.id) {
        if (mounted) setStatus("out");
        return;
      }

      const uid = session.user.id;
      if (bootstrapped.current.has(uid)) {
        if (mounted) setStatus("in");
        return;
      }

      // Dedupe concurrent calls
      if (inflight.current) {
        await inflight.current;
        if (mounted && bootstrapped.current.has(uid)) setStatus("in");
        return;
      }

      inflight.current = (async () => {
        const { error: bootstrapError } = await supabase.functions.invoke("admin-bootstrap");
        if (bootstrapError && /401|invalid user|unauthorized/i.test(bootstrapError.message)) {
          await supabase.auth.signOut();
          if (mounted) setStatus("out");
          return;
        }
        bootstrapped.current.add(uid);
        if (mounted) setStatus("in");
      })();

      try { await inflight.current; } finally { inflight.current = null; }
    };

    supabase.auth.getSession().then(({ data }) => validateSession(data.session)).catch(async () => {
      await supabase.auth.signOut();
      if (mounted) setStatus("out");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evt, session) => {
      // Only re-validate on meaningful changes; ignore token refreshes to
      // avoid a bootstrap→refresh→bootstrap loop.
      if (evt === "SIGNED_OUT") {
        bootstrapped.current.clear();
        if (mounted) setStatus("out");
        return;
      }
      if (evt === "SIGNED_IN" || evt === "INITIAL_SESSION") {
        validateSession(session);
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen" aria-hidden="true" />;
  }
  if (status === "out") return <AdminAuth />;
  // "in" (authenticated admin) and "bypass" (valid render token) both render.
  return <>{children ?? <AdminIndex />}</>;
}
