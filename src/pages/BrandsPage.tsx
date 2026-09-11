import { Star } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

import logoAlora from "@/assets/brands/alora-lighting.png";
import logoCapital from "@/assets/brands/capital.png";
import logoCyan from "@/assets/brands/cyan-designs.png";
import logoHinkley from "@/assets/brands/hinkley.png";
import logoInfratech from "@/assets/brands/infratech.png";
import logoKichler from "@/assets/brands/kichler.png";
import logoKuzco from "@/assets/brands/kuzco.png";
import logoMaxim from "@/assets/brands/maxim.png";
import logoOxygen from "@/assets/brands/oxygen.png";
import logoQuoizel from "@/assets/brands/quoizel.png";
import logoQuorum from "@/assets/brands/quorum.png";
import logoSavoy from "@/assets/brands/savoy-house.png";

interface FeaturedBrand {
  name: string;
  logo: string;
}

const featuredBrands: FeaturedBrand[] = [
  { name: "Alora Lighting", logo: logoAlora },
  { name: "Capital", logo: logoCapital },
  { name: "Cyan Designs", logo: logoCyan },
  { name: "Hinkley", logo: logoHinkley },
  { name: "Infratech", logo: logoInfratech },
  { name: "Kichler", logo: logoKichler },
  { name: "Kuzco Lighting Inc", logo: logoKuzco },
  { name: "Maxim", logo: logoMaxim },
  { name: "Oxygen", logo: logoOxygen },
  { name: "Quoizel", logo: logoQuoizel },
  { name: "Quorum", logo: logoQuorum },
  { name: "Savoy House", logo: logoSavoy },
];

const featuredNames = new Set(featuredBrands.map((b) => b.name));

const allBrands = [
  "2nd Avenue Designs White", "AFX Lighting, Inc.", "ASD Lighting", "Access",
  "Acclaim Lighting", "Accord Lighting", "Adesso", "Affinity", "Aladdin Light Lift",
  "Alloy LED", "Alora Lighting", "Alteck, LLC", "American Brass & Crystal",
  "American Lighting", "Arabela Lighting", "Arroyo Craftsman", "Artcraft",
  "Arteriors Home", "Atlas Lighting", "Austin Allen & Co.", "Avalanche Ranch Lighting",
  "Avenue Lighting", "Beacon Lighting America", "Besa Lighting", "Bethel International",
  "Bicycle Glass", "Big Ass Fans", "Bulbrite", "Buster and Punch", "CAL Lighting",
  "CWI Lighting", "Canarm", "Capital", "Carro USA", "Casablanca Fan Company",
  "Corbett", "Craftmade", "Creative Co-op", "Crystorama", "Currey", "Cyan Designs",
  "DVI", "Dainolite", "Dale Tiffany", "Dals", "Designers Fountain", "Diode Led",
  "Dolan Designs", "ET2", "Eglo", "Elegant", "Elite Lighting", "Emery Allen",
  "Eurofase", "Fanimation", "Fine Art Handcrafted Lighting", "Framburg",
  "Fredrick Ramond", "Generation Lighting", "Genie House", "Golden", "Hammerton",
  "Hansen Lighting Items", "Hi-Lite MFG Co.", "Hinkley", "House of Troy",
  "Hubbardton Forge", "Hudson Valley", "Hunter", "Infratech", "Innovations Lighting",
  "James R Moder", "Justice Design Group", "Kalco", "Kalco Allegri", "Kanova Lighting",
  "Kichler", "Kohler Lighting", "Koncept Inc", "Kuzco Lighting Inc", "LNC Home",
  "Lark", "Legrand", "Lib & Co. US", "Lighting One US", "Livex Lighting",
  "Lucas McKearn", "Luxrite", "Mariana", "Matteo Lighting", "Matthews Fan Company",
  "Maxim", "Melissa Lighting", "Meyda Green", "Millennium", "Minka George Kovacs",
  "Minka Metropolitan", "Minka-Aire", "Minka-Lavery",
  "Mitzi by Hudson Valley Lighting", "Modern Fan Co.", "Modern Forms US - Fans Only",
  "Modern Forms US Online", "Mullan Lighting", "Nora", "Northeast Lantern", "Norwell",
  "Nuvo", "Oxygen", "Palecek", "Paris Mirrors", "Primo Gas Lanterns", "Progress",
  "Quoizel", "Quorum", "RAB Lighting", "RP Lighting Plus Fans", "Regina Andrew",
  "Renwil", "Robert Abbey", "SDQ Lighting", "Santangelo Lighting & Design",
  "Satco Products Inc.", "Savoy House", "Savoy House Meridian",
  "Saylite, Texas Fluorescents Reinvented", "Schonbek 1870", "Sonneman",
  "StarFire Crystal", "Terracotta Lighting", "The Coppersmith", "Toltec Company",
  "Trans Globe", "Troy", "UltraLights Lighting", "Uttermost", "Varaluz",
  "Vaxcel International", "Visual Comfort & Co. Architectural Collection",
  "Visual Comfort & Co. Fan Collection", "Visual Comfort & Co. Modern Collection",
  "Visual Comfort & Co. Signature Collection",
  "Visual Comfort & Co. Signature Collection ALL US",
  "Visual Comfort & Co. Studio Collection", "Viz Glass", "WAC Smart Fan Collection",
  "WAC US", "Wave Lighting", "Westinghouse", "Wind River", "Z-Lite", "ZEEV Lighting",
];

const groupByLetter = (brands: string[]) => {
  const groups: Record<string, string[]> = {};
  brands.forEach((b) => {
    const letter = b[0].toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : "#";
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

const BrandsPage = () => {
  const grouped = groupByLetter(allBrands);
  const letters = grouped.map(([l]) => l);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mt-6 mb-12 text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            Shop by Brand
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Explore our curated collection of premium lighting manufacturers — from artisan studios to iconic design houses.
          </p>
        </div>

        {/* Featured Brands */}
        <section className="mb-16">
          <h2 className="font-serif text-xl text-foreground mb-6 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            Featured Brands
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredBrands.map((brand) => (
              <div
                key={brand.name}
                className="group relative border border-primary/20 bg-card rounded-lg px-5 py-6 flex items-center justify-center hover:border-primary/40 hover:shadow-sm transition-all min-h-[120px] overflow-hidden"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full object-contain scale-[1.4] group-hover:scale-150 transition-transform"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Letter Navigation */}
        <nav className="mb-8 flex flex-wrap gap-1.5 justify-center">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#brand-${letter}`}
              className="w-8 h-8 flex items-center justify-center rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {letter}
            </a>
          ))}
        </nav>

        {/* All Brands A–Z */}
        <section className="space-y-10">
          {grouped.map(([letter, brands]) => (
            <div key={letter} id={`brand-${letter}`}>
              <h3 className="font-serif text-lg text-foreground border-b border-border pb-2 mb-4">
                {letter}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                {brands.map((brand) => (
                  <span
                    key={brand}
                    className={`text-sm py-1.5 ${
                      featuredNames.has(brand)
                        ? "text-foreground font-medium flex items-center gap-1.5"
                        : "text-muted-foreground"
                    }`}
                  >
                    {featuredNames.has(brand) && (
                      <Star className="h-3 w-3 text-primary fill-primary flex-shrink-0" />
                    )}
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default BrandsPage;
