import { useQuery } from "@tanstack/react-query";
import { adminCatalog } from "@/integrations/admin-catalog/client";
import type { Product } from "@/data/products";

// Shape of public.catalog (the 16-column contract view)
export interface CatalogRow {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  price: number | null;
  stock: number | null;
  images: string[] | null;
  category: string | null;
  finish: string | null;
  style: string | null;
  height_inches: number | null;
  width_inches: number | null;
  vendor_id: string | null;
  product_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CatalogProduct = Product & {
  sku: string | null;
  images: string[];
  style: string | null;
  raw: CatalogRow;
};

function decode(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function adapt(row: CatalogRow): CatalogProduct {
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  return {
    id: row.id,
    sku: row.sku,
    name: decode(row.name) || "Untitled",
    price: typeof row.price === "number" ? row.price : Number(row.price) || 0,
    image: images[0] || "",
    images,
    category: row.category || "",
    subcategory: "",
    finishes: row.finish ? [row.finish] : [],
    style: row.style,
    description: decode(row.description),
    dimensions: {
      height: row.height_inches != null ? `${row.height_inches}"` : "—",
      width: row.width_inches != null ? `${row.width_inches}"` : "—",
    },
    inStock: row.stock ?? 0,
    raw: row,
  };
}

async function fetchCatalog(): Promise<CatalogProduct[]> {
  const { data, error } = await adminCatalog
    .from("catalog")
    .select("*")
    .order("name", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data as CatalogRow[]).map(adapt);
}

export function useCatalog() {
  return useQuery<CatalogProduct[]>({
    queryKey: ["admin-catalog"],
    queryFn: fetchCatalog,
    staleTime: 5 * 60 * 1000,
  });
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Loose slug filter against name/category/style. */
export function useCatalogBySlug(slug: string) {
  const query = useCatalog();
  const target = normalize(slug || "");
  const data = (query.data ?? []).filter((p) => {
    if (!target) return true;
    const haystack = [p.category, p.style, p.name]
      .filter(Boolean)
      .map((x) => normalize(String(x)))
      .join(" ");
    return haystack.includes(target);
  });
  return { ...query, data };
}

export function useCatalogProduct(idOrSku: string) {
  const query = useCatalog();
  const product = query.data?.find(
    (p) => p.id === idOrSku || p.sku === idOrSku,
  );
  return { ...query, data: product };
}
