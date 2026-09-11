import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import HeroMedia from "@/components/HeroMedia";
import editorialOutdoorAsset from "@/assets/outdoor-porch-lanterns.jpeg.asset.json";
const editorialOutdoor = editorialOutdoorAsset.url;
import cardDesignServices from "@/assets/card-design-services.jpg";
import HinkleyNewArrivals from "@/components/objects/HinkleyNewArrivals";
import TeamPreview from "@/components/TeamPreview";
import GoogleReviews from "@/components/GoogleReviews";
import BrandRepresentation from "@/components/objects/BrandRepresentation";
import CurrentEvents from "@/components/objects/CurrentEvents";
import Categories from "@/components/objects/Categories";
import LocationsTeaser from "@/components/objects/LocationsTeaser";
import RecentProjects from "@/components/objects/RecentProjects";
import YouMayLike from "@/components/objects/YouMayLike";

import MailchimpForm from "@/components/objects/MailchimpForm";


import roomLivingAsset from "@/assets/gallery-living.jpg.asset.json";
const roomLiving = roomLivingAsset.url;



/* ────────── Component ────────── */

const Index = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">

      {/* ━━━ Hero ━━━ */}
      <section className="relative h-[75vh] sm:h-[82vh] md:h-[92vh] overflow-hidden">
        <HeroMedia alt="Elegant living room with designer chandelier" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/55 via-foreground/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-20 lg:px-28 pb-14 md:pb-24">
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-light text-primary-foreground leading-[0.92] mb-5">
            Light
            <br />
            <span className="italic">transforms</span>
            <br />
            everything.
          </h1>
          <p className="text-primary-foreground/65 text-sm sm:text-[15px] max-w-md mb-8 leading-relaxed font-light">
            Designer lighting, chosen for the way you actually live.
          </p>
          <a
            href="#explore"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-block self-start bg-primary-foreground px-10 py-3.5 text-[11px] font-sans font-medium tracking-[0.25em] text-foreground uppercase hover:bg-primary-foreground/90 transition-colors"
          >
            See What's Possible
          </a>
        </div>
      </section>

      {/* ━━━ Categories ━━━ */}
      <div className="scroll-mt-24">
        <Categories />
      </div>

      {/* ━━━ New and Now ━━━ */}
      <YouMayLike />


      {/* ━━━ Outdoor Lighting — full-width editorial ━━━ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
          <img
            src={editorialOutdoor}
            alt="Outdoor lighting on a Mediterranean patio"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center px-8 sm:px-14 md:px-20 py-14 sm:py-20 bg-background">
          <div className="max-w-md">
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
              The Summer Edit
            </p>
            <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] font-light text-foreground leading-snug mb-4">
              Refresh Your <em className="italic">Outdoor Oasis</em>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Longer evenings call for softer light. Reimagine patios, gardens, and entryways with pieces made to glow well past sundown.
            </p>
            <Link
              to="/outdoor-oasis"
              className="inline-block bg-foreground text-primary-foreground px-9 py-3 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors"
            >
              Shop the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ New Arrivals — Hinkley ━━━ */}
      <HinkleyNewArrivals />



      {/* ━━━ Two feature cards (VC-style side by side) ━━━ */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Lighting Design */}
          <Link to="/contact" className="group relative aspect-[16/9] overflow-hidden rounded-lg">
            <img
              src={cardDesignServices}
              alt="Home plans and lighting design on a desk"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/10" />
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
              <h3 className="font-serif text-xl sm:text-2xl text-primary-foreground font-light mb-1">
                Lighting Design Services
              </h3>
              <p className="text-primary-foreground/70 text-xs sm:text-sm font-light max-w-xs mb-3">
                Work one-on-one with our expert designers to create a custom lighting plan tailored to your home — complimentary with any project.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sans tracking-[0.14em] uppercase text-primary-foreground/50 group-hover:text-primary-foreground transition-colors">
                Book a Consultation <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
          {/* Inspiration Galleries */}
          <Link to="/inspiration-gallery" className="group relative aspect-[16/9] overflow-hidden rounded-lg">
            <img
              src={roomLiving}
              alt="Softly lit living room with layered lighting"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/10" />
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
              <h3 className="font-serif text-xl sm:text-2xl text-primary-foreground font-light mb-1">
                Inspiration by Room
              </h3>
              <p className="text-primary-foreground/70 text-xs sm:text-sm font-light max-w-xs mb-3">
                Browse curated rooms from real Utah homes — a starting point for lighting spaces you'll actually live in.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-sans tracking-[0.14em] uppercase text-primary-foreground/50 group-hover:text-primary-foreground transition-colors">
                Explore Galleries <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </section>
      {/* ━━━ Meet the Team (teaser) — sits with Design Services ━━━ */}
      <TeamPreview />

      {/* ━━━ Trade & Builder path ━━━ */}
      <section className="bg-nova-sand/50 border-y border-border/50">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-14 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-nova-stone mb-4">
                Builders, Designers &amp; Trade
              </p>
              <h2 className="font-serif text-[1.75rem] sm:text-[2.25rem] font-light text-nova-ink leading-snug mb-3">
                A dedicated line for <em className="italic">the trade</em>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Whole-home packages, spec support, and pricing built for volume — handled by a consultant who knows your plans.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:shrink-0">
              <Link
                to="/contact-us-trade-account"
                className="inline-block bg-foreground text-primary-foreground px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors"
              >
                Open a Trade Account
              </Link>
              <Link
                to="/contact"
                className="inline-block border border-nova-ink/20 text-nova-ink px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:border-nova-ink/50 transition-colors"
              >
                Talk to a Consultant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Nova in the News (Rotating) ━━━ */}
      <CurrentEvents />

      {/* ━━━ Recent Projects ━━━ */}
      <div id="explore" className="scroll-mt-24">
        <RecentProjects />
      </div>


      {/* ━━━ Locations teaser ━━━ */}
      <LocationsTeaser />


      {/* ━━━ Our Brands ━━━ */}
      <BrandRepresentation />

      {/* ━━━ Google Reviews ━━━ */}
      <GoogleReviews />

      {/* ━━━ Newsletter ━━━ */}
      <MailchimpForm tags={["Newsletter", "Homepage"]} />

      {/* ━━━ Showroom CTA ━━━ */}
      <section className="relative overflow-hidden bg-foreground py-24 sm:py-36">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full border border-primary-foreground/30 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full border border-primary-foreground/20 translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full border border-primary-foreground/25 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-center">
            {/* Stats column */}
            <div className="md:col-span-4 flex flex-col items-center md:items-end gap-10 md:pr-8">
              <div className="text-center md:text-right">
                <span className="block font-serif text-6xl sm:text-7xl font-light text-primary-foreground leading-none mb-1">70+</span>
                <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-primary-foreground/50">Years</span>
              </div>
              <div className="text-center md:text-right">
                <span className="block font-serif text-6xl sm:text-7xl font-light text-primary-foreground leading-none mb-1">6</span>
                <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-primary-foreground/50">Locations</span>
              </div>
              <div className="text-center md:text-right">
                <span className="block font-serif text-6xl sm:text-7xl font-light text-primary-foreground leading-none mb-1">200+</span>
                <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-primary-foreground/50">Brands</span>
              </div>
            </div>

            {/* Text column */}
            <div className="md:col-span-8 text-center md:text-left md:pl-8 md:border-l md:border-primary-foreground/10">
              <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-primary-foreground/40 mb-5">Since 1952</p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-light text-primary-foreground leading-[1.1] mb-6">
                Lighting homes
                <br />
                <span className="italic">beautifully.</span>
              </h2>
              <p className="text-primary-foreground/50 text-sm sm:text-[15px] leading-relaxed mb-10 max-w-lg">
                We started in 1952 as Hansen Lighting, a single Utah storefront. Seventy years later we are still doing the same work: choosing fixtures worth living with, and sitting down with the people who will live under them. Six showrooms, more than 200 brands, and a consultant on hand at every one.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Link
                  to="/locations"
                  className="inline-block bg-primary-foreground text-foreground px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-primary-foreground/90 transition-colors"
                >
                  Find a Location
                </Link>
                <Link
                  to="/contact"
                  className="inline-block border border-primary-foreground/25 text-primary-foreground px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:border-primary-foreground/50 transition-colors"
                >
                  Book a Consultation
                </Link>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Video Lightbox ━━━ */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-[90vw] max-w-4xl aspect-video animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
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
    </div>
  );
};

export default Index;
