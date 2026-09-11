import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Truck,
  ShieldCheck,
  Store,
  Wind,
  Volume2,
  Zap,
  Phone,
  ChevronDown,
} from "lucide-react";
import f524ClFan from "@/assets/f524-cl-roto-fan.jpg";
import livingRoomAsset from "@/assets/hero-living-room.jpg.asset.json";
const livingRoom = livingRoomAsset.url;
import bedroom from "@/assets/editorial-bedroom.jpg";
import outdoor from "@/assets/editorial-outdoor.jpg";

const PRICE = 249;

const benefits = [
  {
    icon: Wind,
    title: "Powerful Airflow",
    body: "Moves air gently and evenly across rooms up to 400 sq ft.",
  },
  {
    icon: Volume2,
    title: "Whisper Quiet",
    body: "A sealed motor keeps things calm — even on the highest setting.",
  },
  {
    icon: Zap,
    title: "Energy Efficient",
    body: "Six-speed remote and reverse function for year-round comfort.",
  },
];

const specs = [
  ["Blade Span", '52"'],
  ["Finish", "Coal"],
  ["Blades", "3 (Coal)"],
  ["Light Kit", "Not included (compatible)"],
  ["Motor", "172mm × 14mm sealed"],
  ["Speeds", "6, with remote control"],
  ["Reversible", "Yes (summer / winter)"],
  ["Mount", 'Standard, 6" downrod included'],
  ["Wet/Damp Rated", "Damp — covered patios OK"],
  ["Warranty", "Manufacturer warranty (Minka-Aire)"],
];

const faqs = [
  {
    q: "What size room is the Roto 52\" best for?",
    a: "It's well suited to rooms up to 400 sq ft — living rooms, primary bedrooms, and covered porches.",
  },
  {
    q: "Can I use it outdoors?",
    a: "Yes, on covered patios. The Roto is damp-rated, so it handles humidity but should not be exposed to direct rain.",
  },
  {
    q: "Does it come with a light?",
    a: "No — the clean silhouette is part of the appeal. A compatible LED light kit is sold separately.",
  },
  {
    q: "How quiet is it really?",
    a: "Very quiet. The sealed motor produces minimal noise even at higher speeds, making it comfortable for bedrooms and living spaces.",
  },
  {
    q: "How long until it ships?",
    a: "Lead times shown on product pages are estimates. In general, orders arrive at our warehouse within roughly 1.5 to 2 weeks. For time-sensitive projects, please call us at 801-225-4459 to confirm availability.",
  },
  {
    q: "What is your return policy?",
    a: "Returns require a Return Goods Authorization (RGA) number issued by our team. Items must be unused, in original packaging, and returned within 7 days of receiving the RGA. Restocking and return shipping charges may apply. Call 801-225-4459 to start a return.",
  },
];

