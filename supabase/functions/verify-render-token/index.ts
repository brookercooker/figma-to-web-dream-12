// Public endpoint used by the client AdminGate to verify a screenshot render
// token without exposing the render_tokens table to anon/authenticated roles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || !/^[0-9a-f-]{36}$/i.test(token)) {
      return json({ valid: false }, 200);
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const { data } = await admin
      .from("render_tokens")
      .select("token")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return json({ valid: !!data?.token }, 200);
  } catch {
    return json({ valid: false }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
