// The Outdoor Edit — a curated summer lookbook of outdoor fixtures.
//
// HOW TO ADD A PRODUCT
// 1. Drop the product photo (white background, square-ish) in src/assets/products/
// 2. Import it below and set `image` on the item.
//    - Leave `image` off and the card shows a quiet "Photo coming" placeholder.
//    - Leave `price` off and the card shows "Price on request".
//    - `href` is the destination — use "/coming-soon" until a catalog page exists.
// 3. `placeholder: true` marks copy that still needs real product data.
//
// HOW TO ADD A CHAPTER
// Append a new object to `outdoorChapters`. Nothing else needs to change.

import heroAsset from "@/assets/outdoor-edit-hero.jpg.asset.json";
import porchAsset from "@/assets/outdoor-wall-carriage.png.asset.json";
import categoryAsset from "@/assets/outdoor-hanging-pendants.jpg.asset.json";
import fanAsset from "@/assets/outdoor-ceiling-fan.jpg.asset.json";

export interface OutdoorItem {
  id: string;
  name: string;
  brand: string;
  finish?: string;
  /** Product photo. Omit until artwork exists. */
  image?: string;
  /** USD. Omit for "Price on request". */
  price?: number;
  /** Short badge, e.g. "New", "Wet rated". Two words max. */
  badge?: string;
  href: string;
  /** True while the entry is stand-in copy awaiting the real fixture. */
  placeholder?: boolean;
}

export interface OutdoorChapter {
  id: string;
  /** Section number shown in garnet, e.g. "01". */
  index: string;
  kicker: string;
  title: string;
  copy: string;
  image: string;
  imageAlt: string;
  /** Short caption laid over / under the lifestyle band. */
  caption?: string;
  items: OutdoorItem[];
}

export const outdoorHero = {
  image: heroAsset.url,
  imageAlt:
    "Stone cottage entry at dusk with black wall lanterns beside the front door and a lantern on the courtyard gate pier",
  kicker: "Summer 2026",
  title: "The Outdoor Edit",
  copy:
    "Evenings outside deserve the same attention as the rooms inside. A curated selection of lanterns, sconces, path lights and fans — chosen for how they hold up to weather, and how they hold a room together after dark.",
};

const slot = (
  id: string,
  name: string,
  brand: string,
  finish: string,
  price?: number,
  badge?: string,
): OutdoorItem => ({
  id,
  name,
  brand,
  finish,
  price,
  badge,
  href: "/coming-soon",
  placeholder: true,
});

export const outdoorChapters: OutdoorChapter[] = [
  {
    id: "wall-carriage",
    index: "01",
    kicker: "Chapter One",
    title: "Outdoor Wall & Carriage Lights",
    copy:
      "The first light anyone sees. Scale it generously — a lantern that looks right in the showroom is usually a size too small beside a front door.",
    image: porchAsset.url,
    imageAlt:
      "Two tall matte black lantern wall sconces mounted along a white stucco exterior wall",
    caption: "Flank a door with a matched pair; center a single lantern above it.",
    items: [
      slot("wc-1", "Carriage Lantern, Large", "Brand pending", "Aged Brass", undefined, "New"),
      slot("wc-2", "Carriage Lantern, Medium", "Brand pending", "Matte Black"),
      slot("wc-3", "Wall Lantern, Tall", "Brand pending", "Weathered Zinc"),
      slot("wc-4", "Box Wall Sconce", "Brand pending", "Bronze"),
      slot("wc-5", "Gooseneck Barn Sconce", "Brand pending", "Textured Black"),
      slot("wc-6", "Slim Wall Sconce", "Brand pending", "Natural Brass"),
      slot("wc-7", "Downlight Wall Sconce", "Brand pending", "Dark Pewter", undefined, "Wet rated"),
      slot("wc-8", "Flush Wall Lantern", "Brand pending", "Matte Black"),
    ],
  },
  {
    id: "hanging-pendants",
    index: "02",
    kicker: "Chapter Two",
    title: "Hanging Pendants & Chandeliers",
    copy:
      "Overhead light sets the tone of a covered porch or patio. Hang it high enough to clear the walk, low enough to feel like a room.",
    image: categoryAsset.url,
    imageAlt:
      "Round wood-and-iron outdoor chandelier with seeded glass lanterns glowing on a covered porch",
    caption: "Leave at least seven feet of clearance beneath a hanging fixture.",
    items: [
      slot("hp-1", "Hanging Porch Lantern", "Brand pending", "Weathered Zinc"),
      slot("hp-2", "Woven Dome Pendant", "Brand pending", "Natural Teak"),
      slot("hp-3", "Outdoor Chandelier, Large", "Brand pending", "Aged Brass", undefined, "New"),
      slot("hp-4", "Caged Pendant", "Brand pending", "Textured Black"),
      slot("hp-5", "Rope-Wrapped Pendant", "Brand pending", "Natural Rope"),
      slot("hp-6", "Lantern Chandelier", "Brand pending", "Antique Bronze"),
      slot("hp-7", "Glass Globe Pendant", "Brand pending", "Natural Brass", undefined, "Wet rated"),
      slot("hp-8", "Semi-Flush Pendant", "Brand pending", "Matte Black"),
    ],
  },
  {
    id: "ceiling-fans",
    index: "03",
    kicker: "Chapter Three",
    title: "Outdoor Ceiling Fans",
    copy:
      "The layer people feel before they notice it. Match blade span to the space, and confirm damp versus wet rating for where it will hang.",
    image: fanAsset.url,
    imageAlt:
      "White three-blade ceiling fan above a white porch with a hanging swing and potted plants",
    caption: "Uncovered installs need a wet-rated fan — damp rating is for porches.",
    items: [
      slot("cf-1", "Damp-Rated Fan, 52\"", "Brand pending", "Brushed Nickel", undefined, "Wet rated"),
      slot("cf-2", "Large Patio Fan, 60\"", "Brand pending", "Matte White"),
      slot("cf-3", "Wet-Rated Fan, 56\"", "Brand pending", "Textured Black", undefined, "Wet rated"),
      slot("cf-4", "Fan with Light Kit", "Brand pending", "Aged Brass", undefined, "New"),
      slot("cf-5", "Low-Profile Outdoor Fan", "Brand pending", "Bronze"),
      slot("cf-6", "Three-Blade Fan, 54\"", "Brand pending", "Natural Teak"),
      slot("cf-7", "Windmill Fan, 60\"", "Brand pending", "Dark Bronze"),
      slot("cf-8", "Compact Porch Fan, 44\"", "Brand pending", "Matte Black"),
    ],
  },
];



export const formatPrice = (price?: number) =>
  price === undefined
    ? "Price on request"
    : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
