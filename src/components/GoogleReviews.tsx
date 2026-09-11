import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/prototype/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


interface Review {
  author: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
  location: string;
}

interface Aggregate {
  rating: number;
  count: number;
  locations: number;
}

const GoogleReviews = () => {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Only mount the network call when the section scrolls near the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    supabase.functions
      .invoke("google-reviews")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }
        setReviews(data?.reviews ?? []);
        setAggregate(data?.aggregate ?? null);
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [inView]);

  return (
    <section ref={sectionRef} className="bg-secondary/15 border-y border-border/50">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground text-center mb-4">
          From Our Utah Showrooms
        </p>
        <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light text-center mb-3">
          What guests are <span className="italic">saying</span>
        </h2>
        <p className="text-center text-muted-foreground text-sm max-w-lg mx-auto mb-10">
          Recent reviews from across our six locations — collected from Google.
        </p>

        {/* Aggregate anchor */}
        {aggregate && (
          <div className="mb-12 sm:mb-16 flex flex-col items-center">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-5xl sm:text-6xl font-light leading-none text-nova-garnet">
                {aggregate.rating.toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5 pb-1">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-4 w-4 ${
                      idx < Math.round(aggregate.rating)
                        ? "fill-accent text-accent"
                        : "text-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground">
              {aggregate.count.toLocaleString()} Google ratings ·{" "}
              {aggregate.locations} Utah showrooms
            </p>
            <div className="mt-6 h-px w-12 bg-nova-brass/60" />
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-muted-foreground">
            Reviews are temporarily unavailable.
          </p>
        )}

        {!error && reviews === null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-56 rounded-lg border border-border/60 bg-background/40 animate-pulse"
              />
            ))}
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <Carousel opts={{ align: "start", loop: true }} className="px-0 sm:px-10">
            <CarouselContent className="-ml-5 sm:-ml-6">
              {reviews.map((r, i) => (
                <CarouselItem key={i} className="pl-5 sm:pl-6 sm:basis-1/2 lg:basis-1/3">
                  <article className="flex h-full flex-col rounded-lg border border-border/60 bg-background p-7 sm:p-8">
                    <div className="flex items-center gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-3.5 w-3.5 ${
                            idx < Math.round(r.rating)
                              ? "fill-accent text-accent"
                              : "text-border"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="font-serif text-[15px] sm:text-base text-foreground leading-relaxed mb-6 line-clamp-6 flex-1">
                      &ldquo;{r.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                      {r.authorPhoto ? (
                        <img
                          src={r.authorPhoto}
                          alt={r.author}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-secondary" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{r.author}</p>
                        <p className="text-[11px] text-muted-foreground tracking-wide">
                          {r.location} · {r.relativeTime}
                        </p>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex border-border text-foreground hover:bg-foreground hover:text-background" />
            <CarouselNext className="hidden sm:flex border-border text-foreground hover:bg-foreground hover:text-background" />
          </Carousel>
        )}


        {reviews && reviews.length > 0 && (
          <p className="text-center text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground/70 mt-12">
            Reviews via Google
          </p>
        )}
      </div>
    </section>
  );
};

export default GoogleReviews;
