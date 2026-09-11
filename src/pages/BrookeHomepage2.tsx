import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import heroAsset from "@/assets/hero-living-room.jpg.asset.json";
const heroImg = heroAsset.url;
import editorialOutdoorAsset from "@/assets/outdoor-porch-lanterns.jpeg.asset.json";
const editorialOutdoor = editorialOutdoorAsset.url;
import editorialPendant from "@/assets/editorial-pendant-closeup.jpg";

import TeamPreview from "@/components/TeamPreview";
import ProductCard from "@/components/ProductCard";
import GoogleReviews from "@/components/GoogleReviews";
import ObjectsOurBrands from "@/pages/ObjectsOurBrands";
import ObjectsNovaNews from "@/pages/ObjectsNovaNews";
import DesignServicesCard from "@/components/objects/DesignServicesCard";
import FeaturedBrandQuorum from "@/components/objects/FeaturedBrandQuorum";
import { products } from "@/data/products";

import chandelierImg from "@/assets/chandelier-product.png";
import categoryTableLamp from "@/assets/category-table-lamp.jpg";
import categoryFloorLamp from "@/assets/category-floor-lamp.jpg";
import categoryFans from "@/assets/category-fans.jpg";

import roomKitchenAsset from "@/assets/gallery-kitchen.jpg.asset.json";
import roomDiningAsset from "@/assets/gallery-dining.jpg.asset.json";
import roomBedroomAsset from "@/assets/gallery-bedroom.jpg.asset.json";
import roomLivingAsset from "@/assets/gallery-living.jpg.asset.json";
import roomBathroomAsset from "@/assets/gallery-bathroom.jpg.asset.json";
import roomOutdoorAsset from "@/assets/gallery-outdoor.jpg.asset.json";
const roomKitchen = roomKitchenAsset.url;
const roomDining = roomDiningAsset.url;
const roomBedroom = roomBedroomAsset.url;
const roomLiving = roomLivingAsset.url;
const roomOutdoor = roomOutdoorAsset.url;
const roomBathroom = roomBathroomAsset.url;

const newIntroductions = [
  { name: "Ceiling", img: chandelierImg, path: "/ceiling-lighting" },
  { name: "Outdoor", img: editorialOutdoor, path: "/outdoor" },
  { name: "Lamps", img: categoryTableLamp, path: "/lamps" },
];

const inspirationGalleries = [
  { name: "Kitchen Gallery", img: roomKitchen, path: "/room/kitchen" },
  { name: "Bathroom Gallery", img: roomBathroom, path: "/room/bathroom" },
  { name: "Dining Room Gallery", img: roomDining, path: "/room/dining-room" },
  { name: "Living Room Gallery", img: roomLiving, path: "/room/living-room" },
  { name: "Bedroom Gallery", img: roomBedroom, path: "/room/bedroom" },
  { name: "Outdoor Gallery", img: roomOutdoor, path: "/room/outdoor" },
];

const SectionHeading = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={`font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light text-center ${className}`}
  >
    {children}
  </h2>
);

const BrookeHomepage2 = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* ━━━ Hero ━━━ */}
      <section className="relative h-[75vh] sm:h-[82vh] md:h-[92vh] overflow-hidden">
        <img
          src={heroImg}
          alt="Elegant living room with designer chandelier"
          className="h-full w-full object-cover"
        />
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
            Curated designer lighting from over 200 brands. Six locations across Utah. Lighting homes beautifully since 1952.
          </p>
          <Link
            to="/ceiling-lighting/chandeliers"
            className="inline-block self-start bg-primary-foreground px-10 py-3.5 text-[11px] font-sans font-medium tracking-[0.25em] text-foreground uppercase hover:bg-primary-foreground/90 transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* ━━━ Featured Products ━━━ */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
          <div className="flex items-end justify-between mb-10 sm:mb-14">
            <SectionHeading className="!text-left">Handpicked by Our Designers</SectionHeading>
            <Link
              to="/ceiling-lighting"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-sans font-medium tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Google Reviews ━━━ */}
      <GoogleReviews />

      {/* ━━━ Featured Brand of the Month ━━━ */}
      <FeaturedBrandQuorum />


      {/* ━━━ Fresh from the Showroom Floor ━━━ */}
      <section className="bg-secondary/20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <h3 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light mb-4">
                Fresh from the Showroom Floor
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-7 max-w-sm">
                Hand-selected by our design team — lighting Utah's homes for over 75 years — these just-arrived pieces reflect the trends shaping today's most beautiful homes.
              </p>
              <Link
                to="/ceiling-lighting"
                className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.18em] uppercase text-foreground hover:text-accent transition-colors"
              >
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {newIntroductions.map((item) => (
                <Link key={item.name} to={item.path} className="group text-center">
                  <div className="aspect-[3/4] bg-background overflow-hidden mb-2.5 rounded-lg">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <span className="text-xs font-sans text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

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
              to="/outdoor"
              className="inline-block bg-foreground text-primary-foreground px-9 py-3 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors"
            >
              Shop the Edit
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ Inspiration Galleries ━━━ */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-28">
        <SectionHeading className="mb-12 sm:mb-16">
          Inspiration Galleries
        </SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {inspirationGalleries.map((room) => (
            <Link key={room.name} to={room.path} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                <img
                  src={room.img}
                  alt={room.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                  <h3 className="font-serif text-base sm:text-lg text-primary-foreground font-light">
                    {room.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8 sm:mt-10">
          <Link
            to="/room"
            className="inline-flex items-center gap-2 text-[11px] font-sans font-medium tracking-[0.16em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            View All Rooms <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ━━━ Design Services Card ━━━ */}
      <section className="bg-secondary/20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <DesignServicesCard variant="horizontal" />
        </div>
      </section>

      {/* ━━━ Meet the Team ━━━ */}
      <TeamPreview />

      {/* ━━━ In the News ━━━ */}
      <ObjectsNovaNews />



      {/* ━━━ Showroom CTA ━━━ */}
      <section className="relative overflow-hidden bg-foreground py-24 sm:py-36">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full border border-primary-foreground/30 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full border border-primary-foreground/20 translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full border border-primary-foreground/25 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-center">
            <div className="md:col-span-4 flex flex-col items-center md:items-end gap-10 md:pr-8">
              <div className="text-center md:text-right">
                <span className="block font-serif text-6xl sm:text-7xl font-light text-primary-foreground leading-none mb-1">75</span>
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
            <div className="md:col-span-8 text-center md:text-left md:pl-8 md:border-l md:border-primary-foreground/10">
              <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-primary-foreground/40 mb-5">Since 1952</p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-light text-primary-foreground leading-[1.1] mb-6">
                Lighting homes
                <br />
                <span className="italic">beautifully.</span>
              </h2>
              <p className="text-primary-foreground/50 text-sm sm:text-[15px] leading-relaxed mb-10 max-w-lg">
                Founded in 1952 as Hansen Lighting, Nova has grown into one of the most trusted names in residential lighting — with six showrooms across Utah and a design team passionate about helping you find the perfect light.
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

      {/* ━━━ Our Brands ━━━ */}
      <ObjectsOurBrands />

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

export default BrookeHomepage2;
