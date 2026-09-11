/**
 * PROTOTYPE MODE — drop-in replacement for the Supabase clients.
 *
 * Every screen imports `supabase` from here. There is no network call, no
 * login and no database: reads come from the in-memory demo dataset and writes
 * update it for the length of the browser session.
 */

import { createPrototypeClient, db, uid } from "./engine";
import { seedPrototypeData } from "./seed";
import { products } from "@/data/products";

seedPrototypeData();

/** Product catalog rows (shape of the former `catalog` view). */
if (!db.catalog) {
  db.catalog = products.map((p, i) => ({
    id: p.id,
    sku: `NL-${String(1000 + i)}`,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.inStock,
    images: [p.image],
    category: p.category,
    finish: p.finishes?.[0] ?? null,
    style: p.subcategory || null,
    height_inches: Number(String(p.dimensions?.height ?? "").replace(/[^0-9.]/g, "")) || null,
    width_inches: Number(String(p.dimensions?.width ?? "").replace(/[^0-9.]/g, "")) || null,
    vendor_id: null,
    product_type_id: null,
    created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export const supabase = createPrototypeClient() as any;

/** The product catalog used to live in a separate read-only project. */
export const adminCatalog = createPrototypeClient() as any;

export { db, uid };
