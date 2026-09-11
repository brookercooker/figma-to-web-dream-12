import { Link } from "react-router-dom";
import { Mail, Phone, ArrowRight, Check, Gauge } from "lucide-react";
import deloreanAsset from "@/assets/ralphs-delorean.jpg.asset.json";
import NumberCounter from "@/components/objects/NumberCounter";
import PageCounter from "@/components/objects/PageCounter";

/**
 * Curated chandelier landing page for Fred's Homes (contractor partner).
 * Pricing is intentionally withheld — quoted by the trade rep on request.
 */

const FEATURED = {
  name: "Nobel 6-Light Chandelier",
  finish: "Aged Brass",
  vendor: "Cyan Designs",
  height: '37.5"',
  image: "/__l5e/assets-v1/10a8d8bc-5a06-4707-96b4-461c3281dafa/14_11627.jpg",
  sku: "11627",
  url: "https://sandbox.novalightingcompany.com/products/nobel-6-light-chandelier-11627",
  blurb:
    "A sculptural centerpiece — six candle-style arms in warm aged brass. Designed for entries, dining rooms, and great-room moments where a single fixture sets the tone.",
};

const SHORTLIST = [
  {
    name: '108" Wide Thicket Chandelier',
    vendor: "Meyda Green",
    family: "Thicket",
    dims: '108" W · 30" H · Damp Rated',
    image: "/__l5e/assets-v1/70d1eee8-2155-4859-b5d4-fb7ff557a1f7/13_244761.jpg",
    sku: "244761",
    url: "https://sandbox.novalightingcompany.com/products/108-wide-thicket-chandelier-244761-v11725",
    note: "Statement scale — great-room or two-story foyer",
  },
  {
    name: '60" Square Retreat Chandelier',
    vendor: "2nd Avenue Designs",
    family: "Retreat",
    dims: "Gilded Tobacco · Dry Rated",
    image: "",
    sku: "119651",
    url: "https://sandbox.novalightingcompany.com/products/60-square-retreat-chandelier-119651",
    note: "Architectural square form for dining rooms",
  },
  {
    name: "1 Light Chandelier — Matte Black",
    vendor: "Z-Lite",
    family: "Maddox",
    dims: '18" W · 13.5" H',
    image: "/__l5e/assets-v1/b61b9bb2-563d-434c-b6cf-2ae96f9b3abf/16_6013-18MB.jpg",
    sku: "6013-18MB",
    url: "https://sandbox.novalightingcompany.com/products/1-light-chandelier-6013-18",
    note: "Compact option for nooks & hallways",
  },
  {
    name: "1 Light Chandelier — Polished Nickel",
    vendor: "Z-Lite",
    family: "Katie",
    dims: '18" W · 13.5" H',
    image: "/__l5e/assets-v1/563cc83b-2b41-46ed-b3b9-318dda2c291e/17_6014-18PN.jpg",
    sku: "6014-18PN",
    url: "https://sandbox.novalightingcompany.com/products/1-light-chandelier-6014-18",
    note: "Clean transitional finish for builder spec",
  },
  {
    name: "1 Light Linear Chandelier",
    vendor: "Z-Lite",
    family: "Aeon",
    dims: '10.38" W · 0.75" H · Chrome',
    image: "/__l5e/assets-v1/96651f6e-c13e-4e5f-85d1-35a42194cc61/15_1003-4CH-LED.jpg",
    sku: "1003-4CH-LED",
    url: "https://sandbox.novalightingcompany.com/products/1-light-linear-chandelier-1003-4ch",
    note: "Low-profile linear LED for islands",
  },
];

const RalphsHomesLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 sm:py-16">
          <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-4">
            A Lighting Selection for
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl text-foreground leading-[1.05] mb-4">
            Fred's Homes
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            A curated chandelier shortlist hand-selected by Nova Lighting for
            your current build phase. Five comparison pieces alongside our
            recommended feature fixture — sized for your great-room, dining, and
            accent ceilings.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 rounded-full">
              <Check className="h-3 w-3" /> Trade pricing on request
            </span>
            <span className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 rounded-full">
              <Check className="h-3 w-3" /> Showroom holds available
            </span>
            <span className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 rounded-full">
              <Check className="h-3 w-3" /> Lead-time confirmed by your rep
            </span>
          </div>
        </div>
      </section>

      {/* Page counter */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-12 sm:pt-20">
        <PageCounter />
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 sm:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
              Our Recommendation
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              The Feature Fixture
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="aspect-square bg-secondary/40 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={FEATURED.image}
              alt={FEATURED.name}
              className="max-h-[85%] max-w-[85%] object-contain"
            />
          </div>
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground mb-3">
              {FEATURED.vendor}
            </p>
            <h3 className="font-serif text-3xl sm:text-4xl text-foreground mb-4 leading-tight">
              {FEATURED.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              {FEATURED.blurb}
            </p>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-border pt-6 mb-8">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Finish
                </dt>
                <dd className="text-foreground">{FEATURED.finish}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Height
                </dt>
                <dd className="text-foreground">{FEATURED.height}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  SKU
                </dt>
                <dd className="text-foreground">{FEATURED.sku}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Lights
                </dt>
                <dd className="text-foreground">6</dd>
              </div>
            </dl>
            <a
              href={FEATURED.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3 text-xs font-sans font-medium tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
            >
              View on Nova Lighting <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* By the Numbers */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-12 sm:pb-20">
        <NumberCounter />
      </section>



      {/* DeLorean — a small homage for Fred */}
      <section className="border-y border-border bg-foreground text-background">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 relative overflow-hidden">
            <img
              src={deloreanAsset.url}
              alt="A silver DeLorean DMC-12 with gull-wing doors open, parked beneath a glowing chandelier"
              loading="lazy"
              width={1600}
              height={1024}
              className="w-full h-full object-cover aspect-[16/10] lg:aspect-auto"
            />
          </div>
          <div className="lg:col-span-2 px-6 sm:px-10 py-12 lg:py-20 flex flex-col justify-center">
            <p className="text-[11px] tracking-[0.25em] uppercase text-background/60 mb-3 inline-flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5" /> 88 mph
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-4 leading-tight">
              Where we're going, you'll need good light.
            </h2>
            <p className="text-sm text-background/70 leading-relaxed mb-6">
              Pull into the foyer. Doors up. The chandelier above does the rest
              — warm, steady, unmistakably composed. Fred's homes deserve
              entries that feel like an arrival, not just a doorway.
            </p>
            <p className="text-xs tracking-[0.18em] uppercase text-background/50">
              A small homage to the man with the gull-wing taste.
            </p>
          </div>
        </div>
      </section>

      {/* Shortlist */}
      <section className="border-t border-border bg-secondary/20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 sm:py-20">
          <div className="mb-10">
            <p className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground mb-2">
              Side-by-Side
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
              Comparison Shortlist
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Five fixtures across scale, finish, and form — each chosen to
              cover a different room or moment on the project.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {SHORTLIST.map((p) => (
              <a
                key={p.sku}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-background border border-border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-secondary/40 flex items-center justify-center">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="max-h-[80%] max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Image on request
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-1.5">
                    {p.vendor} · {p.family}
                  </p>
                  <h3 className="font-serif text-base text-foreground mb-2 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {p.dims}
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-auto pt-3 border-t border-border">
                    {p.note}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-6">
          At-a-glance comparison
        </h2>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-foreground">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-medium">
                  Fixture
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-medium">
                  Vendor
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-medium">
                  Dimensions
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-medium">
                  SKU
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  name: FEATURED.name,
                  vendor: FEATURED.vendor,
                  dims: `${FEATURED.height} H · ${FEATURED.finish}`,
                  sku: FEATURED.sku,
                  featured: true,
                },
                ...SHORTLIST.map((s) => ({
                  name: s.name,
                  vendor: s.vendor,
                  dims: s.dims,
                  sku: s.sku,
                  featured: false,
                })),
              ].map((row) => (
                <tr key={row.sku} className={row.featured ? "bg-accent/10" : ""}>
                  <td className="px-4 py-3 text-foreground">
                    {row.featured && (
                      <span className="inline-block text-[9px] tracking-[0.2em] uppercase bg-foreground text-background px-1.5 py-0.5 rounded mr-2 align-middle">
                        Pick
                      </span>
                    )}
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.vendor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.dims}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {row.sku}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-background/60 mb-3">
              Next Step
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-4 leading-tight">
              Ready to lock in the selection for Fred's Homes?
            </h2>
            <p className="text-sm text-background/70 leading-relaxed max-w-lg">
              Your Nova Lighting rep will share trade pricing, confirm current
              lead-times, and reserve the fixtures against the build schedule.
              Visit any of our six Utah showrooms to see the feature chandelier
              in person.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
            <a
              href="mailto:trade@novalightingcompany.com?subject=Fred%27s%20Homes%20-%20Chandelier%20Selection"
              className="inline-flex items-center justify-center gap-2 bg-background text-foreground px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase hover:bg-background/90 transition-colors"
            >
              <Mail className="h-4 w-4" /> Email Trade Desk
            </a>
            <a
              href="tel:+18015550100"
              className="inline-flex items-center justify-center gap-2 border border-background/40 text-background px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase hover:bg-background/10 transition-colors"
            >
              <Phone className="h-4 w-4" /> Call a Rep
            </a>
            <Link
              to="/locations"
              className="inline-flex items-center justify-center gap-2 text-background/80 px-2 py-3 text-xs font-medium tracking-[0.15em] uppercase hover:text-background transition-colors"
            >
              Find a Showroom <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RalphsHomesLanding;
