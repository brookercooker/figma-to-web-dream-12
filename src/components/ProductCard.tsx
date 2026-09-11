import { Link } from "react-router-dom";
import { Heart, GitCompareArrows, Presentation, Plus } from "lucide-react";
import { Product, finishColors } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="group">
      {/* Image */}
      <div className="relative mb-3 aspect-square overflow-hidden">
        <Link to="/coming-soon">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain p-4 sm:p-6 transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        {/* Wishlist icon */}
        <button
          className="absolute right-2 sm:right-3 top-2 sm:top-3 text-muted-foreground hover:text-foreground transition-colors"
          title="Add to Wishlist"
        >
          <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Details */}
      <Link to="/coming-soon">
        <h3 className="text-xs sm:text-sm font-sans font-normal text-foreground mb-1 line-clamp-2 sm:line-clamp-1">
          {product.name}
        </h3>
      </Link>
      <p className="text-xs sm:text-sm text-foreground mb-2">
        ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>

      {/* Color swatches */}
      <div className="flex gap-1 mb-2">
        {product.finishes.slice(0, 4).map((finish) => (
          <button
            key={finish}
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border border-border"
            style={{ backgroundColor: finishColors[finish] || "#ccc" }}
            title={finish}
          />
        ))}
      </div>

      {/* Actions — compact row */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title="Compare"
        >
          <GitCompareArrows className="h-3 w-3" />
          <span className="hidden sm:inline">Compare</span>
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title="Add to Presentation"
        >
          <Presentation className="h-3 w-3" />
          <span className="hidden sm:inline">Presentation</span>
        </button>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title="Add to Wishlist"
        >
          <Heart className="h-3 w-3" />
          <span className="hidden sm:inline">Wishlist</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
