// New Arrivals — the shoppable catalog of newly added fixtures.
//
// HOW TO ADD AN ITEM
// 1. Drop the product photo (white background, square-ish) in src/assets/products/
// 2. Import it below.
// 3. Add an entry to the `items` array of the right group.
//    - `featured: true` promotes an item into the large slot at the top of its
//      group (the first one wins).
//    - `href` is the internal product destination — use "/coming-soon" until a
//      catalog page exists.
//    - `price` is optional. Leave it off and the card shows "Price on request".
//    - `category` powers the filter row at the top of the page.
//
// HOW TO ADD A GROUP
// Append a new object to `newAndNowGroups`. Nothing else needs to change.

import vintonImg from "@/assets/products/vinton-pendant-noble-brass.jpg";
import skyeImg from "@/assets/products/skye-sconce-polished-brass.jpg";
import valetteImg from "@/assets/products/valette-chandelier-natural-aged-brass.jpg";
import dalailaImg from "@/assets/products/dalaila-table-lamp-aged-brass.jpg";

// CDN-hosted product photography (high-resolution manufacturer shots).
import piafAsset from "@/assets/products/piaf-hi.asset.json";
import caddoAsset from "@/assets/products/caddo-hi.asset.json";
import reeseAsset from "@/assets/products/reese-lantern.jpg.asset.json";
import montroseAsset from "@/assets/products/montrose-hi.asset.json";
import brucevilleAsset from "@/assets/products/bruceville-hi.asset.json";
import brynnAsset from "@/assets/products/brynn-hi.asset.json";
import eulaAsset from "@/assets/products/eula-hi.asset.json";
import southfieldsAsset from "@/assets/products/southfields.jpg.asset.json";
import eldonAsset from "@/assets/products/eldon.jpg.asset.json";
import hayworthAsset from "@/assets/products/hayworth-hi.asset.json";
import lonnieAsset from "@/assets/products/lonnie.webp.asset.json";
import ginoAsset from "@/assets/products/gino.jpg.asset.json";
import rhodaAsset from "@/assets/products/rhoda.png.asset.json";
import meridianPendantAsset from "@/assets/products/meridian-pendant.jpg.asset.json";
import kichlerPictureLightAsset from "@/assets/products/kichler-picture-light.jpg.asset.json";
import kichlerBathAsset from "@/assets/products/kichler-bath-3lt.jpg.asset.json";
import meridianChandelierAsset from "@/assets/products/meridian-chandelier.jpg.asset.json";
import delgadoAsset from "@/assets/products/delgado-lantern.jpg.asset.json";
import leoGlobeAsset from "@/assets/products/leo-globe.jpg.asset.json";

// Lifestyle / material imagery for the editorial sections.
import collectedHomeAsset from "@/assets/collected-home-lifestyle.jpg.asset.json";
import coastalAsset from "@/assets/coastal-redefined-lifestyle.jpg.asset.json";
import wellPricedAsset from "@/assets/well-priced-well-designed.jpg.asset.json";

export interface NewAndNowItem {
  id: string;
  name: string;
  brand: string;
  collection?: string;
  finish?: string;
  /** Filter label, e.g. "Pendants", "Sconces", "Chandeliers", "Lamps". */
  category: string;
  /** Product photo. Omit until artwork exists — the card shows a quiet placeholder. */
  image?: string;
  /** USD. Omit for "Price on request". */
  price?: number;
  /** Short badge, e.g. "New", "Back in stock". Keep it to two words. */
  badge?: string;
  /** Optional one-line note. Plain and specific. */
  note?: string;
  /**
   * Destination. Internal path (e.g. "/coming-soon") or an absolute
   * https:// product URL — absolute URLs open in a new tab.
   */
  href: string;
  featured?: boolean;
}

export interface NewAndNowGroup {
  id: string;
  title: string;
  kicker?: string;
  intro?: string;
  items: NewAndNowItem[];
}

