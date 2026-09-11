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

type Product = {
  name: string;
  category: string;
  sku: string;
  finish: string;
  description: string;
  image: string;
  url: string;
};

const products: Product[] = [
  {
    name: "Revival",
    category: '16" Pendant',
    sku: "808-16-47",
    finish: "Brushed Brass",
    description:
      "Traditional lighting reimagined for modern interiors — an enclosed milk glass shade delivers a soft ambient glow over islands, hallways, and baths.",
    image: "/__l5e/assets-v1/d6546f1c-8c03-4248-8876-ddccb639ce39/06_808-16-47_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/808-16-47",
  },
  {
    name: "Livingston",
    category: "2 Light Wall Mount",
    sku: "555-2-47",
    finish: "Brushed Brass",
    description:
      "Estate-inspired design with graceful curved arms and a refined classic silhouette — timeless elegance for foyers, halls, and living rooms.",
    image: "/__l5e/assets-v1/90f495f5-f640-40b3-97ec-3cf244d5e5f7/03_555-2-47_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/555-2-47",
  },
  {
    name: "Dorato",
    category: "36×48 LED Mirror",
    sku: "98-3648-74",
    finish: "Gold Leaf",
    description:
      "A luxury LED mirror framed with a gold-leaf border and sleek black outer edge — a bold contrast that elevates high-end baths and dressing rooms.",
    image: "/__l5e/assets-v1/8fa01eab-1481-4eb9-a42c-b560a1e92429/12_98-3648-74_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/98-3648-74",
  },
  {
    name: "Mavis",
    category: '12" Pendant',
    sku: "835-12-47",
    finish: "Brushed Brass",
    description:
      "Clear ribbed glass paired with oversized circular accents and Brushed Brass detailing — a trending orb silhouette for kitchen islands and transitional interiors.",
    image: "/__l5e/assets-v1/b1be9ad4-d605-411a-b1d9-53b6ef696c98/08_835-12-47_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/835-12-47",
  },
  {
    name: "Sophia",
    category: "1 Light Wall Mount",
    sku: "5216-1-47",
    finish: "Brushed Brass",
    description:
      "A refined silhouette with a sweeping arm and soft ambient glow — classic traditional styling for warm, inviting interiors.",
    image: "/__l5e/assets-v1/7748e759-8155-487a-87b2-78351a22de62/02_5216-1-47_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/5216-1-47",
  },
  {
    name: "Stupa",
    category: '22" 3 Light Pendant',
    sku: "897-22-0847",
    finish: "Studio White / Brushed Brass",
    description:
      "Inspired by global architecture — an oversized dome silhouette with a Studio White exterior and warm Brushed Brass interior for entries and kitchen islands.",
    image: "/__l5e/assets-v1/ce0dd864-fb74-4bae-9a4b-f1aa5d8a0cef/11_897-22-0847_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/897-22-0847",
  },
  {
    name: "Lillet",
    category: "10 Light Chandelier",
    sku: "608-10-47",
    finish: "Brushed Brass",
    description:
      "A Tamara Day design — sculptural curved arms and a floating tulip-inspired silhouette that brings artistic character and dramatic presence to dining and entry rooms.",
    image: "/__l5e/assets-v1/592217bf-b7d2-41ee-9706-30b4569b1f23/04_608-10-47_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/608-10-47",
  },
  {
    name: "Sumner",
    category: '5 Light 36" Pendant',
    sku: "843-5-4659",
    finish: "Natural Brass / Matte Black",
    description:
      "Industrial heritage meets decorative craftsmanship — a distressed brass finish and character-rich frame for interiors with depth.",
    image: "/__l5e/assets-v1/9eb30db9-971b-411a-b3c0-023c64e6aa20/10_843-5-4659_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/843-5-4659",
  },
  {
    name: "Rhodes",
    category: "1 Light Wall Mount",
    sku: "5029-1-47",
    finish: "Brushed Brass",
    description:
      "Round elements paired with subtle ribbed detailing and a classic linen shade — a refined wall mount with a modern-traditional balance.",
    image: "/__l5e/assets-v1/6bda3484-7f97-41be-b1bb-3620b23bbc37/01_5029-1-47_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/5029-1-47",
  },
  {
    name: "Saxony",
    category: "10 Light Chandelier",
    sku: "649-10-80",
    finish: "Aged Brass",
    description:
      "A signature Tamara Day design — a two-tier chandelier defined by mesmerizing zigzag textured glass and refined brass accents.",
    image: "/__l5e/assets-v1/aa86f3c0-c5b3-45e9-96e3-0e662dd31279/05_649-10-80_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/649-10-80",
  },
  {
    name: "Privet",
    category: '35" 6 Light Pendant',
    sku: "8204-8-46",
    finish: "Natural Brass",
    description:
      "Botanical geometry cast in two-tone concave metal — a large-scale sculptural chandelier that brings movement and natural rhythm.",
    image: "/__l5e/assets-v1/22cb5953-d00e-49c5-8188-2fe3364dff29/07_8204-8-46_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/8204-8-46",
  },
  {
    name: "Stewart",
    category: '14" Opal Pendant',
    sku: "836-14-247",
    finish: "Brushed Brass",
    description:
      "An oversized, organic-shaped opal glass pendant — a modern statement piece for kitchen islands, bars, and bedside vignettes.",
    image: "/__l5e/assets-v1/07ad345c-b5ad-4b19-9539-599dbb5ecad3/09_836-14-247_large.jpg",
    url: "https://quoruminternational.com/collections/whats-new/products/836-14-247",
  },
  {
    name: "Genevieve",
    category: "5CCT LED Pendant",
    sku: "990-5947",
    finish: "Matte Black / Brushed Brass",
    description:
      "A refined mixed-metal pendant with integrated 5CCT LED — Matte Black paired with warm Brushed Brass for a tailored, contemporary glow above islands and dining tables.",
    image: "/__l5e/assets-v1/e5ed47cd-6067-4ddb-8fea-fa42096b6538/19_990-5947.jpg",
    url: "https://quoruminternational.com/products/990-5947",
  },
  {
    name: "Virtue",
    category: "34W 5CCT Pendant",
    sku: "3-885-40",
    finish: "Aged Brass",
    description:
      "An Oxygen design featuring a luminous jade diffuser and warm Aged Brass frame — sculptural, atmospheric lighting for entryways and layered modern interiors.",
    image: "/__l5e/assets-v1/95cdeabd-0b44-4a53-8706-519e916f588b/18_3-885-40.jpg",
    url: "https://quoruminternational.com/products/3-885-40",
  },
];

