import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type FeaturedProduct = {
  name: string;
  category: string;
  sku: string;
  finish: string;
  description: string;
  image: string;
  url: string;
};

export type FeaturedBrandData = {
  name: string;
  tagline: string;
  monthLabel?: string; // e.g. "Oct — 2026"
  products: FeaturedProduct[];
};

const HINKLEY_PRODUCTS: FeaturedProduct[] = [
  {
    name: "Arden",
    category: "Large Pendant",
    sku: "45057HB",
    finish: "Heritage Brass",
    description:
      "A tailored drum shade wrapped in pleated faux leather, softened by etched glass and warmed by a Heritage Brass finish.",
    image:
      "/__l5e/assets-v1/146f87c7-f939-499d-90a8-a95df3370633/30_b504d4d5eed8956750bcd46d7dbf66ea-45057HB_MAIN.jpg",
    url: "https://www.hinkley.com/45057hb.html",
  },
  {
    name: "Marcel",
    category: "Medium Wall Mount Lantern",
    sku: "26594HB-LL",
    finish: "Heritage Brass",
    description:
      "Heavy crystal with chamfered edges refracts light through a refined lantern silhouette — quietly modern, quietly luminous.",
    image:
      "/__l5e/assets-v1/3f42ff4e-73da-410b-bef2-b3ea2cb2fe68/26_5abced48e746b849c9b13f68fe37c532-26594HB-LL_MAIN.jpg",
    url: "https://www.hinkley.com/26594hb-ll.html",
  },
  {
    name: "Bowie",
    category: "Small Two-Light Vanity",
    sku: "54562LCB-BK",
    finish: "Lacquered Brass with Black accents",
    description:
      "Etched opal globes float on a slender frame — a transitional vanity that reads equally at home in traditional and modern rooms.",
    image:
      "/__l5e/assets-v1/396171c4-6f2b-424c-bc1f-2432f59b508f/32_d3bbddf05a1ef2655c8949a643e32cee-54562LCB-BK_MAIN.jpg",
    url: "https://www.hinkley.com/54562lcb-bk.html",
  },
];

export const HINKLEY_BRAND: FeaturedBrandData = {
  name: "Hinkley",
  tagline: "A Curation of Modern Heritage",
  monthLabel: `${new Date().toLocaleString("en-US", { month: "short" })} — ${new Date().getFullYear()}`,
  products: HINKLEY_PRODUCTS,
};

/**
 * Generic "Featured Brand of the Month" object.
 * Consolidates the old FeaturedBrandQuorum / HinkleyNewArrivals / QuorumNewArrivals
 * into a single reusable component.
 */
const FeaturedBrand = ({ brand = HINKLEY_BRAND }: { brand?: FeaturedBrandData }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(brand.products.length);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); api.off("reInit", onSelect); };
  }, [api]);

  useEffect(() => {
    if (!api || !isPlaying) return;
    const id = window.setInterval(() => api.scrollNext(), 4000);
    return () => window.clearInterval(id);
  }, [api, isPlaying]);

  return (
    <section className="bg-sand/20 border-y border-sand">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-20 sm:pt-28 pb-8">
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="flex items-center gap-4">
            <span className="h-px w-8 bg-brass" />
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-garnet font-semibold">
              Featured Brand of the Month
            </p>
            <span className="h-px w-8 bg-brass" />
          </div>

          <div className="relative flex flex-col items-center">
            {brand.monthLabel && (
              <p className="absolute -left-20 top-1/2 -translate-y-1/2 hidden md:block font-sans text-[9px] uppercase tracking-[0.3em] text-brass [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
                {brand.monthLabel}
              </p>
            )}
            <h2 className="font-serif text-7xl md:text-8xl text-ink leading-[0.8] font-light tracking-tight">
              {brand.name}
            </h2>
            <p className="mt-4 font-serif italic text-lg text-ink/80">{brand.tagline}</p>
          </div>

          <div className="pt-2">
            <span className="block w-1.5 h-1.5 rounded-full bg-garnet" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 sm:px-10 pb-16">
        <Carousel opts={{ align: "start", loop: true }} setApi={setApi} className="px-2 sm:px-8">
          <CarouselContent>
            {brand.products.map((p) => (
              <CarouselItem key={p.sku} className="sm:basis-1/2 lg:basis-1/3">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-cream border border-sand rounded-sm overflow-hidden h-full"
                >
                  <div className="aspect-[4/5] bg-sand/30 overflow-hidden">
                    <img
                      src={p.image}
                      alt={`${p.name} ${p.category} in ${p.finish} by ${brand.name}`}
                      loading="lazy"
                      className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="px-6 py-6">
                    <p className="text-[10px] font-sans tracking-[0.28em] uppercase text-stone mb-2">
                      {p.category}
                    </p>
                    <h3 className="font-serif text-2xl text-ink leading-tight mb-1">{p.name}</h3>
                    <p className="font-sans text-xs text-stone italic mb-4">{p.finish}</p>
                    <p className="font-sans text-sm font-light text-ink/75 leading-relaxed mb-5">
                      {p.description}
                    </p>
                    <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-ink/70">
                      SKU · {p.sku}
                    </p>
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex border-brass/50 text-ink hover:bg-ink hover:text-cream" />
          <CarouselNext className="hidden sm:flex border-brass/50 text-ink hover:bg-ink hover:text-cream" />
        </Carousel>

        <div className="mt-8 flex items-center justify-end gap-3 px-2 sm:px-8">
          <span className="font-sans text-xs tracking-[0.22em] uppercase text-ink/80 tabular-nums">
            {current + 1} / {count}
          </span>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
            aria-pressed={!isPlaying}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/70 text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" strokeWidth={2} fill="currentColor" />
            ) : (
              <Play className="h-3.5 w-3.5 translate-x-[1px]" strokeWidth={2} fill="currentColor" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBrand;
