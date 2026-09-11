import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Truck,
  ShieldCheck,
  Store,
  Wind,
  Feather,
  Ruler,
  Phone,
  ChevronDown,
} from "lucide-react";
import fanimationSpitfire from "@/assets/fanimation-spitfire.jpg";
import editorialLivingAsset from "@/assets/hero-living-room.jpg.asset.json";
const editorialLiving = editorialLivingAsset.url;
import editorialBedroom from "@/assets/editorial-bedroom.jpg";
import editorialOutdoor from "@/assets/editorial-outdoor.jpg";

const PRICE = 749;

const benefits = [
  {
    icon: Wind,
    title: "Quietly Powerful",
    body: "A balanced five-blade design engineered to move air without announcing itself.",
  },
  {
    icon: Feather,
    title: "Sculptural Silhouette",
    body: "A composed, low-profile shape that reads as architecture, not appliance.",
  },
  {
    icon: Ruler,
    title: "Sized for Most Rooms",
    body: "A 60-inch sweep suits living rooms, primary bedrooms, and great rooms with ease.",
  },
];

const specs = [
  ["Collection", "Spitfire by Fanimation"],
  ["Finish", "Brushed Bronze"],
  ["Blade Span", '60"'],
  ["Blades", "5, sealed composite"],
  ["Mount", "Stem (downrod included)"],
  ["Control", "Handheld remote included"],
  ["Motor", "DC, six speeds, reversible"],
  ["Light Kit", "Optional, sold separately"],
  ["Damp Rated", "Indoor / covered outdoor"],
  ["Warranty", "Manufacturer limited warranty"],
];

const faqs = [
  {
    q: "What size room is this fan suited for?",
    a: "A 60-inch fan is generally a good fit for rooms up to roughly 400 square feet. For larger great rooms or open plans, a pair often works better than a single oversized fan. Our designers can size the room for you.",
  },
  {
    q: "Can I install it outdoors?",
    a: "The Spitfire is damp rated, which means it is approved for covered outdoor spaces — porches, lanais, and three-season rooms. It is not rated for direct exposure to rain or sprinklers.",
  },
  {
    q: "Does it come with a light?",
    a: "No. The Spitfire ships without a light. A coordinating light kit is available separately — we can order it on the same purchase order.",
  },
  {
    q: "What ceiling heights does it work with?",
    a: "The included downrod fits standard 8 to 9 foot ceilings. Longer downrods are available for vaulted ceilings — let us know your ceiling height and we'll spec the right length.",
  },
  {
    q: "How long until it ships?",
    a: "Lead times shown on product pages are estimates. For time-sensitive projects, please call 801-225-4459 and we will confirm current availability before you order.",
  },
  {
    q: "What is your return policy?",
    a: "Returns require a Return Goods Authorization (RGA) number issued by our team. Items must be unused, in original packaging, and returned within 7 days of receiving the RGA. Restocking and return shipping charges may apply.",
  },
];

