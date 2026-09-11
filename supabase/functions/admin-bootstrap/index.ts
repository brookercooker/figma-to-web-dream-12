// Bootstraps admin roles.
// - If the signed-in user's email is listed in admin_emails, ensures they have
//   the 'admin' role in user_roles.
// - If admin_emails is completely empty AND user_roles has no admins,
//   promotes the caller to admin (first-user bootstrap).
// - Always ensures the caller has at least the 'user' role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "missing token" }, 401);
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return json({ error: "missing token" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(url, service);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user?.email) return json({ error: "invalid user" }, 401);

    const uid = userData.user.id;
    const email = userData.user.email;

    // Always ensure a base 'user' role.
    await admin.from("user_roles").upsert(
      { user_id: uid, role: "user" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // Is this email in admin_emails?
    const { data: match } = await admin
      .from("admin_emails")
      .select("email")
      .ilike("email", email)
      .maybeSingle();

    let bootstrapped = false;
    if (match) {
      await admin.from("user_roles").upsert(
        { user_id: uid, role: "admin" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
      bootstrapped = true;
    } else {
      // First-user bootstrap: if no admins anywhere, promote this user.
      const { count: adminCount } = await admin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      const { count: emailCount } = await admin
        .from("admin_emails")
        .select("*", { count: "exact", head: true });
      if ((adminCount ?? 0) === 0 && (emailCount ?? 0) === 0) {
        await admin.from("admin_emails").insert({ email }).select().maybeSingle();
        await admin.from("user_roles").upsert(
          { user_id: uid, role: "admin" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
        bootstrapped = true;
      }
    }

    return json({ ok: true, bootstrapped, email });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
