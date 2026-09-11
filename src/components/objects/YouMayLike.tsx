import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { featuredProducts } from "@/data/featuredProducts";

const YouMayLike = () => {
  return (
    <section className="border-y border-border/50 bg-background">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light">
            New and Now
          </h2>
          <Link
            to="/new-and-now"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-sans font-medium tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-14">
          {featuredProducts.map((product) => (
            <Link key={product.id} to={product.href} className="group block">
              <div className="mb-4 aspect-square overflow-hidden bg-background">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-5 sm:p-7 transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground mb-1.5">
                {product.brand}
              </p>
              <h3 className="font-serif text-base sm:text-lg font-light text-foreground leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{product.finish}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouMayLike;