const SpitfireFanLanding = () => {
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = "Spitfire Ceiling Fan in Brushed Bronze | Fanimation | Nova Lighting";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Shop the Fanimation Spitfire ceiling fan in brushed bronze at Nova Lighting. A sculptural five-blade DC fan designed to move air with quiet, architectural restraint.",
    );
    if (!meta.parentElement) document.head.appendChild(meta);

    const onScroll = () => setShowSticky(window.scrollY > 700);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-background text-foreground">
      {/* HERO */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="relative bg-secondary/30 rounded-lg aspect-square md:aspect-[4/5] overflow-hidden">
            <img
              src={fanimationSpitfire}
              alt="Fanimation Spitfire ceiling fan in brushed bronze, installed in a serene living room"
              className="absolute inset-0 h-full w-full object-cover"
              width={1024}
              height={1024}
            />
            <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-[10px] font-sans tracking-[0.2em] uppercase rounded-full">
              Spitfire Collection
            </span>
          </div>

          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-3">
              Fanimation · Spitfire
            </p>
            <h1 className="font-serif text-[2.25rem] sm:text-[3rem] font-light leading-[1.05] mb-5">
              Spitfire Ceiling Fan
              <br />
              <span className="italic text-muted-foreground">in Brushed Bronze</span>
            </h1>

            <p className="text-muted-foreground leading-relaxed mb-6">
              A sculptural five-blade silhouette engineered for quiet performance —
              designed to move air, and the eye, with equal restraint.
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-serif text-3xl">${PRICE}</span>
              <span className="text-xs text-muted-foreground tracking-[0.18em] uppercase">Free design consult</span>
            </div>

            <button
              type="button"
              className="w-full bg-foreground text-background py-4 text-[12px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors mb-3"
            >
              Add to Cart — ${PRICE}
            </button>
            <Link
              to="/locations"
              className="block w-full text-center border border-foreground/80 py-4 text-[11px] font-sans tracking-[0.22em] uppercase hover:bg-secondary transition-colors mb-6"
            >
              See it in a Location
            </Link>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Store className="h-4 w-4" /> In-store pickup</li>
              <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> Freight shipping</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Manufacturer warranty</li>
            </ul>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-secondary/40 border-b border-border/40">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["Since 1952", "Lighting Utah's homes"],
            ["Authorized", "Fanimation dealer"],
            ["Six Locations", "Across Utah"],
            ["801-225-4459", "Talk to a designer"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-serif text-xl sm:text-2xl">{n}</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
            Why the Spitfire
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light">
            A ceiling fan that earns its place in the room.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="text-center">
              <Icon className="h-8 w-8 mx-auto mb-4 text-accent" strokeWidth={1.25} />
              <h3 className="font-serif text-xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EDITORIAL */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <img
            src={editorialLiving}
            alt="A composed living room with a ceiling fan overhead"
            className="w-full aspect-[4/5] object-cover rounded-lg"
            loading="lazy"
          />
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Considered, not loud
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-6">
              Air movement, <em className="text-muted-foreground">designed in.</em>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Spitfire reads as part of the architecture, not as something added on
              afterward. The brushed bronze finish settles into warm and cool palettes
              alike, and the slim profile keeps sightlines open in rooms with lower
              ceilings.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              A DC motor and reversible direction make it as useful in February as it is
              in July — quiet on low, capable on high.
            </p>
          </div>
        </div>
      </section>

      {/* ROOM RECOMMENDATIONS */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-20 sm:py-28">
        <h2 className="font-serif text-3xl sm:text-4xl font-light text-center mb-12">
          At home in every room.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { img: editorialLiving, label: "Living Room", note: "A composed centerpiece for everyday spaces." },
            { img: editorialBedroom, label: "Primary Bedroom", note: "Quiet enough to sleep beneath." },
            { img: editorialOutdoor, label: "Covered Patio", note: "Damp rated for porches and lanais." },
          ].map((r) => (
            <div key={r.label}>
              <img src={r.img} alt={r.label} className="w-full aspect-[4/5] object-cover rounded-lg mb-3" loading="lazy" />
              <h3 className="font-serif text-lg">{r.label}</h3>
              <p className="text-sm text-muted-foreground">{r.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPECS */}
      <section className="bg-secondary/30 border-y border-border/40">
        <div className="mx-auto max-w-[1100px] px-6 sm:px-10 py-20 sm:py-28">
          <div className="text-center mb-10">
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-3">
              The details
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light">Specifications</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between py-4 border-b border-border/60 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-foreground font-medium text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground mt-6 text-center">
            Final specifications confirmed at order. Call 801-225-4459 for current
            configuration options.
          </p>
        </div>
      </section>

      {/* EXPERT HELP */}
      <section className="mx-auto max-w-[1100px] px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Talk to a lighting designer
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-5">
              Not sure if it's the right fit?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our designers have been helping homeowners and architects choose the right
              fixtures for over 70 years. Call us, visit a location, or schedule a
              consultation — we'll help you size, finish, and place the Spitfire with
              confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:8012254459"
                className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-[11px] font-sans tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" /> 801-225-4459
              </a>
              <Link
                to="/locations"
                className="inline-flex items-center gap-2 border border-foreground/80 px-6 py-3 text-[11px] font-sans tracking-[0.22em] uppercase hover:bg-secondary transition-colors"
              >
                Visit a Location
              </Link>
            </div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-8 sm:p-10">
            <h3 className="font-serif text-xl mb-4">What to know before you order</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Lead times shown on product pages are estimates, not guarantees.</li>
              <li>• Confirm ceiling height before ordering — longer downrods are available.</li>
              <li>• The Spitfire ships without a light kit; coordinating kits sold separately.</li>
              <li>• Damp rated for covered outdoor use — not for direct rain exposure.</li>
              <li>• Returns require a Return Goods Authorization (RGA); restocking fees may apply.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/30 border-t border-border/40">
        <div className="mx-auto max-w-[820px] px-6 sm:px-10 py-20 sm:py-28">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-center mb-12">
            Questions, answered.
          </h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span className="font-serif text-lg pr-4">{f.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <p className="pb-5 text-muted-foreground leading-relaxed text-sm">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[820px] px-6 sm:px-10 py-20 sm:py-28 text-center">
          <h2 className="font-serif text-3xl sm:text-5xl font-light mb-5 leading-tight">
            Designed to be lived with.
          </h2>
          <p className="text-background/70 mb-10 max-w-md mx-auto">
            Order online, pick up at any of our six Utah locations, or have it shipped.
            Questions? Our designers are a phone call away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              className="inline-block bg-background text-foreground px-12 py-4 text-[12px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-background/90 transition-colors"
            >
              Add to Cart — ${PRICE}
            </button>
            <a
              href="tel:8012254459"
              className="inline-flex items-center justify-center gap-2 border border-background/40 px-8 py-4 text-[12px] font-sans tracking-[0.22em] uppercase hover:bg-background/10 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" /> 801-225-4459
            </a>
          </div>
        </div>
      </section>

      {/* STICKY CTA */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 ${showSticky ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={fanimationSpitfire} alt="" className="h-12 w-12 object-cover bg-secondary/40 rounded-md hidden sm:block" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">Spitfire Ceiling Fan · Brushed Bronze</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-serif text-base text-foreground">${PRICE}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="bg-foreground text-background px-5 sm:px-8 py-3 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-foreground/90 transition-colors whitespace-nowrap"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
};

export default SpitfireFanLanding;
