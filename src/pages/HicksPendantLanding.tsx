import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Truck,
  ShieldCheck,
  Store,
  Sparkles,
  Hammer,
  Ruler,
  Phone,
  ChevronDown,
} from "lucide-react";
import vcHicksPendant from "@/assets/vc-hicks-pendant.jpg";
import editorialDining from "@/assets/editorial-dining.jpg";
import editorialKitchen from "@/assets/editorial-kitchen.jpg";
import editorialEntryway from "@/assets/editorial-entryway.jpg";

const PRICE = 462;

const benefits = [
  {
    icon: Hammer,
    title: "Hand-Finished",
    body: "Each pendant is finished by hand — small variations are part of the craft.",
  },
  {
    icon: Sparkles,
    title: "Designed to Last",
    body: "Solid brass construction and an enduring silhouette that ages gracefully.",
  },
  {
    icon: Ruler,
    title: "Quietly Architectural",
    body: "A composed shape that disappears into a room — until the light comes on.",
  },
];

const specs = [
  ["Designer", "Thomas O'Brien"],
  ["Collection", "Visual Comfort Signature"],
  ["Finish", "Hand-Rubbed Antique Brass"],
  ["Material", "Solid brass"],
  ["Diameter", '12"'],
  ["Height", '8.5" (excluding stem)'],
  ["Stems Included", '6", 12", 18"'],
  ["Socket", "1 × E26 medium base"],
  ["Wattage", "60W max (LED recommended)"],
  ["Wet/Damp Rated", "Dry — interior use"],
];

const faqs = [
  {
    q: "How many pendants do I need over an island?",
    a: "As a starting point, allow 30 to 32 inches between pendants and 30 to 36 inches above the countertop. Our designers can size a layout for your specific island — call us for a quick consultation.",
  },
  {
    q: "Can I use it in a dining room?",
    a: "Yes — a single pendant looks beautifully restrained over a smaller table, or a row of two to three over a long table.",
  },
  {
    q: "Is the finish consistent?",
    a: "Hand-rubbed antique brass is finished by hand, so subtle variation between pieces is expected and intentional. The finish develops a natural patina over time.",
  },
  {
    q: "Is it dimmable?",
    a: "Yes, with a compatible LED bulb and dimmer. Our team can recommend a pairing.",
  },
  {
    q: "How long until it ships?",
    a: "Lead times shown on product pages are estimates. Most Visual Comfort Signature pieces arrive at our warehouse within roughly two to four weeks. For time-sensitive projects, please call 801-225-4459 to confirm availability.",
  },
  {
    q: "What is your return policy?",
    a: "Returns require a Return Goods Authorization (RGA) number issued by our team. Items must be unused, in original packaging, and returned within 7 days of receiving the RGA. Restocking and return shipping charges may apply.",
  },
];

const HicksPendantLanding = () => {
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = "Hicks Pendant in Hand-Rubbed Antique Brass | Visual Comfort | Nova Lighting";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Shop the Visual Comfort Signature Collection Hicks Pendant by Thomas O'Brien in hand-rubbed antique brass. Hand-finished, solid brass, designed to be lived with.",
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
              src={vcHicksPendant}
              alt="Visual Comfort Signature Collection Hicks pendant in hand-rubbed antique brass"
              className="absolute inset-0 h-full w-full object-cover"
              width={1024}
              height={1024}
            />
            <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-[10px] font-sans tracking-[0.2em] uppercase rounded-full">
              Signature Collection
            </span>
          </div>

          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-3">
              Visual Comfort · Thomas O'Brien
            </p>
            <h1 className="font-serif text-[2.25rem] sm:text-[3rem] font-light leading-[1.05] mb-5">
              Hicks Pendant
              <br />
              <span className="italic text-muted-foreground">in Hand-Rubbed Antique Brass</span>
            </h1>

            <p className="text-muted-foreground leading-relaxed mb-6">
              An enduring Thomas O'Brien design — a quietly architectural silhouette,
              hand-finished in solid brass and built to be lived with for decades.
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
              <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> White-glove freight</li>
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
            ["Authorized", "Visual Comfort dealer"],
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
            Why the Hicks
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light">
            A pendant designed to disappear into the room — until the light comes on.
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
            src={editorialKitchen}
            alt="Hicks pendants over a kitchen island"
            className="w-full aspect-[4/5] object-cover rounded-lg"
            loading="lazy"
          />
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
              An archetype, not a trend
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-6">
              Designed in 2007. <em className="text-muted-foreground">Still the one to beat.</em>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Hicks is one of those rare pieces that looks as quietly correct in a
              new build as it does in a turn-of-the-century townhouse. The proportions
              are the work — a half-dome shade, a slim stem, no ornament.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Hung as a single statement, in a pair over an island, or in a row above a
              long dining table, it carries the room without crowding it.
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
            { img: editorialKitchen, label: "Kitchen Island", note: "Hang in pairs or threes." },
            { img: editorialDining, label: "Dining Room", note: "A single pendant, perfectly sized." },
            { img: editorialEntryway, label: "Entryway", note: "Sets the tone the moment you arrive." },
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
              consultation — we'll help you size, finish, and place the Hicks with
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
              <li>• Hand-finished pieces will show subtle, natural variation.</li>
              <li>• Three stem lengths are included to fit most ceiling heights.</li>
              <li>• Returns require a Return Goods Authorization (RGA); restocking fees may apply.</li>
              <li>• We recommend waiting to schedule installation until your order has arrived and been inspected.</li>
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
            <img src={vcHicksPendant} alt="" className="h-12 w-12 object-cover bg-secondary/40 rounded-md hidden sm:block" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">Hicks Pendant · Hand-Rubbed Antique Brass</p>
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

export default HicksPendantLanding;