export const newAndNowGroups: NewAndNowGroup[] = [
  {
    id: "just-arrived",
    kicker: "01",
    title: "Just Arrived",
    intro:
      "The newest additions to our collection, chosen for proportion, finish, and the quality of the light they cast.",
    items: [
      {
        id: "reese-17-lantern-soft-brass",
        name: "Reese 17\" Lantern",
        brand: "Visual Comfort & Co.",
        collection: "Reese",
        finish: "Soft Brass with Clear Glass",
        category: "Lanterns",
        image: reeseAsset.url,
        price: 3499,
        badge: "New",
        note: "Marie Flanigan's chain-suspended lantern in seeded glass.",
        href: "https://www.visualcomfort.com/us/p/reese-17-lantern-mf5188?selected_product=MF%205188SB-CG",
        featured: true,
      },
      {
        id: "skye-wall-sconce-polished-brass",
        name: "Skye Wall Sconce",
        brand: "Mitzi by Hudson Valley",
        collection: "Skye",
        finish: "Polished Brass",
        category: "Sconces",
        image: skyeImg,
        price: 328,
        badge: "New",
        href: "/coming-soon",
      },
      {
        id: "valette-6-light-chandelier-natural-aged-brass",
        name: "Valette 6-Light Chandelier",
        brand: "Maxim",
        collection: "Valette",
        finish: "Natural Aged Brass",
        category: "Chandeliers",
        image: valetteImg,
        price: 690,
        badge: "New",
        href: "/coming-soon",
      },
      {
        id: "dalaila-table-lamp-aged-brass",
        name: "Dalaila Table Lamp",
        brand: "Mitzi by Hudson Valley",
        collection: "Dalaila",
        finish: "Aged Brass",
        category: "Lamps",
        image: dalailaImg,
        price: 415,
        badge: "New",
        href: "/coming-soon",
      },
      {
        id: "vinton-3-light-pendant-noble-brass",
        name: "Vinton 3-Light Pendant",
        brand: "Savoy House",
        collection: "Vinton",
        finish: "Noble Brass",
        category: "Pendants",
        image: vintonImg,
        price: 449,
        badge: "New",
        note: "A quiet linear form for islands and long tables.",
        href: "/coming-soon",
      },
    ],
  },
];

/** Flat list, handy for counts, filters, and teasers that show a subset. */
export const newAndNowItems: NewAndNowItem[] = newAndNowGroups.flatMap((g) => g.items);

/** Unique category labels in the order they first appear. */
export const newAndNowCategories: string[] = Array.from(
  new Set(newAndNowItems.map((item) => item.category)),
);

export const formatPrice = (price?: number) =>
  typeof price === "number"
    ? price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : "Price on request";

// ─────────────────────────────────────────────────────────────────────────────
// EDITORIAL SECTIONS (02, 03, 04)
//
// HOW TO ADD A PRODUCT TO AN EDITORIAL SECTION
// 1. Drop the product photo (white background, square-ish) in src/assets/products/
// 2. Import it at the top of this file.
// 3. Push a NewAndNowItem into the section's `items` array below.
//    Each section reserves `slots` spaces (6). Any slot without an item renders
//    as a quiet "Arriving soon" placeholder, so the layout never breaks.
// 4. `href` must point at the item's own product page (use "/coming-soon"
//    until that page exists). Do not create collection pages.
//
// `layout` controls the section's visual rhythm — pick one, do not invent new
// values without adding a matching branch on the page:
//   "lifestyle-lead"   full-bleed lifestyle image above a 3-up product grid
//   "asymmetric"       sticky lifestyle image beside a 2-up product column
//   "material-closeup" close-up material image between two product rows

export interface EditorialSection {
  id: string;
  kicker: string;
  title: string;
  copy: string;
  layout:
    | "lifestyle-lead"
    | "asymmetric"
    | "asymmetric-mirror"
    | "material-closeup";
  image: string;
  imageAlt: string;
  /** Reserved product spaces. Keep at 6. */
  slots: number;
  items: NewAndNowItem[];
}

