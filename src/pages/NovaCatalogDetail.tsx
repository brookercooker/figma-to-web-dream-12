import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogProduct } from "@/hooks/useAdminCatalog";
import { useCart } from "@/contexts/CartContext";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const NovaCatalogDetail = () => {
  const { id = "" } = useParams();
  const { data: product, isLoading, error } = useCatalogProduct(id);
  const { add } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12">
          <p className="font-serif text-2xl text-foreground mb-2">Product not found</p>
          {error && <p className="text-sm text-destructive mb-4">{(error as Error).message}</p>}
          <Link to="/catalog" className="text-sm text-link underline-offset-4 hover:underline">
            Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const facts: Array<[string, string]> = [
    product.sku ? ["SKU", product.sku] : null,
    product.category ? ["Category", product.category] : null,
    product.style ? ["Style", product.style] : null,
    product.finishes[0] ? ["Finish", product.finishes[0]] : null,
    product.dimensions.height !== "—" ? ["Height", product.dimensions.height] : null,
    product.dimensions.width !== "—" ? ["Width", product.dimensions.width] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs currentLabel={product.name} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-16">
          <div className="aspect-square bg-secondary/40 rounded-lg flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt={product.name} className="max-h-[85%] max-w-[85%] object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No image</span>
            )}
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
              {product.name}
            </h1>
            {product.price > 0 && (
              <p className="text-xl text-foreground mb-6">{fmt(product.price)}</p>
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">
                {product.description}
              </p>
            )}

            <button
              onClick={() => {
                add({ id: product.id, name: product.name, price: product.price, image: product.image });
                toast.success(`Added to cart — ${product.name}`, {
                  description: "Sandbox cart · no payment will be charged.",
                  action: { label: "View cart", onClick: () => navigate("/cart") },
                });
              }}
              className="w-full sm:w-auto bg-foreground text-background px-8 py-3 text-xs font-sans font-medium tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors mb-8"
            >
              Add to Cart
            </button>

            {facts.length > 0 && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-border pt-6">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">{k}</dt>
                    <dd className="text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovaCatalogDetail;
