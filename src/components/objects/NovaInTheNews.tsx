import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, X } from "lucide-react";
import awardShowroomAsset from "@/assets/news-editorial.jpg.asset.json";
const awardShowroom = awardShowroomAsset.url;

const NovaInTheNews = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const items: Array<{
    eyebrow: string;
    dateline: string;
    title: string;
    cta: string;
    onClick?: () => void;
    href?: string;
    external?: boolean;
  }> = [
    {
      eyebrow: "Award Winner",
      dateline: "2026",
      title: "ARTS Awards: Lighting Manufacturer of the Year",
      cta: "View Acceptance Film",
      onClick: () => setActiveVideo("_aCSRey6Jkk"),
    },
    {
      eyebrow: "Featured Collection",
      dateline: "HGTV Rock the Block · S6",
      title: "The Cora Feature",
      cta: "Explore the Collection",
      href: "/coming-soon",

    },
    {
      eyebrow: "Parade of Homes",
      dateline: "Aug 7 — 22, 2026",
      title: "See our work in the Northern Wasatch Parade of Homes",
      cta: "Plan Your Tour",
      href: "/locations",
    },
    {
      eyebrow: "Grand Opening",
      dateline: "Spring 2026",
      title: "Join us for the opening of our St. George showroom",
      cta: "Reserve Your Invitation",
      href: "/locations",
    },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 pt-16 sm:pt-20 pb-16 sm:pb-20">
        <div className="flex items-end justify-between mb-10 sm:mb-12 flex-wrap gap-4">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-[0.95] tracking-tight font-light">
            Nova <span className="italic text-nova-stone">In the News</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-px w-10 bg-nova-brass" />
            <p className="font-sans text-nova-stone text-[10px] uppercase tracking-[0.3em]">
              Excellence &amp; Happenings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6">
            <button
              onClick={() => setActiveVideo("_aCSRey6Jkk")}
              className="group block w-full aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] overflow-hidden bg-nova-sand relative focus:outline-none focus-visible:ring-2 focus-visible:ring-nova-brass"
              aria-label="Play ARTS Awards feature video"
            >
              <img
                src={awardShowroom}
                alt="Warm editorial interior with brass chandelier"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                width={1600}
                height={2000}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-foreground/10" />
              <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border border-primary-foreground/50 flex items-center justify-center backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-primary-foreground/10">
                  <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                </div>
                <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-primary-foreground font-semibold">
                  Watch the Film
                </span>
              </div>
            </button>
          </div>

          <ul className="lg:col-span-6 flex flex-col divide-y divide-nova-sand">
            {items.map((item, idx) => {
              const content = (
                <div className="group flex items-baseline justify-between gap-6 py-5 first:pt-0 last:pb-0 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-sans text-[10px] uppercase tracking-widest text-nova-garnet font-bold">
                        {item.eyebrow}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-nova-stone" />
                      <span className="font-sans text-[10px] uppercase tracking-widest text-nova-stone">
                        {item.dateline}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl text-foreground leading-snug font-light group-hover:text-nova-brass transition-colors">
                      {item.title}
                    </h3>
                    <span className="mt-2 inline-block font-sans text-[10px] uppercase tracking-[0.2em] text-nova-stone group-hover:text-nova-brass transition-colors">
                      {item.cta} &nbsp;→
                    </span>
                  </div>
                </div>
              );
              if (item.onClick) {
                return (
                  <li key={idx}>
                    <button onClick={item.onClick} className="w-full text-left">
                      {content}
                    </button>
                  </li>
                );
              }
              return (
                <li key={idx}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
                      {content}
                    </a>
                  ) : (
                    <Link to={item.href!} className="block">
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <div className="relative w-[90vw] max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-10 right-0 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Close video"
            >
              <X className="h-6 w-6" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="Video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default NovaInTheNews;
