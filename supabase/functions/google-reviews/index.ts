// Google Places (New) reviews aggregator for Nova Lighting Utah locations.
// Resolves each location's place_id once per cold-start, then fetches reviews
// via Place Details (v1). Returns the 15 most recent 5-star positive reviews
// across all locations.
//
// To keep Places API spend low, the cache refreshes once per week
// (every Monday, UTC). Between refresh dates, cached results are returned.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const LOCATIONS: { name: string; query: string }[] = [
  { name: "Orem", query: "Nova Lighting 922 N 1430 W Orem UT 84057" },
  { name: "Sandy", query: "Nova Lighting 8699 S Sandy Parkway Sandy UT 84070" },
  { name: "Heber City", query: "Nova Lighting 162 S Main St Heber City UT 84032" },
  { name: "Midvale", query: "Nova Lighting 7515 S State St Midvale UT 84047" },
  { name: "Layton", query: "Nova Lighting 1565 W Hill Field Rd Layton UT 84041" },
  { name: "St. George", query: "Nova Lighting 3284 Deseret Dr Unit 17 St. George UT 84790" },
];

// Words/phrases that suggest a review is NOT purely positive. If any appear
// (case-insensitive, word-boundary matched), the review is filtered out even
// if it's 5 stars.
const NEGATIVE_SIGNALS = [
  "bad", "poor", "worst", "terrible", "horrible", "awful", "rude", "slow",
  "disappoint", "disappointed", "disappointing", "complain", "complaint",
  "issue", "issues", "problem", "problems", "wrong", "broken", "damaged",
  "refund", "return", "wait", "waited", "waiting", "delay", "delayed",
  "unhelpful", "unprofessional", "overpriced", "expensive", "cheap",
  "never again", "wouldn't recommend", "would not recommend",
  "not happy", "unhappy", "frustrat", "mistake", "mislead", "scam",
  "avoid", "regret", "hate", "dislike", "ignored", "ignore",
];

function isPositive(text: string): boolean {
  if (!text || !text.trim()) return false; // require actual written feedback
  const lower = text.toLowerCase();
  return !NEGATIVE_SIGNALS.some((w) => {
    const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    return re.test(lower);
  });
}

interface ReviewOut {
  author: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
  location: string;
}

interface Aggregate {
  rating: number;      // weighted average across all locations
  count: number;       // total number of Google ratings
  locations: number;   // locations included in the average
}

interface CachePayload {
  reviews: ReviewOut[];
  aggregate: Aggregate | null;
  fetchedAt: string;
}

// Returns the most recent weekly refresh boundary (Monday 00:00 UTC) at/before `now`.
function lastRefreshBoundary(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // getUTCDay(): Sun=0, Mon=1, ... Sat=6. Days since last Monday:
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

let cache: { boundary: number; payload: CachePayload } | null = null;
const placeIdCache = new Map<string, string>();

async function resolvePlaceId(query: string): Promise<string | null> {
  if (placeIdCache.has(query)) return placeIdCache.get(query)!;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  if (!res.ok) {
    console.error("searchText failed", query, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const id = data?.places?.[0]?.id ?? null;
  if (id) placeIdCache.set(query, id);
  return id;
}

async function fetchRatingFor(
  placeId: string,
): Promise<{ rating: number; count: number } | null> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": API_KEY!,
        "X-Goog-FieldMask": "rating,userRatingCount",
      },
    },
  );
  if (!res.ok) {
    console.error("place rating failed", placeId, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const rating = Number(data?.rating ?? 0);
  const count = Number(data?.userRatingCount ?? 0);
  if (!rating || !count) return null;
  return { rating, count };
}

async function fetchReviewsFor(placeId: string, locationName: string): Promise<ReviewOut[]> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": API_KEY!,
        "X-Goog-FieldMask": "reviews",
      },
    },
  );
  if (!res.ok) {
    console.error("place details failed", placeId, res.status, await res.text());
    return [];
  }
  const data = await res.json();
  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  return reviews.map((r: Record<string, unknown>): ReviewOut => {
    const author = r.authorAttribution as Record<string, string> | undefined;
    const text = (r.text as { text?: string } | undefined)?.text ?? "";
    return {
      author: author?.displayName ?? "Anonymous",
      authorPhoto: author?.photoUri ?? null,
      rating: Number(r.rating ?? 0),
      text,
      relativeTime: String(r.relativePublishTimeDescription ?? ""),
      publishTime: String(r.publishTime ?? ""),
      location: locationName,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_PLACES_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const boundary = lastRefreshBoundary(new Date()).getTime();

    if (cache && cache.boundary === boundary) {
      return new Response(JSON.stringify({ ...cache.payload, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const all: ReviewOut[] = [];
    let ratingSum = 0;
    let ratingCount = 0;
    let ratedLocations = 0;
    for (const loc of LOCATIONS) {
      const placeId = await resolvePlaceId(loc.query);
      if (!placeId) continue;
      const reviews = await fetchReviewsFor(placeId, loc.name);
      all.push(...reviews);
      const agg = await fetchRatingFor(placeId);
      if (agg) {
        ratingSum += agg.rating * agg.count;
        ratingCount += agg.count;
        ratedLocations += 1;
      }
    }

    const aggregate: Aggregate | null = ratingCount > 0
      ? {
          rating: Math.round((ratingSum / ratingCount) * 10) / 10,
          count: ratingCount,
          locations: ratedLocations,
        }
      : null;

    const filtered = all
      .filter((r) => r.rating === 5 && isPositive(r.text))
      .sort((a, b) => (a.publishTime < b.publishTime ? 1 : -1));

    const payload: CachePayload = {
      reviews: filtered.slice(0, 15),
      aggregate,
      fetchedAt: new Date().toISOString(),
    };
    cache = { boundary, payload };

    return new Response(JSON.stringify({ ...payload, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-reviews error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
