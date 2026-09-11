// One-off maintenance: copy private JPEG originals into the public images-web
// bucket so every image row has a permanent (token-free) fallback URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: rows, error } = await admin
    .from("images")
    .select("id, original_path, web_path")
    .is("fallback_path", null)
    .not("original_path", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ id: string; ok: boolean; message?: string }> = [];

  for (const row of rows ?? []) {
    const src = row.original_path as string;
    const ext = (src.split(".").pop() ?? "jpg").toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(ext)) {
      results.push({ id: row.id, ok: false, message: `unsupported original .${ext}` });
      continue;
    }
    const dest = src; // same key inside images-web

    const dl = await admin.storage.from("images-original").download(src);
    if (dl.error || !dl.data) {
      results.push({ id: row.id, ok: false, message: dl.error?.message ?? "download failed" });
      continue;
    }
    const bytes = new Uint8Array(await dl.data.arrayBuffer());
    const contentType = ext === "png" ? "image/png" : "image/jpeg";

    const up = await admin.storage
      .from("images-web")
      .upload(dest, bytes, { contentType, upsert: true });
    if (up.error) {
      results.push({ id: row.id, ok: false, message: up.error.message });
      continue;
    }

    const publicUrl = `${url}/storage/v1/object/public/images-web/${dest
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;

    const upd = await admin
      .from("images")
      .update({ fallback_path: dest, fallback_url: publicUrl, fallback_bytes: bytes.byteLength })
      .eq("id", row.id);

    results.push({ id: row.id, ok: !upd.error, message: upd.error?.message });
  }

  return new Response(
    JSON.stringify({ scanned: rows?.length ?? 0, fixed: results.filter((r) => r.ok).length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