const QuorumNewArrivals = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(products.length);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !isPlaying) return;
    const id = window.setInterval(() => api.scrollNext(), 4000);
    return () => window.clearInterval(id);
  }, [api, isPlaying]);

  return (
    <section className="mx-auto max-w-6xl px-6 sm:px-10 py-16">
      {!hideHeader && (
        <header className="mb-10 sm:mb-14 text-center">
          <p className="font-serif text-garnet text-2xl sm:text-3xl italic tracking-wide mb-2">
            Quorum
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-ink leading-[1.05]">
            New Arrivals
          </h2>
          <div className="mx-auto mt-6 h-px w-16 bg-brass/70" />
        </header>
      )}

      <Carousel
        opts={{ align: "start", loop: true }}
        setApi={setApi}
        className="px-2 sm:px-8"
      >
        <CarouselContent>
          {products.map((p) => (
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
                    alt={`${p.name} ${p.category} in ${p.finish} by Quorum`}
                    loading="lazy"
                    className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-6 py-6">
                  <p className="text-[10px] font-sans tracking-[0.28em] uppercase text-stone mb-2">
                    {p.category}
                  </p>
                  <h3 className="font-serif text-2xl text-ink leading-tight mb-1">
                    {p.name}
                  </h3>
                  <p className="font-sans text-xs text-stone italic mb-4">
                    {p.finish}
                  </p>
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
    </section>
  );
};

export default QuorumNewArrivals;
