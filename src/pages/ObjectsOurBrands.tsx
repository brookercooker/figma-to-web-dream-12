import { Link } from "react-router-dom";
import brandsBgAsset from "@/assets/brands-bg.jpg.asset.json";
import aloraLogo from "@/assets/brands/alora-lighting.png";
import capitalLogo from "@/assets/brands/capital.png";
import hinkleyLogo from "@/assets/brands/hinkley.png";
import kichlerLogo from "@/assets/brands/kichler.png";
import kuzcoLogo from "@/assets/brands/kuzco.png";
import maximLogo from "@/assets/brands/maxim.png";
import oxygenLogo from "@/assets/brands/oxygen.png";
import quoizelLogo from "@/assets/brands/quoizel.png";
import quorumLogo from "@/assets/brands/quorum.png";
import savoyLogo from "@/assets/brands/savoy-house.png";

const brandsBg = brandsBgAsset.url;

type Brand = { name: string; img?: string };

const brandLogos: Brand[] = [
  { name: "Avenue" },
  { name: "Capital Lighting", img: capitalLogo },
  { name: "Copper Smith" },
  { name: "Craftmade" },
  { name: "Hinkley Fredrick Ramond", img: hinkleyLogo },
  { name: "Hudson Valley" },
  { name: "Infratech" },
  { name: "Kichler", img: kichlerLogo },
  { name: "Kuzco & Alora", img: kuzcoLogo },
  { name: "Alora Lighting", img: aloraLogo },
  { name: "Maxim", img: maximLogo },
  { name: "Minka" },
  { name: "Oxygen", img: oxygenLogo },
  { name: "Quoizel", img: quoizelLogo },
  { name: "Quorum", img: quorumLogo },
  { name: "Savoy House", img: savoyLogo },
  { name: "Studio M" },
  { name: "Troy" },
  { name: "Visual Comfort" },
  { name: "Z-Lite" },
  { name: "Lib & Co" },
  { name: "Cyan" },
  { name: "Innovations" },
  { name: "Palecek" },
];


const ObjectsOurBrands = () => {
  return (
    <div className="bg-background">
      <section className="relative border-y border-border/50 overflow-hidden">
        <div className="absolute inset-0">
          <img src={brandsBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/85" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground text-center mb-4">
            Proudly Representing
          </p>
          <h2 className="font-serif text-[2rem] sm:text-[2.75rem] md:text-[3.25rem] text-foreground font-light text-center mb-4">
            Over 200 World-Class Brands
          </h2>
          <p className="text-center text-muted-foreground text-sm max-w-md mx-auto mb-14 sm:mb-16">
            From iconic names to emerging designers, we curate the brands that define modern lighting.
          </p>
          <div className="relative overflow-hidden -space-y-4">
            {(["scroll-reverse", "scroll"] as const).map((anim) => (
              <div
                key={anim}
                className="flex gap-16 items-center w-max"
                style={{ animation: `${anim} 90s linear infinite` }}
              >
                {[...brandLogos, ...brandLogos].map((brand, i) => {
                  const textStyles = [
                    "font-serif italic font-light text-3xl sm:text-4xl md:text-5xl",
                    "font-sans uppercase tracking-[0.3em] text-lg sm:text-xl md:text-2xl font-medium",
                    "font-serif font-normal text-3xl sm:text-4xl md:text-5xl",
                    "font-sans font-bold text-2xl sm:text-3xl md:text-4xl",
                    "font-serif italic font-medium text-2xl sm:text-3xl md:text-4xl",
                    "font-sans font-light uppercase tracking-[0.5em] text-base sm:text-lg md:text-xl",
                    "font-serif font-light text-4xl sm:text-5xl md:text-6xl",
                    "font-sans italic font-normal text-2xl sm:text-3xl md:text-4xl",
                  ];
                  const styleClass = textStyles[
                    (brand.name.charCodeAt(0) + brand.name.length) % textStyles.length
                  ];
                  return (
                    <Link
                      key={`${anim}-${brand.name}-${i}`}
                      to="/coming-soon"
                      className="group flex items-center justify-center shrink-0 py-4 hover:opacity-70 transition-opacity duration-300"
                    >
                      {brand.img ? (
                        <img
                          src={brand.img}
                          alt={brand.name}
                          className="h-32 sm:h-40 md:h-48 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span
                          className={`${styleClass} text-foreground/80 whitespace-nowrap px-6 transition-colors duration-300 group-hover:text-foreground`}
                        >
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>


          <div className="text-center mt-14 sm:mt-16">
            <Link
              to="/coming-soon"
              className="inline-block border border-border text-foreground px-9 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:border-foreground/40 transition-colors"
            >
              Explore All Brands
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ObjectsOurBrands;