export const editorialSections: EditorialSection[] = [
  {
    id: "the-collected-home",
    kicker: "01",
    title: "The Collected Home",
    copy: "Warm finishes, soft shades and timeless silhouettes bring an easy, lived-in feeling to every room.",
    layout: "lifestyle-lead",
    image: collectedHomeAsset.url,
    imageAlt:
      "Warm kitchen with wood ceiling, brass pendants and softly patterned shades above a stone island",
    slots: 6,
    items: [
      {
        id: "bruceville-pendant",
        name: "Bruceville Pendant",
        brand: "Hudson Valley Lighting",
        collection: "Bruceville",
        finish: "Heritage Brass",
        category: "Pendants",
        image: brucevilleAsset.url,
        note: "A softly shaded form that settles easily into a room.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-hudson-valley/bruceville-pendant/4915-hb/sku-AF9Z3?ut=A",
      },
      {
        id: "brynn-table-lamp",
        name: "Brynn Table Lamp",
        brand: "Mitzi by Hudson Valley",
        collection: "Brynn",
        finish: "Cream Linen",
        category: "Lamps",
        image: brynnAsset.url,
        note: "Quiet proportion for a console or bedside.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-mitzi-by-hudson-valley-lighting/brynn-table-lamp/hl268201b-cl/sku-608X9E6?ut=A",
      },
      {
        id: "eula-wall-sconce",
        name: "Eula Wall Sconce",
        brand: "Mitzi by Hudson Valley",
        collection: "Eula",
        finish: "Patina Brass",
        category: "Sconces",
        image: eulaAsset.url,
        note: "Warm brass for flanking a mirror or hallway.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-mitzi-by-hudson-valley-lighting/eula-wall-sconce/h1164101-pbr/sku-608X8HK?ut=A",
      },
      {
        id: "collected-montrose-1-light-pendant-matte-black",
        name: "Montrose 1-Light Pendant",
        brand: "Savoy House",
        collection: "Montrose",
        finish: "Matte Black",
        category: "Pendants",
        image: montroseAsset.url,
        price: 378,
        note: "Ribbed opal glass with a schoolhouse ease.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-savoy-house/montrose-1-light-pendant-in-matte-black/7-6999-1-89/sku-APNQG?ut=A",
      },
      {
        id: "collected-piaf-large-two-light-linear-pendant",
        name: "Piaf Large Two-Light Linear Pendant",
        brand: "Visual Comfort & Co.",
        collection: "Piaf",
        finish: "Antique Gild",
        category: "Pendants",
        image: piafAsset.url,
        price: 999,
        note: "A slender linear span for islands and long tables.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-visual-comfort--co-signature-collection-all-us/piaf-large-two-light-linear-pendant/tob-5455ag-l/sku-60KPTZ8?ut=A",
      },
      {
        id: "collected-caddo-medium-lantern",
        name: "Caddo Medium Lantern",
        brand: "Visual Comfort & Co.",
        collection: "Caddo",
        finish: "Celadon with Clear Glass",
        category: "Lanterns",
        image: caddoAsset.url,
        price: 2499,
        note: "Soft sea-glass color in a classic lantern frame.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-visual-comfort--co-signature-collection/caddo-medium-lantern/jn-5020cel-g-cg/sku-CLJM1?ut=A",
      },
    ],
  },
  {
    id: "coastal-redefined",
    kicker: "02",
    title: "Coastal, Redefined",
    copy: "Natural texture, relaxed silhouettes and quiet finishes bring a fresh perspective to coastal design.",
    layout: "asymmetric",
    image: coastalAsset.url,
    imageAlt:
      "Pale plaster entry with an antique stone console, wood stools and a brass cylinder sconce",
    slots: 6,
    items: [
      {
        id: "southfields-pendant-aged-brass-cream-pebble",
        name: "Southfields Pendant",
        brand: "Hudson Valley Lighting",
        collection: "Southfields",
        finish: "Aged Brass with Cream Pebble Ceramic",
        category: "Pendants",
        image: southfieldsAsset.url,
        price: 773,
        note: "Handmade ceramic with rattan woven through the rim.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-hudson-valley/southfields-pendant/5317-agb-ccp/sku-AF929",
      },
      {
        id: "eldon-large-chandelier-satin-brass",
        name: "Eldon Large Chandelier",
        brand: "Visual Comfort & Co.",
        collection: "Eldon",
        finish: "Satin Brass with White Linen",
        category: "Chandeliers",
        image: eldonAsset.url,
        price: 379,
        note: "Curved arms and linen shades, which can also be removed.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-visual-comfort--co-studio-collection/large-chandelier/djc1205sb/sku-7072Y08",
      },
      {
        id: "hayworth-chandelier-vintage-gold-leaf",
        name: "Hayworth Chandelier",
        brand: "Hudson Valley Lighting",
        collection: "Hayworth",
        finish: "Vintage Gold Leaf with Woven Seagrass",
        category: "Chandeliers",
        image: hayworthAsset.url,
        price: 4179,
        note: "A scalloped seagrass shell suspended on gold leaf chain.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-hudson-valley/hayworth-chandelier/6208-vgl/sku-AF91D",
      },
      {
        id: "rhoda-wall-sconce-aged-brass",
        name: "Rhoda Wall Sconce",
        brand: "Mitzi by Hudson Valley Lighting",
        collection: "Rhoda",
        finish: "Aged Brass",
        category: "Wall Sconces",
        image: rhodaAsset.url,
        price: 348,
        note: "A quiet two-light sconce for flanking a mirror.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-mitzi-by-hudson-valley-lighting/rhoda-wall-sconce/h1144102-agb/sku-608X8HH",
      },
      {
        id: "lonnie-wall-sconce-vintage-gold-leaf",
        name: "Lonnie Wall Sconce",
        brand: "Troy Lighting",
        collection: "Lonnie",
        finish: "Vintage Gold Leaf with Ivory Rattan",
        category: "Wall Sconces",
        image: lonnieAsset.url,
        note: "A woven rattan dome softened by gold leaf detail.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-troy/lonnie-wall-sconce/b1611-vgl/sku-X8UH",
      },
      {
        id: "gino-table-lamp-patina-brass-ceramic",
        name: "Gino Table Lamp",
        brand: "Troy Lighting",
        collection: "Gino",
        finish: "Patina Brass with Ceramic",
        category: "Lamps",
        image: ginoAsset.url,
        note: "A ribbed ceramic body beneath a wide raffia shade.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-troy/gino-table-lamp/ptl5023-pbr-cer/sku-9KPPM",
      },
    ],
  },
  {
    id: "well-priced-well-designed",
    kicker: "03",
    title: "Well Priced, Well Designed",
    copy: "Considered proportion and honest finishes at a price that leaves room for the rest of the room.",
    layout: "asymmetric-mirror",
    image: wellPricedAsset.url,
    imageAlt:
      "Black wall sconce with a white pleated shade beside a window and styled oak shelving",
    slots: 6,
    items: [
      {
        id: "meridian-1-light-pendant-matte-black",
        name: "Meridian 1-Light Pendant",
        brand: "Meridian by Savoy House",
        finish: "Matte Black",
        category: "Pendants",
        image: meridianPendantAsset.url,
        price: 186,
        note: "A pleated shade on a slim black stem.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-savoy-house-meridian/1-light-pendant-in-matte-black/m7045mbk/sku-8042YL2?ut=A",
      },
      {
        id: "kichler-picture-light-1lt-champagne-bronze",
        name: "Picture Light, 1-Light",
        brand: "Kichler",
        finish: "Champagne Bronze",
        category: "Picture Lights",
        image: kichlerPictureLightAsset.url,
        price: 265,
        note: "A fluted shade that washes art in even light.",
        href: "http://hansen.xologicstore.com/location-rating-wet-rated/brand-kichler/picture-light-1lt/52649cpz/sku-3406DFE1?ut=A",
      },
      {
        id: "kichler-bath-3lt-champagne-bronze",
        name: "Bath Light, 3-Light",
        brand: "Kichler",
        finish: "Champagne Bronze",
        category: "Vanity Lights",
        image: kichlerBathAsset.url,
        price: 255,
        note: "Clear cylinders on a warm brass rail.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-kichler/bath-3lt/55211cpz/sku-3406GC7A?ut=A",
      },
      {
        id: "meridian-5-light-chandelier-matte-black",
        name: "Meridian 5-Light Chandelier",
        brand: "Meridian by Savoy House",
        finish: "Matte Black",
        category: "Chandeliers",
        image: meridianChandelierAsset.url,
        price: 262,
        note: "Slender curved arms with candle-style lights.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-savoy-house-meridian/5-light-chandelier-in-matte-black/m100120mbk/sku-80403RK?ut=A",
      },
      {
        id: "quorum-delgado-20-led-lantern-matte-black",
        name: "Delgado 20\" LED Lantern",
        brand: "Quorum",
        collection: "Delgado",
        finish: "Matte Black",
        category: "Outdoor",
        image: delgadoAsset.url,
        price: 136,
        note: "An open black frame around a clear glass cylinder.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-quorum/delgado-20-led-lantern-mb/791-20-59/sku-9X1W6?ut=A",
      },
      {
        id: "leo-hanging-globe-semi-flush-satin-brass",
        name: "Leo Hanging Globe Semi-Flush Mount",
        brand: "Visual Comfort & Co.",
        collection: "Leo",
        finish: "Satin Brass",
        category: "Flush Mounts",
        image: leoGlobeAsset.url,
        price: 79,
        note: "An opal globe on satin brass, for wall or ceiling.",
        href: "https://hansen.xologicstore.com/location-rating-wet-rated/brand-visual-comfort--co-studio-collection/leo-hanging-globe-one-light-wall-ceiling-semi-flush-mount/7518-848/sku-706ZTD9?ut=A",
      },
    ],
  },
];
