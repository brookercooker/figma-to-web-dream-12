import { useMemo } from "react";
import { Link } from "react-router-dom";
import { vendorNames, shuffleNames } from "@/data/vendors";

type Brand = { name: string };

const BrandRepresentation = () => {
  const brandLogos = useMemo<Brand[]>(
    () => shuffleNames(vendorNames).map((name) => ({ name })),
    []
  );

  return (
    <section className="bg-background border-y border-border/50">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-8">
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-2">
              Proudly Representing
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-light">
              Over 200 world-class brands
            </h2>
          </div>
          <Link
            to="/full-vendor-list"
            className="text-[11px] font-sans tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Explore all brands
          </Link>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex gap-12 sm:gap-16 items-center w-max"
            style={{ animation: "scroll 260s linear infinite" }}
          >
            {[...brandLogos, ...brandLogos].map((brand, i) => (
              <Link
                key={`${brand.name}-${i}`}
                to="/full-vendor-list"
                className="shrink-0 flex items-center justify-center hover:opacity-60 transition-opacity duration-300"
              >
                <span className="font-serif text-lg sm:text-xl font-semibold text-foreground/80 whitespace-nowrap">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default BrandRepresentation;
