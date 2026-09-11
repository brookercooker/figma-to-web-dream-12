// Reverse-geocode lat/lng into a compact human-readable place name using
// Google's Geocoding API (same key as GOOGLE_PLACES_API_KEY).
// Returns { place_name, details } on success. Degrades to 200 with
// { place_name: null } on any provider failure so the caller can still store
// the raw GPS.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

type LatLng = { lat: number; lng: number };

function pickComponent(components: any[], type: string): string | undefined {
  const c = components.find((x) => Array.isArray(x.types) && x.types.includes(type));
  return c?.long_name;
}

function buildPlaceName(components: any[]): string | null {
  if (!Array.isArray(components) || components.length === 0) return null;
  const city =
    pickComponent(components, "locality") ||
    pickComponent(components, "postal_town") ||
    pickComponent(components, "sublocality") ||
    pickComponent(components, "administrative_area_level_2");
  const region =
    pickComponent(components, "administrative_area_level_1") ||
    pickComponent(components, "administrative_area_level_2");
  const country = pickComponent(components, "country");
  const parts = [city, region, country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  return parts.length ? parts.join(" · ") : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Partial<LatLng>;
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return new Response(JSON.stringify({ error: "invalid lat/lng" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!GOOGLE_KEY) {
      return new Response(JSON.stringify({ place_name: null, details: null, error: "no_key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}&result_type=locality|postal_town|administrative_area_level_1|country`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      // Fallback to no filter: try without result_type restriction
      const res2 = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`,
      );
      const data2 = await res2.json();
      if (data2.status !== "OK" || !Array.isArray(data2.results) || data2.results.length === 0) {
        return new Response(
          JSON.stringify({ place_name: null, details: null, provider_status: data.status }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const first = data2.results[0];
      return new Response(
        JSON.stringify({
          place_name: buildPlaceName(first.address_components) ?? first.formatted_address ?? null,
          details: { formatted_address: first.formatted_address, components: first.address_components },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // Merge components across returned results to pick best city/region/country
    const merged: any[] = [];
    for (const r of data.results) {
      for (const c of r.address_components ?? []) {
        if (!merged.some((m) => m.long_name === c.long_name && (m.types?.[0] === c.types?.[0]))) {
          merged.push(c);
        }
      }
    }
    const place_name = buildPlaceName(merged) ?? data.results[0].formatted_address ?? null;
    return new Response(
      JSON.stringify({
        place_name,
        details: {
          formatted_address: data.results[0].formatted_address,
          components: merged,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ place_name: null, details: null, error: e instanceof Error ? e.message : "error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
