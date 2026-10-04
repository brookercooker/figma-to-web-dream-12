/**
 * Data clients used by every screen.
 *
 * `supabase` is the real Lovable Cloud client — all reads and writes persist.
 * `adminCatalog` still uses the in-memory demo catalog because the product
 * catalog lives in a separate project that is not connected yet.
 */

import { supabase as cloud } from "@/integrations/supabase/client";
import { createPrototypeClient, db, uid } from "./engine";
import { products } from "@/data/products";

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

export const supabase = cloud as any;

export const adminCatalog = createPrototypeClient() as any;

export { db, uid };
