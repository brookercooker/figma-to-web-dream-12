import { useState } from "react";
import { useParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import FilterSidebar, { type FilterState, rangeFilters } from "@/components/FilterSidebar";
import { useCatalogBySlug } from "@/hooks/useAdminCatalog";
import noResultsDetective from "@/assets/no-results-detective.png";

const segmentToTitle: Record<string, string> = {
  "ceiling-lighting": "Ceiling Lights",
  "wall-lighting": "Wall & Bath",
  lamps: "Lamps",
  outdoor: "Outdoor",
  fans: "Fans",
  room: "Shop by Room",
  chandeliers: "Chandeliers",
  pendants: "Pendants",
  "island-linear": "Island & Linear Lights",
  "flush-mount": "Flush Mount",
  "semi-flush-mount": "Semi-Flush Mount",
  "indoor-lanterns": "Indoor Lanterns",
  sconces: "Wall Sconces",
  "bathroom-vanity": "Bathroom Vanity Lights",
  "outdoor-ceiling-mount": "Outdoor Ceiling Mount",
  table: "Table Lamps",
  floor: "Floor Lamps",
  kitchen: "Kitchen",
  "dining-room": "Dining Room",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  "living-room": "Living Room",
};

const CategoryPage = () => {
  const params = useParams();
  const lastSegment = params.detail || params.sub || params.room || params.category || "";
  void segmentToTitle[lastSegment];

  const { data: products = [], isLoading } = useCatalogBySlug(lastSegment);

  const [openFilters, setOpenFilters] = useState<Set<string>>(new Set(["FINISH"]));
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    checked: {},
    ranges: Object.fromEntries(rangeFilters.map((f) => [f.name, [f.min, f.max] as [number, number]])),
  });

  const toggleFilter = (name: string) => {
    setOpenFilters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs />

        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 text-xs font-sans font-medium tracking-[0.1em] uppercase text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${products.length} ${products.length === 1 ? "Result" : "Results"}`}
            </span>
            <select className="border border-border bg-background px-2 py-1.5 text-sm text-foreground">
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {showFilters && (
            <aside className="hidden lg:block w-60 shrink-0">
              <button
                onClick={() => setShowFilters(false)}
                className="flex items-center gap-2 text-xs font-sans font-medium tracking-[0.1em] uppercase text-foreground mb-6"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Hide Filters
              </button>
              <FilterSidebar
                openFilters={openFilters}
                toggleFilter={toggleFilter}
                filterState={filterState}
                setFilterState={setFilterState}
              />
            </aside>
          )}

          <div className="flex-1">
            <div className="hidden lg:flex items-center justify-between mb-6">
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 text-xs font-sans font-medium tracking-[0.1em] uppercase text-foreground"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Show Filters
                </button>
              )}
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {isLoading ? "Loading…" : `${products.length} ${products.length === 1 ? "Result" : "Results"}`}
                </span>
                <select className="border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>

            {!isLoading && products.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center">
                <div className="flex flex-col items-center px-8 py-6 max-w-md">
                  <img
                    src={noResultsDetective}
                    alt="Detective with magnifying glass"
                    loading="lazy"
                    width={768}
                    height={768}
                    className="h-40 w-40 object-contain mb-4"
                  />
                  <p className="font-serif text-2xl text-foreground mb-2 leading-tight">
                    Hmmm... I got nothin'
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No products in this category yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-[360px] bg-background overflow-y-auto shadow-xl p-5">
            <FilterSidebar
              openFilters={openFilters}
              toggleFilter={toggleFilter}
              filterState={filterState}
              setFilterState={setFilterState}
              onClose={() => setMobileFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
