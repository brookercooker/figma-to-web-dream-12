import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { finishColors } from "@/data/products";
import { useCatalog, useCatalogProduct } from "@/hooks/useAdminCatalog";
import { useCart } from "@/contexts/CartContext";
import noResultsDetective from "@/assets/no-results-detective.png";

const ProductDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: catalog = [] } = useCatalog();
  const { data: product, isLoading } = useCatalogProduct(id);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  if (!product) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 flex flex-col items-center text-center">
          <div className="max-w-md flex flex-col items-center">
            <img
              src={noResultsDetective}
              alt="Detective with magnifying glass"
              loading="lazy"
              width={768}
              height={768}
              className="h-40 w-40 object-contain mb-4"
            />
            <p className="font-serif text-2xl text-foreground mb-2">Hmmm... I got nothin'</p>
            <Link to="/catalog" className="text-sm text-link underline-offset-4 hover:underline">
              Browse the catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const relatedProducts = catalog.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs currentLabel={product.name} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 sm:mb-16">
          <div className="relative aspect-square flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[80%] max-w-[80%] object-contain"
            />
            <button className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-foreground mb-2">{product.name}</h1>
            <p className="text-lg sm:text-xl text-foreground mb-4 sm:mb-6">
              ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Dimensions</h3>
              <p className="text-sm text-muted-foreground">Height: {product.dimensions.height}</p>
              <p className="text-sm text-muted-foreground">Width: {product.dimensions.width}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">Product Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {product.finishes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">Finish</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.finishes[0]}</p>
                <div className="flex gap-2">
                  {product.finishes.map((f) => (
                    <button
                      key={f}
                      className="h-7 w-7 rounded-full border-2 border-border hover:border-foreground transition-colors"
                      style={{ backgroundColor: finishColors[f] || "#ccc" }}
                      title={f}
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
              {product.inStock} in stock and ready to ship
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
              <div className="flex items-center border border-border self-start">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm text-foreground">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  add(
                    { id: product.id, name: product.name, price: product.price, image: product.image },
                    qty,
                  );
                  toast.success(`Added to cart — ${product.name}${qty > 1 ? ` × ${qty}` : ""}`, {
                    description: "Sandbox cart · no payment will be charged.",
                    action: { label: "View cart", onClick: () => navigate("/cart") },
                  });
                }}
                className="flex-1 bg-foreground text-background py-3 text-xs font-sans font-medium tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <h2 className="font-serif text-xl sm:text-2xl text-foreground mb-4 sm:mb-6">You may also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-12 sm:mb-16">
          <h2 className="font-serif text-xl sm:text-2xl text-foreground mb-4">Product Details</h2>
          <div className="flex gap-4 sm:gap-6 border-b border-border mb-6 overflow-x-auto">
            {["description", "specifications", "warranty"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-sans capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-2 border-foreground text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "description" ? "Full Description" : tab === "specifications" ? "Specifications" : "Warranty"}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{product.description}</p>
          )}

          {activeTab === "specifications" && (
            <div className="text-sm text-muted-foreground space-y-2">
              {product.sku && <p>SKU: {product.sku}</p>}
              <p>Height: {product.dimensions.height}</p>
              <p>Width: {product.dimensions.width}</p>
              {product.finishes.length > 0 && <p>Finish: {product.finishes.join(", ")}</p>}
              {product.style && <p>Style: {product.style}</p>}
            </div>
          )}

          {activeTab === "warranty" && (
            <p className="text-sm text-muted-foreground">
              Warranty information is provided by the manufacturer. Contact us for details.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
