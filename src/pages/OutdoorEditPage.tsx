import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  formatPrice,
  outdoorChapters,
  outdoorHero,
  type OutdoorChapter,
  type OutdoorItem,
} from "@/data/outdoorEdit";

const ProductCard = ({ item }: { item: OutdoorItem }) => (
  <div className="group">
    <Link to={item.href} className="block">
      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-background">
        {item.badge && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-foreground">
            {item.badge}
          </span>
        )}
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} in ${item.finish ?? "its featured finish"} by ${item.brand}`}
            loading="lazy"
            className="h-full w-full object-contain p-5 sm:p-7 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/70 bg-secondary/20">
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground/70">
              Photo coming
            </span>
          </div>
        )}
      </div>
      <p className="mb-1.5 text-[10px] font-sans uppercase tracking-[0.3em] text-muted-foreground">
        {item.brand}
      </p>
      <h3 className="font-serif text-base font-light leading-snug text-foreground sm:text-lg">
        {item.name}
      </h3>
      {item.finish && (
        <p className="mt-1 text-xs text-muted-foreground">{item.finish}</p>
      )}
      <p className="mt-2 text-sm text-foreground">{formatPrice(item.price)}</p>
    </Link>
    <Link
      to={item.href}
      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-sans font-medium uppercase tracking-[0.14em] text-foreground/70 transition-colors hover:text-foreground"
      aria-label={`Shop ${item.name}`}
    >
      Shop <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  </div>
);

const ChapterBlock = ({
  chapter,
  tinted,
}: {
  chapter: OutdoorChapter;
  tinted: boolean;
}) => (
  <section
    id={chapter.id}
    className={tinted ? "bg-secondary/20" : "bg-background"}
  >
    <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        {/* Vertical lifestyle image */}
        <div className="lg:col-span-5">
          <img
            src={chapter.image}
            alt={chapter.imageAlt}
            loading="lazy"
            className="aspect-[3/4] w-full rounded-lg object-cover"
          />
        </div>

        <div className="lg:col-span-7 lg:self-center">
          <p className="mb-3 text-[10px] font-sans uppercase tracking-[0.3em] text-muted-foreground">
            <span className="text-accent">{chapter.index}</span>
            <span className="mx-2 text-border">/</span>
            {chapter.kicker}
          </p>
          <h2 className="font-serif text-[1.75rem] font-light leading-tight text-foreground sm:text-[2.5rem]">
            {chapter.title}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {chapter.copy}
          </p>
          {chapter.caption && (
            <p className="mt-5 border-l border-accent pl-4 font-serif text-base font-light italic text-foreground/80">
              {chapter.caption}
            </p>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-8 sm:mt-14 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {chapter.items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  </section>
);

const OutdoorEditPage = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "The Outdoor Edit · Nova Lighting";

    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "The Outdoor Edit — a curated summer lookbook of outdoor lanterns, sconces, path lights and fans, shoppable by chapter.",
    );

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc !== null) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <>
      <Breadcrumbs />

      {/* Hero */}
      <section className="bg-background">
        <div className="overflow-hidden">
          <img
            src={outdoorHero.image}
            alt={outdoorHero.imageAlt}
            fetchPriority="high"
            className="h-[46vw] max-h-[480px] w-full object-cover object-[center_25%] sm:h-[32vw]"
          />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4 pt-10 sm:px-10 sm:pt-16">
          <p className="mb-4 text-[10px] font-sans uppercase tracking-[0.3em] text-accent">
            {outdoorHero.kicker}
          </p>
          <h1 className="font-serif text-[2.25rem] font-light leading-[1.05] text-foreground sm:text-[3.25rem] md:text-[3.75rem]">
            {outdoorHero.title}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {outdoorHero.copy}
          </p>

          {/* Chapter index */}
          <nav
            aria-label="Chapters"
            className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/60 pt-6 sm:mt-12"
          >
            {outdoorChapters.map((chapter) => (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                className="text-[11px] font-sans uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="text-accent">{chapter.index}</span>
                <span className="mx-2 text-border">/</span>
                {chapter.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Chapters */}
      <div className="mt-10 sm:mt-14">
        {outdoorChapters.map((chapter, index) => (
          <ChapterBlock
            key={chapter.id}
            chapter={chapter}
            tinted={index % 2 === 0}
          />
        ))}
      </div>

      {/* Closing */}
      <section className="border-t border-border/50 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:px-10 sm:py-24">
          <h2 className="font-serif text-[1.75rem] font-light text-foreground sm:text-[2.25rem]">
            Planning an outdoor project?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Bring us a photo of the elevation or the patio. Our consultants will
            size the fixtures, sort out wet versus damp rating, and lay out the
            layers with you.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-foreground px-6 py-3 text-[11px] font-sans font-medium uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-90"
          >
            Talk to a consultant <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default OutdoorEditPage;
