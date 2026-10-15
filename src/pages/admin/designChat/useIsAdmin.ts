import { useEffect, useState } from "react";
import { supabase } from "@/prototype/client";

/** Whether the signed-in person is an admin. Only used to show or hide buttons; the design service checks it again on every answer. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) return;
        const { data } = await (supabase as any).rpc("has_role", { _user_id: uid, _role: "admin" });
        if (alive) setIsAdmin(!!data);
      } catch { /* treated as not an admin */ }
    })();
    return () => { alive = false; };
  }, []);
  return isAdmin;
}
