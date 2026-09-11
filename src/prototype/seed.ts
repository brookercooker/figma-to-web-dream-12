/**
 * PROTOTYPE MODE — demo dataset.
 *
 * Hand-authored, plausible Nova Lighting content so every Site Manager screen
 * has something realistic to show. Nothing here touches a network or database;
 * edits made in the UI live in memory until the page is refreshed.
 */

import { db, uid } from "./engine";
import { objectRegistry } from "@/components/objects/registry";

/* ---------------- images: reuse the bundled site artwork -------------- */

type AssetMeta = { url: string; original_filename: string; size?: number };

const assetJson = import.meta.glob<{ default: AssetMeta }>("../assets/**/*.asset.json", {
  eager: true,
});
const rawImages = import.meta.glob<string>("../assets/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

interface SeedImage { filename: string; url: string; bytes: number }

const seedImages: SeedImage[] = [
  ...Object.values(assetJson).map((m) => {
    const meta = (m as any).default ?? m;
    return {
      filename: String(meta.original_filename ?? "image.jpg"),
      url: String(meta.url ?? ""),
      bytes: Number(meta.size ?? 240_000),
    };
  }),
  ...Object.entries(rawImages).map(([path, url]) => ({
    filename: path.split("/").pop() ?? "image.jpg",
    url: String(url),
    bytes: 180_000,
  })),
].filter((i) => i.url);

const IMAGE_LABELS = [
  ["Editorial"], ["Showroom"], ["Products"], ["Team"], ["Events"],
  ["Editorial", "Homepage"], ["Products", "Outdoor"], [],
];

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

/* ---------------- pages ---------------- */

interface SeedPage {
  name: string; path: string; page_type: string; build_status: string;
  status: string; tags: string[]; description?: string;
}

const seedPages: SeedPage[] = [
  { name: "Homepage", path: "/", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Core"], description: "Primary landing experience." },
  { name: "About", path: "/about", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Core"] },
  { name: "Locations", path: "/locations", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Core"] },
  { name: "Team", path: "/team", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Core"] },
  { name: "Contact", path: "/contact", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Core"] },
  { name: "Trade Account", path: "/contact-us-trade-account", page_type: "Static page", build_status: "draft", status: "Live", tags: ["Trade"] },
  { name: "New and Now", path: "/new-and-now", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Editorial"] },
  { name: "Outdoor Oasis", path: "/outdoor-oasis", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Editorial", "Seasonal"] },
  { name: "Inspiration Gallery", path: "/inspiration-gallery", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Editorial"] },
  { name: "Lighting Tips", path: "/lighting-tips", page_type: "Static page", build_status: "draft", status: "Live", tags: ["Editorial"] },
  { name: "Full Vendor List", path: "/full-vendor-list", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Brands"] },
  { name: "Shipping Policy", path: "/shipping-policy", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Policy"] },
  { name: "Return Policy", path: "/return-policy", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Policy"] },
  { name: "Privacy Policy", path: "/privacy-policy", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Policy"] },
  { name: "Terms & Conditions", path: "/terms-conditions", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Policy"] },
  { name: "Ceiling Lighting", path: "/ceiling", page_type: "Supernova CC", build_status: "draft", status: "Live", tags: ["Category"] },
  { name: "Wall Sconces", path: "/wall", page_type: "Supernova CC", build_status: "draft", status: "Live", tags: ["Category"] },
  { name: "Outdoor Lighting", path: "/outdoor", page_type: "Supernova CC", build_status: "draft", status: "Live", tags: ["Category"] },
  { name: "Ceiling Fans", path: "/fans", page_type: "Supernova CC", build_status: "draft", status: "Live", tags: ["Category"] },
  { name: "Lamps", path: "/lamps", page_type: "Supernova CC", build_status: "draft", status: "Live", tags: ["Category"] },
  { name: "Shop by Room", path: "/room", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Discovery"] },
  { name: "Brands", path: "/brands", page_type: "Static page", build_status: "ready", status: "Live", tags: ["Brands"] },
  { name: "Coming Soon", path: "/coming-soon", page_type: "System", build_status: "ready", status: "Live", tags: [] },
  { name: "Not Found", path: "*", page_type: "System", build_status: "ready", status: "Live", tags: [] },
  { name: "Site Manager", path: "/manage", page_type: "System", build_status: "ready", status: "Live", tags: ["Internal"] },
];

const seedLandingPages = [
  { name: "Summer Sale 2026", path: "/landing/summer-sale", tags: ["Campaign"], build_status: "ready", start: daysAgo(20), end: daysAgo(-30) },
  { name: "Hicks Pendant Feature", path: "/landing/hicks-pendant", tags: ["Brand"], build_status: "ready", start: daysAgo(60), end: null },
  { name: "Ralph's Homes Partnership", path: "/landing/ralphs-homes", tags: ["Builder"], build_status: "draft", start: null, end: null },
  { name: "Roto Fan Launch", path: "/landing/roto-fan", tags: ["Brand", "Campaign"], build_status: "ready", start: daysAgo(10), end: daysAgo(-15) },
  { name: "Spitfire Fan Launch", path: "/landing/spitfire-fan", tags: ["Brand"], build_status: "draft", start: null, end: null },
];

/* ---------------- videos ---------------- */

const seedVideos = [
  { name: "Showroom Walkthrough — Sandy", external_video_id: "ScMzIvxBSi4", tags: ["Showroom"] },
  { name: "Awards Highlight Reel", external_video_id: "aqz-KE-bpKQ", tags: ["Events"] },
  { name: "Designer Spotlight — Ainslie", external_video_id: "ScMzIvxBSi4", tags: ["Team"] },
  { name: "Outdoor Collection Teaser", external_video_id: "aqz-KE-bpKQ", tags: ["Editorial", "Seasonal"] },
];

/* ---------------- labels ---------------- */

const seedLabels: { scope: string; names: string[] }[] = [
  { scope: "static", names: ["Core", "Editorial", "Policy", "Category", "Discovery", "Brands", "Trade", "Internal", "Seasonal"] },
  { scope: "objects", names: ["Homepage", "Marketing", "Brand", "Reusable", "Experimental"] },
  { scope: "images", names: ["Editorial", "Showroom", "Products", "Team", "Events", "Homepage", "Outdoor"] },
  { scope: "videos", names: ["Showroom", "Events", "Team", "Editorial", "Seasonal"] },
  { scope: "landing", names: ["Campaign", "Brand", "Builder"] },
];

/* ---------------- exported demo payloads for edge-function stubs ------ */

export const demoReviews = [
  { author: "Marlee T.", authorPhoto: null, rating: 5, text: "The team helped us select fixtures for our whole build. Calm, patient, and the showroom is stunning.", relativeTime: "2 weeks ago", publishTime: daysAgo(14), location: "Sandy" },
  { author: "Grant P.", authorPhoto: null, rating: 5, text: "Beautiful selection and genuinely helpful lighting advice. We left with a plan for every room.", relativeTime: "a month ago", publishTime: daysAgo(31), location: "Orem" },
  { author: "Sadie H.", authorPhoto: null, rating: 5, text: "Worth the drive. The chandeliers in the entry gallery are unlike anything else in the state.", relativeTime: "2 months ago", publishTime: daysAgo(58), location: "Heber City" },
  { author: "Devin R.", authorPhoto: null, rating: 5, text: "Our designer coordinated finishes across sixteen fixtures. Everything arrived on schedule.", relativeTime: "3 months ago", publishTime: daysAgo(88), location: "St. George" },
  { author: "Kaylee B.", authorPhoto: null, rating: 5, text: "Warm, unhurried service and a showroom that feels like a hotel lobby.", relativeTime: "4 months ago", publishTime: daysAgo(120), location: "Layton" },
];

export const demoUsers = [
  { id: "00000000-0000-4000-8000-000000000001", email: "demo@novalighting.com", created_at: daysAgo(300), last_sign_in_at: daysAgo(0), roles: ["admin"] },
  { id: "00000000-0000-4000-8000-000000000002", email: "brooke@novalighting.com", created_at: daysAgo(210), last_sign_in_at: daysAgo(2), roles: ["admin"] },
  { id: "00000000-0000-4000-8000-000000000003", email: "jason@novalighting.com", created_at: daysAgo(180), last_sign_in_at: daysAgo(1), roles: ["admin"] },
  { id: "00000000-0000-4000-8000-000000000004", email: "cody@novalighting.com", created_at: daysAgo(120), last_sign_in_at: daysAgo(9), roles: ["user"] },
  { id: "00000000-0000-4000-8000-000000000005", email: "ainslie@novalighting.com", created_at: daysAgo(75), last_sign_in_at: daysAgo(21), roles: ["user"] },
];

/* ---------------- build the in-memory tables ---------------- */

let seeded = false;

export function seedPrototypeData() {
  if (seeded) return;
  seeded = true;

  /* pages */
  const pages = [
    ...seedPages.map((p, i) => ({
      id: uid(),
      slug_id: `${p.path.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "home"}-page`,
      name: p.name,
      path: p.path,
      description: p.description ?? null,
      notes: null,
      tags: p.tags,
      page_type: p.page_type,
      status: p.status,
      build_status: p.build_status,
      start_at: null,
      end_at: null,
      scaffold_dismissed: true,
      archived_at: null,
      thumbnail_url: null,
      preview_url: null,
      thumbnail_updated_at: null,
      thumbnail_build_version: null,
      created_at: daysAgo(200 - i),
      updated_at: daysAgo(i * 2),
    })),
    ...seedLandingPages.map((p, i) => ({
      id: uid(),
      slug_id: p.path.split("/").pop(),
      name: p.name,
      path: p.path,
      description: null,
      notes: null,
      tags: p.tags,
      page_type: "Landing page",
      status: "Live",
      build_status: p.build_status,
      start_at: p.start,
      end_at: p.end,
      scaffold_dismissed: true,
      archived_at: null,
      thumbnail_url: null,
      preview_url: null,
      thumbnail_updated_at: null,
      thumbnail_build_version: null,
      created_at: daysAgo(90 - i * 5),
      updated_at: daysAgo(i),
    })),
  ];
  db.pages = pages;

  /* object registry — one row per real component */
  const registryKeys = Object.keys(objectRegistry);
  db.object_registry = registryKeys.map((key, i) => ({
    id: uid(),
    slug_id: key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(),
    name: key.replace(/([a-z])([A-Z])/g, "$1 $2"),
    component_key: key,
    description: null,
    status: i % 5 === 0 ? "Draft" : "Ready",
    intended_pages: i % 3 === 0 ? ["/"] : [],
    labels: i % 2 === 0 ? ["Homepage"] : ["Marketing"],
    archived_at: null,
    thumbnail_url: null,
    preview_url: null,
    thumbnail_updated_at: null,
    thumbnail_build_version: null,
    created_at: daysAgo(150 - i * 3),
    updated_at: daysAgo(i),
  }));

  /* legacy objects table */
  db.objects = ["Hero Banner", "Category Grid", "Testimonial Row", "Newsletter Block"].map((name, i) => ({
    id: uid(),
    slug_id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    description: null,
    status: ["Planned", "In Progress", "Built", "Built"][i],
    notes: null,
    tags: ["Reusable"],
    archived_at: null,
    created_at: daysAgo(120 - i * 7),
    updated_at: daysAgo(i * 3),
  }));

  db.page_objects = [];
  db.object_page_usages = db.object_registry.slice(0, 8).map((o, i) => ({
    object_registry_id: o.id,
    page_id: pages[i % 6].id,
    created_at: daysAgo(i),
  }));

  /* images */
  db.images = seedImages.map((img, i) => {
    const base = img.filename.replace(/\.[^.]+$/, "");
    const published = i % 3 !== 0;
    return {
      id: uid(),
      slug_id: `${base}-${i}`,
      filename: img.filename,
      original_path: `originals/${img.filename}`,
      web_path: `web/${base}.webp`,
      original_url: img.url,
      web_url: img.url,
      fallback_path: null,
      fallback_url: img.url,
      fallback_bytes: img.bytes,
      alt_text: base.replace(/[-_]+/g, " "),
      description: null,
      width: 1600,
      height: 1067,
      original_bytes: img.bytes,
      web_bytes: Math.round(img.bytes * 0.32),
      tags: IMAGE_LABELS[i % IMAGE_LABELS.length],
      archived_at: null,
      visibility: published ? "public" : "gated",
      taken_at: daysAgo(i * 2),
      camera: i % 4 === 0 ? "Canon EOS R5" : null,
      lens: null,
      gps_lat: null,
      gps_lng: null,
      place_name: i % 6 === 0 ? "Sandy, Utah" : null,
      place_details: null,
      exif_extracted_at: null,
      created_at: daysAgo(i),
      updated_at: daysAgo(i),
    };
  });

  db.image_page_usages = db.images.slice(0, 30).map((img, i) => ({
    image_id: img.id,
    page_id: pages[i % pages.length].id,
    created_at: daysAgo(i),
  }));

  /* videos */
  db.videos = seedVideos.map((v, i) => ({
    id: uid(),
    slug_id: v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: v.name,
    source_type: "external",
    storage_path: null,
    storage_url: null,
    external_url: `https://www.youtube.com/watch?v=${v.external_video_id}`,
    external_video_id: v.external_video_id,
    poster_url: seedImages[i % seedImages.length]?.url ?? null,
    poster_path: null,
    duration_seconds: 84 + i * 17,
    width: 1920,
    height: 1080,
    file_bytes: null,
    alt_text: v.name,
    description: "",
    tags: v.tags,
    alt_path: null,
    alt_url: null,
    alt_mime: null,
    alt_bytes: null,
    visibility: "public",
    archived_at: null,
    created_at: daysAgo(40 - i * 6),
    updated_at: daysAgo(i),
  }));

  db.video_page_usages = [];

  /* labels */
  db.tags = seedLabels.flatMap(({ scope, names }) =>
    names.map((name, i) => ({
      id: uid(),
      name,
      scope,
      parent_id: null,
      depth: 0,
      color_index: i % 8,
      created_at: daysAgo(180),
    })),
  );

  /* misc */
  db.page_redirects = [
    { id: uid(), from_path: "/showrooms", to_path: "/locations", page_id: null, created_at: daysAgo(60) },
    { id: uid(), from_path: "/our-team", to_path: "/team", page_id: null, created_at: daysAgo(45) },
  ];
  db.user_roles = demoUsers.flatMap((u) =>
    u.roles.map((role) => ({ id: uid(), user_id: u.id, role, created_at: u.created_at })),
  );
  db.admin_emails = demoUsers
    .filter((u) => u.roles.includes("admin"))
    .map((u) => ({ id: uid(), email: u.email, created_at: u.created_at }));
  db.link_audit_rows = [];
  db.link_audit_meta = [];
  db.render_tokens = [];
  db.wishlists = [];
  db.wishlist_items = [];
}
