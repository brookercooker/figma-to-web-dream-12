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
  {
    name: "Facet",
    category: "Medium Adjustable LED Accent Light",
    sku: "46983BX",
    finish: "Black Oxide with Heritage Brass accents",
    description:
      "Hexagonal etched glass framed in bold metal — an architectural accent light with quiet edge and generous adjustability.",
    image:
      "/__l5e/assets-v1/30f72ade-be59-4311-b9ce-9efad7fd5f84/20_0558eff724f86da150eac8b0ad62ed02-46983BX_MAIN.jpg",
    url: "https://www.hinkley.com/46983bx.html",
  },
  {
    name: "Stokes",
    category: "Medium Adjustable Accent Light",
    sku: "43012PN",
    finish: "Polished Nickel",
    description:
      "A precise, articulating accent light with a slim cylindrical body — engineered to direct light exactly where a room needs it.",
    image:
      "/__l5e/assets-v1/ccc62d6a-cfb9-4cbc-8e7a-47578d3104cf/23_3b560864343142a0c4c85cba4d2f50b7-43012PN_Stokes_MAIN.jpg",
    url: "https://www.hinkley.com/43012pn.html",
  },
  {
    name: "Helene",
    category: "Medium Three-Light Vanity",
    sku: "57413LCB",
    finish: "Lacquered Brass",
    description:
      "A trio of tailored shades on a lacquered brass rail — a considered vanity bar for bath and powder rooms that reward a longer look.",
    image:
      "/__l5e/assets-v1/3a9398f3-2b1e-4a75-b038-7a0efa061d89/22_325ebfe5c87488da851533dcba6368ff38b32a0d808ef90a9d56db9ac6ab2a8e.jpeg",
    url: "https://www.hinkley.com/57413lcb.html",
  },
  {
    name: "Collins",
    category: "Large Pendant",
    sku: "46894PN",
    finish: "Polished Nickel",
    description:
      "The Collins silhouette scaled up — a substantial faceted-crystal pendant that anchors a dining table or open kitchen with restraint.",
    image:
      "/__l5e/assets-v1/21bc772a-a1a3-4951-8da7-7b2b6498e7d8/27_7910d2f25d43433a52f707dd3b07f9e3-46894PN_Collins_MAIN.jpg",
    url: "https://www.hinkley.com/46894pn.html",
  },
  {
    name: "Howe",
    category: "Small Convertible Sconce",
    sku: "48410LTP-LL",
    finish: "Light Taupe with Heavy Crystal",
    description:
      "Faceted heavy crystal set against a soft taupe frame — a small convertible sconce that reads jewel-like without ever raising its voice.",
    image:
      "/__l5e/assets-v1/8f951b64-57b6-4b43-9d8e-9cd9eaa7bb1e/31_c423293cf02f0988d622ee53636f48c9f792e8d055a9ba75d6818483edd38c82.jpeg",
    url: "https://www.hinkley.com/48410ltp-ll.html",
  },
  {
    name: "Dom",
    category: "Small Adjustable LED Sconce",
    sku: "48490HB-BK",
    finish: "Heritage Brass with Black",
    description:
      "A compact, articulated reading sconce — brass warmth against a matte black arm — designed to swing where the moment calls for light.",
    image:
      "/__l5e/assets-v1/5aded836-cd3f-45a7-bdb9-147af77a7f69/21_20ba77c8ee157581a966a501b4f26241-48490HB-BK_Dom_MAIN.jpg",
    url: "https://www.hinkley.com/48490hb-bk.html",
  },
  {
    name: "Turin",
    category: "Medium Single-Light Sconce",
    sku: "57420LCB",
    finish: "Lacquered Brass",
    description:
      "A slim brass arm carrying a single tailored shade — a wall sconce sized for hallways, bedsides, and quieter corners of a room.",
    image:
      "/__l5e/assets-v1/52954bdb-8e77-4e26-a95e-b87b209af295/25_5561ac66b73abfff501b98ec089bc08ccee2225d73bb613f02305ba98aae9f04.jpeg",
    url: "https://www.hinkley.com/57420lcb.html",
  },
  {
    name: "Arti",
    category: "Medium Adjustable Accent Light",
    sku: "47094PL",
    finish: "Polished Antique Nickel",
    description:
      "Simple, elegant, and adjustable — Arti's medium profile settles quietly into any style, from soft traditional to composed modern.",
    image:
      "/__l5e/assets-v1/dc587bcd-0e22-4828-8d47-eaf5c1a0b4d8/33_e6183b7680cdbb1836a3e873464a6a4a-47094PL_Arti_MAIN.jpg",
    url: "https://www.hinkley.com/47094pl.html",
  },
  {
    name: "Mckenna",
    category: "Medium Single-Light Sconce",
    sku: "57400AN",
    finish: "Antique Nickel",
    description:
      "A quiet, everyday sconce in warm antique nickel — the kind of fixture that flatters a hallway without ever asking for attention.",
    image:
      "/__l5e/assets-v1/6da2151e-c1bb-4dad-9535-119ba85471b5/24_51ac962e2d7cfa3f9fde078e84c966ea012537fc50b20686925c23d5a09bc5ab.jpeg",
    url: "https://www.hinkley.com/57400an.html",
  },
  {
    name: "Elle",
    category: "Medium Single Light Sconce",
    sku: "5045HB",
    finish: "Heritage Brass",
    description:
      "Chevron-cut clear glass refracts light across a slim brass frame — a sconce with a modern edge and a soft, glamorous glow.",
    image:
      "/__l5e/assets-v1/0da85375-ee6b-4670-991b-83b7e4d479a6/28_8114d3516faaa942b7e6e2b08bb531d168dbfab7e6612fb9a7918db6849c5a65.jpeg",
    url: "https://www.hinkley.com/5045hb.html",
  },
  {
    name: "Lottie",
    category: "Medium LED Vanity",
    sku: "57432LCB",
    finish: "Lacquered Brass",
    description:
      "Etched opal holophane glass diffuses integrated LED light into a warm, inviting glow — a considered vanity for bath and powder rooms.",
    image:
      "/__l5e/assets-v1/c9d3b999-81a6-46c0-8a56-83b7b1dac6f9/29_8f6a475077f604249e78d7eddb1e55eacc5cc68f68eee51ca1a540996c989db7.jpeg",
    url: "https://www.hinkley.com/57432lcb.html",
  },
];


const HinkleyNewArrivals = ({ hideHeader = false }: { hideHeader?: boolean }) => {
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
            Hinkley
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
                    alt={`${p.name} ${p.category} in ${p.finish} by Hinkley`}
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

export default HinkleyNewArrivals;
