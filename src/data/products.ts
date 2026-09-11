import chandelierImg from "@/assets/chandelier-product.png";
import pendantImg from "@/assets/pendant-jute.png";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  finishes: string[];
  description: string;
  dimensions: { height: string; width: string };
  inStock: number;
}

export const products: Product[] = [
  {
    id: "menil-40-brass",
    name: 'Menil 40" Ring Chandelier',
    price: 1499.0,
    image: chandelierImg,
    category: "Ceiling",
    subcategory: "Chandeliers",
    finishes: ["Brass", "Bronze", "Nickel", "Black"],
    description: "The Menil ring chandelier features a sleek circular design with a warm brass finish.",
    dimensions: { height: '24.75"', width: '40"' },
    inStock: 27,
  },
  {
    id: "menil-40-bronze",
    name: 'Menil 40" Ring Chandelier',
    price: 1499.0,
    image: chandelierImg,
    category: "Ceiling",
    subcategory: "Chandeliers",
    finishes: ["Bronze", "Brass", "Nickel", "Black"],
    description: "The Menil ring chandelier features a sleek circular design in aged bronze.",
    dimensions: { height: '24.75"', width: '40"' },
    inStock: 15,
  },
  {
    id: "menil-40-nickel",
    name: 'Menil 40" Ring Chandelier',
    price: 1499.0,
    image: chandelierImg,
    category: "Ceiling",
    subcategory: "Chandeliers",
    finishes: ["Nickel", "Brass", "Bronze", "Black"],
    description: "The Menil ring chandelier in polished nickel finish.",
    dimensions: { height: '24.75"', width: '40"' },
    inStock: 12,
  },
  {
    id: "ophira-36-bronze",
    name: "Ophira 36 Inch 4 Light Pendant with Jute Shade in Champagne Bronze",
    price: 949.99,
    image: pendantImg,
    category: "Ceiling",
    subcategory: "Chandeliers",
    finishes: ["Champagne Bronze", "Bronze", "Black"],
    description: "The Ophira 4 light pendant light is inspired elegance and organic beauty. Layers of natural jute, stacked and complemented by our warm Champagne Bronze finish, create an eye-catching fixture.",
    dimensions: { height: '24.75"', width: '36"' },
    inStock: 27,
  },
  {
    id: "ophira-28-bronze",
    name: "Ophira 28 Inch 4 Light Pendant with Jute Shade",
    price: 849.99,
    image: pendantImg,
    category: "Ceiling",
    subcategory: "Chandeliers",
    finishes: ["Champagne Bronze", "Bronze", "Black"],
    description: "The Ophira 28 inch pendant with layered jute shade.",
    dimensions: { height: '20"', width: '28"' },
    inStock: 19,
  },
  {
    id: "ophira-22-bronze",
    name: "Ophira 22 Inch 1 Light Pendant with Jute Shade",
    price: 449.99,
    image: pendantImg,
    category: "Ceiling",
    subcategory: "Chandeliers",
    finishes: ["Champagne Bronze", "Bronze", "Black"],
    description: "Compact version of the beloved Ophira pendant.",
    dimensions: { height: '16"', width: '22"' },
    inStock: 34,
  },
];

export const categories = [
  {
    name: "CEILING",
    path: "/category/ceiling",
    subcategories: ["Chandelier", "Pendant", "Flush Mount", "Semi-Flush Mount", "Island-Pool Table", "Lanterns", "Multisystem Lights", "View All"],
    images: [
      "https://api.builder.io/api/v1/image/assets/TEMP/5acd74feb8aeb6caa078b72487a595900f0852bb?width=1512",
      "https://api.builder.io/api/v1/image/assets/TEMP/c93661a69eec27469c0b2753c7ddd41a1f04fd77?width=876",
    ],
  },
  {
    name: "WALL",
    path: "/category/wall",
    subcategories: ["Bath", "Task", "Picture Lights", "Cordless", "Mirrors", "Shades", "Bulbs", "View All"],
    images: [
      "https://api.builder.io/api/v1/image/assets/TEMP/12de3f65a16f5bb709804c18720efb0547f310da?width=1512",
      "https://api.builder.io/api/v1/image/assets/TEMP/ade52e3e4f826d698e9593dae801b5356fff7266?width=876",
    ],
  },
  {
    name: "TABLE",
    path: "/category/table",
    subcategories: ["Task", "Cordless & Rechargeable", "Bulbs", "View All"],
    images: [
      "https://api.builder.io/api/v1/image/assets/TEMP/846a985b5dc5c50beeee21a2e02026d6881ad4e0?width=1512",
      "https://api.builder.io/api/v1/image/assets/TEMP/f543514ac08ee8d0e8135943f01401567dedca15?width=876",
    ],
  },
  {
    name: "FLOOR",
    path: "/category/floor",
    subcategories: ["Task", "Cordless & Rechargeable", "Bulbs", "View All"],
    images: [
      "https://api.builder.io/api/v1/image/assets/TEMP/8db15cdfdacde2d6f5e4b15b207a3ef1782eaaa2?width=1512",
      "https://api.builder.io/api/v1/image/assets/TEMP/1a59d487a7e2e5d76a37901e30609c557bca468f?width=876",
    ],
  },
  {
    name: "OUTDOOR",
    path: "/category/outdoor",
    subcategories: ["Wall", "Ceiling", "Table & Floor", "Rechargeable", "Post", "Bollard & Path", "Step Lights", "Gas Lanterns", "View All"],
    images: [
      "https://api.builder.io/api/v1/image/assets/TEMP/e44259f9ef9abfa1a6a48babf81cc1ec48380a58?width=1512",
      "https://api.builder.io/api/v1/image/assets/TEMP/2946936e096a017ff1ab6c0f3da6eeb7aaadd941?width=876",
    ],
  },
  {
    name: "FANS",
    path: "/category/fans",
    subcategories: ["Indoor", "Indoor/Outdoor", "Coastal Fans", "Smart Fans", "Accessories", "View All"],
    images: [
      "https://api.builder.io/api/v1/image/assets/TEMP/083c73b4c44c91b0a0f646c2feee6a94d4eb3567?width=1512",
      "https://api.builder.io/api/v1/image/assets/TEMP/5850f1b6b17432a82b60065dff880a3b0bc0e009?width=876",
    ],
  },
  {
    name: "SALE",
    path: "/category/sale",
    subcategories: [],
    images: [],
  },
];

export const finishColors: Record<string, string> = {
  Brass: "#C5A253",
  Bronze: "#8B6914",
  Nickel: "#B0B0B0",
  Black: "#222222",
  White: "#F5F5F0",
  "Champagne Bronze": "#C9A96E",
};
