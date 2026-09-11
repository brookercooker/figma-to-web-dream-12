import { Link } from "react-router-dom";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalog } from "@/hooks/useAdminCatalog";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const NovaCatalogList = () => {
  const { data: products = [], isLoading, error } = useCatalog();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs currentLabel="Catalog" />
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
            Admin Catalog · public.catalog
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl text-foreground">The Collection</h1>
          <p className="text-sm text-muted-foreground mt-3">
            {isLoading ? "Loading…" : `${products.length} products from the Admin Tools feed.`}
          </p>
        </header>

        {error && (
          <p className="text-sm text-destructive">Couldn't load catalog: {(error as Error).message}</p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products in the catalog yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((p) => (
              <Link to={`/catalog/${encodeURIComponent(p.id)}`} key={p.id} className="group block">
                <div className="relative mb-3 aspect-square overflow-hidden bg-secondary/40 rounded-lg">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <h2 className="text-sm text-foreground line-clamp-2">{p.name}</h2>
                {p.price > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">{fmt(p.price)}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NovaCatalogList;
