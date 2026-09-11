import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, X, ArrowUpRight } from "lucide-react";
import awardShowroomAsset from "@/assets/news-showroom-award.jpg";
import awardsVideoAsset from "@/assets/awards-highlight.mp4.asset.json";
import coraKitchenAsset from "@/assets/news-crashers-kitchen.jpg.asset.json";
import paradeHomesAsset from "@/assets/news-parade-homes.jpg.asset.json";
import stGeorgeAsset from "@/assets/news-st-george-showroom.jpg.asset.json";
const awardShowroom = awardShowroomAsset;

type NewsItem = {
  eyebrow: string;
  dateline: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
  external?: boolean;
  video?: string;
  image?: string;
};

const items: NewsItem[] = [
  {
    eyebrow: "Award",
    dateline: "2026",
    title: "ARTS Awards: Lighting Showroom of the Year",
    blurb: "The industry's highest honor — a retrospective on our craftsmanship.",
    cta: "Watch film",
    href: "#",
    video: awardsVideoAsset.url,
    image: awardShowroom,
  },
  {
    eyebrow: "Feature",
    dateline: "HGTV Crashers",
    title: "Nova lights the Crashers reboot",
    blurb: "When Jonathan Knight crashes a renovation, our fixtures come with him. Tune in to see Nova light the new season of HGTV's Crashers.",
    cta: "Read the announcement",
    href: "https://www.hgtv.com/shows/new-on-hgtv/jonathan-knight-stars-in-hgtv-crashers-reboot",
    external: true,
    image: coraKitchenAsset.url,
  },
  {
    eyebrow: "Event",
    dateline: "Northern Wasatch",
    title: "Northern Wasatch Parade of Homes",
    blurb: "The best way to know a Nova fixture is to stand beneath one. Tour the parade and see them at work in the homes they were made for.",
    cta: "Purchase tickets",
    href: "https://www.northernwasatchparade.com/web/",
    external: true,
    image: paradeHomesAsset.url,
  },
  {
    eyebrow: "Grand Opening",
    dateline: "September 17",
    title: "A new light in St. George",
    blurb: "Join us September 17 for the ribbon-cutting and grand opening of our newest showroom — the full Nova experience arrives in Southern Utah.",
    cta: "Save the date",
    href: "/locations",
    image: stGeorgeAsset.url,
  },
];

const ObjectsNovaNews = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const Card = ({ item, className = "" }: { item: NewsItem; className?: string }) => {
    const isVideo = !!item.video;
    const content = (
      <div className={`group relative h-full flex flex-col bg-background border border-nova-sand hover:border-nova-brass transition-colors overflow-hidden ${className}`}>
        {item.image && (
          <div className="aspect-square overflow-hidden bg-nova-sand">
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-nova-garnet font-bold">
                {item.eyebrow}
            </span>
            <span className="w-1 h-1 rounded-full bg-nova-stone" />
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-nova-stone">
              {item.dateline}
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-foreground font-light leading-snug mb-2">
            {item.title}
          </h3>
          <p className="font-sans text-sm text-nova-stone leading-relaxed">
            {item.blurb}
          </p>
        </div>
          <div className="mt-6 inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.22em] text-foreground font-semibold">
            {isVideo ? <Play className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            <span className="border-b border-nova-brass pb-0.5 group-hover:text-nova-brass transition-colors">
              {item.cta}
            </span>
          </div>
        </div>
      </div>
    );

    if (isVideo) {
      return (
        <button
          onClick={() => setActiveVideo(item.video!)}
          className="text-left h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-brass"
        >
          {content}
        </button>
      );
    }
    if (item.external) {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="h-full block">
          {content}
        </a>
      );
    }
    return (
      <Link to={item.href} className="h-full block">
        {content}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-6xl px-6 sm:px-10 pt-16 pb-20">
        {/* Header */}
        <div className="flex items-baseline justify-between border-b border-nova-sand pb-5 mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-light leading-none">
            Nova <em className="italic text-nova-stone">In the News</em>
          </h1>
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-nova-stone">
            2026
          </span>
        </div>

        {/* Hero rectangle */}
        <button
          onClick={() => setActiveVideo(items[0].video!)}
          className="group relative block w-full aspect-[21/9] overflow-hidden bg-nova-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-brass mb-4 sm:mb-5"
          aria-label="Play ARTS Awards feature video"
        >
          <img
            src={items[0].image}
            alt="Award-winning Nova Lighting showroom interior"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
          <div className="absolute top-5 left-5 sm:top-6 sm:left-6 flex items-center gap-2">
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-primary-foreground font-bold">
              {items[0].eyebrow}
            </span>
            <span className="w-1 h-1 rounded-full bg-primary-foreground/60" />
            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-primary-foreground/80">
              {items[0].dateline}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-primary-foreground/50 flex items-center justify-center backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-primary-foreground/10">
              <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-left">
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl text-primary-foreground font-light leading-tight mb-2 italic max-w-2xl">
              {items[0].title}
            </h3>
            <p className="font-sans text-sm text-primary-foreground/80 leading-relaxed max-w-md">
              {items[0].blurb}
            </p>
          </div>
        </button>

        {/* Three square tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {items.slice(1).map((item, idx) => (
            <Card key={idx} item={item} />
          ))}
        </div>

      </section>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 text-primary-foreground hover:opacity-70 transition-opacity"
            aria-label="Close video"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <video
              src={activeVideo}
              controls
              autoPlay
              className="w-full h-full bg-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectsNovaNews;
