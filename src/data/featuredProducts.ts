// Currently Loved — hand-picked fixtures from the Nova catalog.
// `href` is the internal destination — set these once catalog pages exist.

import vintonImg from "@/assets/products/vinton-pendant-noble-brass.jpg";
import skyeImg from "@/assets/products/skye-sconce-polished-brass.jpg";
import valetteImg from "@/assets/products/valette-chandelier-natural-aged-brass.jpg";
import dalailaImg from "@/assets/products/dalaila-table-lamp-aged-brass.jpg";

export interface FeaturedProduct {
  id: string;
  name: string;
  brand: string;
  collection: string;
  finish: string;
  image: string;
  sourceUrl: string;
  href: string;
}

export const featuredProducts: FeaturedProduct[] = [
  {
    id: "vinton-3-light-pendant-noble-brass",
    name: "Vinton 3-Light Pendant",
    brand: "Savoy House",
    collection: "Vinton",
    finish: "Noble Brass",
    image: vintonImg,
    sourceUrl:
      "https://hansen.xologicstore.com/location-rating-wet-rated/brand-savoy-house/vinton-3-light-pendant-in-noble-brass/7-1599-3-127/sku-APNQ1?ut=A",
    href: "/coming-soon",
  },
  {
    id: "skye-wall-sconce-polished-brass",
    name: "Skye Wall Sconce",
    brand: "Mitzi by Hudson Valley",
    collection: "Skye",
    finish: "Polished Brass",
    image: skyeImg,
    sourceUrl:
      "https://hansen.xologicstore.com/location-rating-wet-rated/brand-mitzi-by-hudson-valley-lighting/skye-wall-sconce/h222101-pbr/sku-608X8HJ?ut=A",
    href: "/coming-soon",
  },
  {
    id: "valette-6-light-chandelier-natural-aged-brass",
    name: "Valette 6-Light Chandelier",
    brand: "Maxim",
    collection: "Valette",
    finish: "Natural Aged Brass",
    image: valetteImg,
    sourceUrl:
      "https://hansen.xologicstore.com/location-rating-wet-rated/brand-maxim/valette-6-light-chandelier/12865nab/sku-A432G?ut=A",
    href: "/coming-soon",
  },
  {
    id: "dalaila-table-lamp-aged-brass",
    name: "Dalaila Table Lamp",
    brand: "Mitzi by Hudson Valley",
    collection: "Dalaila",
    finish: "Aged Brass",
    image: dalailaImg,
    sourceUrl:
      "https://hansen.xologicstore.com/location-rating-wet-rated/brand-mitzi-by-hudson-valley-lighting/dalaila-table-lamp/hl977201-agb-cis/sku-608X9ED?ut=A",
    href: "/coming-soon",
  },
];