const RotoFanLanding = () => {
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Minka-Aire Roto 52" Ceiling Fan in Coal | F524-CL | Nova Lighting';
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      'Shop the Minka-Aire Roto 52" Coal ceiling fan (F524-CL). Whisper-quiet motor, 6-speed remote, damp-rated for covered patios. $249.',
    );
    if (!meta.parentElement) document.head.appendChild(meta);

    const onScroll = () => setShowSticky(window.scrollY > 700);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-background text-foreground">
      {/* ━━━ HERO ━━━ */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-[1260px] px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Image */}
          <div className="relative bg-secondary/30 rounded-lg aspect-square md:aspect-[4/5] overflow-hidden">
            <img
              src={f524ClFan}
              alt='Minka-Aire Roto 52 inch ceiling fan in Coal finish, model F524-CL'
              className="absolute inset-0 h-full w-full object-contain p-8 sm:p-14"
            />
            <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-[10px] font-sans tracking-[0.2em] uppercase rounded-full">
              Featured
            </span>
          </div>

          {/* Buy box */}
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-3">
              Minka-Aire · F524-CL
            </p>
            <h1 className="font-serif text-[2.25rem] sm:text-[3rem] font-light leading-[1.05] mb-4">
              Roto 52" Ceiling Fan
              <br />
              <span className="italic text-muted-foreground">in Coal</span>
            </h1>

            <p className="text-muted-foreground leading-relaxed mb-6">
              A clean, three-blade silhouette with a quiet, energy-efficient motor —
              engineered to move air beautifully in living rooms, bedrooms, and
              covered patios.
            </p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-serif text-3xl">${PRICE}</span>
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
              <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> Curbside freight</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Manufacturer warranty</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST BAR ━━━ */}
      <section className="bg-secondary/40 border-b border-border/40">
        <div className="mx-auto max-w-[1260px] px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["60+ Years", "Lighting expertise"],
            ["Authorized", "Minka-Aire dealer"],
            ["Orem, UT", "Family-owned showroom"],
            ["801-225-4459", "Talk to an expert"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-serif text-xl sm:text-2xl">{n}</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ BENEFITS ━━━ */}
      <section className="mx-auto max-w-[1260px] px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
            Why the Roto
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light">
            Designed to disappear into the room — until you feel the breeze.
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

      {/* ━━━ EDITORIAL ━━━ */}
      <section className="bg-secondary/30">
        <div className="mx-auto max-w-[1260px] px-4 sm:px-6 py-20 sm:py-28 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <img src={livingRoom} alt="Modern living room with ceiling fan" className="w-full aspect-[4/5] object-cover rounded-lg" />
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Made for the rooms you actually live in
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-6">
              Quiet enough to sleep under. <em className="text-muted-foreground">Strong enough to cool a room.</em>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Roto's sealed motor stays whisper-quiet even at full speed — so
              you get airflow without the hum. The matte Coal finish reads as
              architectural rather than utilitarian, blending into modern,
              transitional, and minimalist interiors.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Reverse the blades in winter to push warm air down and keep rooms
              comfortable year-round.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ ROOM RECOMMENDATIONS ━━━ */}
      <section className="mx-auto max-w-[1260px] px-4 sm:px-6 py-20 sm:py-28">
        <h2 className="font-serif text-3xl sm:text-4xl font-light text-center mb-12">
          At home in every room.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { img: bedroom, label: "Primary Bedroom", note: "Silent on the lower speeds." },
            { img: livingRoom, label: "Living Room", note: "Full breeze on higher settings." },
            { img: outdoor, label: "Covered Patio", note: "Damp-rated for outdoor use." },
          ].map((r) => (
            <div key={r.label}>
              <img src={r.img} alt={r.label} className="w-full aspect-[4/5] object-cover rounded-lg mb-3" />
              <h3 className="font-serif text-lg">{r.label}</h3>
              <p className="text-sm text-muted-foreground">{r.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ SPECS ━━━ */}
      <section className="bg-secondary/30 border-y border-border/40">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-20 sm:py-28">
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

      {/* ━━━ EXPERT HELP ━━━ */}
      <section className="mx-auto max-w-[1100px] px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Talk to a lighting expert
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light leading-tight mb-5">
              Not sure if it's the right fit?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our team has been helping homeowners and designers choose the right
              fans and fixtures for over 60 years. Call us, visit our Orem
              showroom, or schedule a consultation — we'll help you size, finish,
              and place the Roto with confidence.
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
                Visit Our Location
              </Link>
            </div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-8 sm:p-10">
            <h3 className="font-serif text-xl mb-4">What to know before you order</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Lead times shown on product pages are estimates, not guarantees.</li>
              <li>• Oversized items ship via truck freight, curbside delivery only.</li>
              <li>• We can't ship to PO Box addresses.</li>
              <li>• Returns require a Return Goods Authorization (RGA); restocking fees may apply.</li>
              <li>• We recommend waiting to schedule installation until your order has arrived and been inspected.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section className="bg-secondary/30 border-t border-border/40">
        <div className="mx-auto max-w-[820px] px-4 sm:px-6 py-20 sm:py-28">
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

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[820px] px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="font-serif text-3xl sm:text-5xl font-light mb-5 leading-tight">
            Bring quiet airflow home.
          </h2>
          <p className="text-background/70 mb-10 max-w-md mx-auto">
            Order online, pick up at our Orem showroom, or have it shipped.
            Questions? Our lighting experts are a phone call away.
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

      {/* ━━━ STICKY MOBILE/DESKTOP CTA ━━━ */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 ${showSticky ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto max-w-[1260px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={f524ClFan} alt="" className="h-12 w-12 object-contain bg-secondary/40 rounded-md hidden sm:block" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">Roto 52" Ceiling Fan · Coal</p>
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

export default RotoFanLanding;
