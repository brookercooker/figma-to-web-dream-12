import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, X, ArrowUpRight } from "lucide-react";
import awardShowroomAsset from "@/assets/award-showroom.jpg.asset.json";
import awardsVideoAsset from "@/assets/awards-highlight.mp4.asset.json";
import crashersAsset from "@/assets/news-crashers-kitchen.jpg.asset.json";
import paradeAsset from "@/assets/news-parade-homes.jpg.asset.json";
import stGeorgeAsset from "@/assets/news-st-george-showroom.jpg.asset.json";

type Item = {
  index: string;
  eyebrow: string;
  dateline: string;
  title: string;
  blurb: string;
  cta: string;
  image: string;
  href?: string;
  external?: boolean;
  video?: string;
};

const items: Item[] = [
  {
    index: "01",
    eyebrow: "Award",
    dateline: "2026",
    title: "ARTS Awards: Lighting Showroom of the Year",
    blurb:
      "The industry's highest honor, awarded in New York. A short film on the work behind it.",
    cta: "Watch the film",
    image: awardShowroomAsset.url,
    video: awardsVideoAsset.url,
  },
  {
    index: "02",
    eyebrow: "Television",
    dateline: "HGTV · Crashers",
    title: "Nova lights the Crashers reboot",
    blurb:
      "When a renovation gets crashed, our fixtures come along. Watch for them all season.",
    cta: "Read the announcement",
    image: crashersAsset.url,
    href: "https://www.hgtv.com/shows/new-on-hgtv/jonathan-knight-stars-in-hgtv-crashers-reboot",
    external: true,
  },
  {
    index: "03",
    eyebrow: "Event",
    dateline: "Aug 7 — 22",
    title: "Northern Wasatch Parade of Homes",
    blurb:
      "The best way to know a fixture is to stand beneath one. Tour the parade and see ours at work.",
    cta: "Purchase tickets",
    image: paradeAsset.url,
    href: "https://www.northernwasatchparade.com/web/",
    external: true,
  },
  {
    index: "04",
    eyebrow: "Grand Opening",
    dateline: "September 17",
    title: "A new light in St. George",
    blurb:
      "Ribbon-cutting for our newest showroom. The full Nova experience arrives in Southern Utah.",
    cta: "Save the date",
    image: stGeorgeAsset.url,
    href: "/locations",
  },
];

const InTheNews = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [feature, ...rest] = items;

  const Wrap = ({ item, children }: { item: Item; children: React.ReactNode }) => {
    if (item.video) {
      return (
        <button
          type="button"
          onClick={() => setActiveVideo(item.video!)}
          className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-brass"
        >
          {children}
        </button>
      );
    }
    if (item.external) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-brass"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        to={item.href ?? "#"}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-brass"
      >
        {children}
      </Link>
    );
  };

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 py-16 sm:py-24">
        {/* Masthead */}
        <div className="border-b border-nova-sand pb-6 mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-nova-brass" />
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-nova-stone">
              Current Highlights
            </p>
          </div>
          <div className="flex items-baseline justify-between flex-wrap gap-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight text-foreground">
              <strong className="font-semibold">Nova</strong>{" "}
              <span className="italic font-light text-nova-stone">In the News</span>
            </h2>
            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-nova-stone">
              2026
            </p>
          </div>

        </div>

        {/* Feature */}
        <Wrap item={feature}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            <div className="lg:col-span-7 relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-nova-sand">
              <img
                src={feature.image}
                alt="Award-winning Nova Lighting showroom interior"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-primary-foreground/60 flex items-center justify-center backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-primary-foreground/10">
                  <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                </span>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-5">
                <span className="font-sans text-sm font-semibold text-nova-garnet leading-none">
                  {feature.index}
                </span>
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-nova-garnet font-semibold">
                  {feature.eyebrow} &bull; {feature.dateline}
                </span>
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl font-light leading-tight text-foreground mb-6">
                {feature.title}
              </h3>
              <p className="font-sans text-sm sm:text-base text-nova-stone leading-relaxed max-w-md mb-8">
                {feature.blurb}
              </p>
              <span className="inline-flex w-fit items-center gap-3 font-sans text-[10px] uppercase tracking-[0.2em] text-foreground font-bold border-b border-foreground pb-1 group-hover:border-nova-brass group-hover:text-nova-brass transition-colors">
                <Play className="h-2.5 w-2.5 fill-current" />
                {feature.cta}
              </span>
            </div>

          </div>
        </Wrap>

        {/* Three highlights */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
          {rest.map((item) => (
            <Wrap key={item.index} item={item}>
              <article className="flex flex-col h-full">
                <div className="aspect-[4/5] overflow-hidden bg-nova-sand mb-8">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-nova-garnet font-semibold mb-3">
                  {item.index} {item.eyebrow}
                </p>
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-nova-stone mb-3">
                  {item.dateline}
                </p>
                <h3 className="font-serif text-xl lg:text-2xl font-light leading-snug text-foreground mb-3 group-hover:text-nova-brass transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-sm text-nova-stone leading-relaxed mb-6">
                  {item.blurb}
                </p>
                <span className="mt-auto inline-flex w-fit items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-foreground font-bold border-b border-foreground pb-1 group-hover:border-nova-brass group-hover:text-nova-brass transition-colors">
                  <ArrowUpRight className="h-3 w-3" />
                  {item.cta}
                </span>
              </article>

            </Wrap>
          ))}
        </div>
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <button
            type="button"
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 text-primary-foreground hover:opacity-70 transition-opacity"
            aria-label="Close video"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <video src={activeVideo} controls autoPlay className="w-full h-full bg-foreground" />
          </div>
        </div>
      )}
    </section>
  );
};

export default InTheNews;
