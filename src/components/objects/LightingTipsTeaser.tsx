import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

const featured = [
  { id: "0gCWdaU3qFU", title: "The Danish secret to happiness" },
  { id: "8DRo3kmmlQs", title: "Choosing the right ceiling fan" },
  { id: "lPCOlOWe1zo", title: "Warm, eye-level light at home" },
];

/**
 * Lighting Tips Teaser — editorial entry point into the tips library.
 */
const LightingTipsTeaser = () => (
  <section className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-24">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
      <div>
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-3">
          From Our Designers
        </p>
        <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-light text-foreground leading-tight">
          Lighting Tips &amp; <em className="italic">Expertise</em>
        </h2>
      </div>
      <Link
        to="/lighting-tips"
        className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.18em] uppercase text-foreground hover:text-accent transition-colors whitespace-nowrap"
      >
        View All Tips <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
      {featured.map((v) => (
        <Link key={v.id} to="/lighting-tips" className="group block">
          <div className="relative aspect-video overflow-hidden bg-secondary/30 rounded-lg mb-3">
            <img
              src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
              alt={v.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/30 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-11 h-11 rounded-full bg-primary-foreground/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="h-4 w-4 text-foreground fill-foreground ml-0.5" />
              </span>
            </div>
          </div>
          <h3 className="font-serif text-lg font-light text-foreground group-hover:text-accent transition-colors">
            {v.title}
          </h3>
        </Link>
      ))}
    </div>
  </section>
);

export default LightingTipsTeaser;
