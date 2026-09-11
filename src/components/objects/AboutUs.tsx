import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import editorialGrand from "@/assets/about-hero-kitchen.jpg.asset.json";
import editorialDining from "@/assets/about-hallway-chandelier.jpg.asset.json";
import editorialPendant from "@/assets/about-chandelier-detail.jpg.asset.json";
import awardCover from "@/assets/arts-awards-poster.png.asset.json";
import awardsVideo from "@/assets/awards-highlight.mp4.asset.json";

const AboutUs = () => {
  return (
    <div className="bg-nova-cream">
      {/* ─────────────────────────── HERO ─────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-20 sm:pt-28 pb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-px w-8 bg-nova-brass" />
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-nova-garnet font-semibold">
              About Nova Lighting · Since 1952
            </p>
            <span className="h-px w-8 bg-nova-brass" />
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light text-nova-ink leading-[0.95] text-center tracking-tight">
            Lighting, thoughtfully
            <span className="block italic text-nova-garnet">considered.</span>
          </h1>

          <p className="mt-10 mx-auto max-w-2xl text-center font-sans font-light text-lg text-nova-ink/80 leading-relaxed">
            Three generations of family expertise, six Utah showrooms, and more than
            two hundred of the world's finest lighting brands — quietly at your service.
          </p>
        </div>

        {/* Wide editorial image */}
        <div className="w-full aspect-[2/1] overflow-hidden">
          <img
            src={editorialGrand.url}
            alt="Kitchen with green tile, marble island, and a row of hand-finished lantern pendants"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </section>

      {/* ─────────────────────── OUR STORY ─────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 sm:px-10 py-24 sm:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          <div className="md:col-span-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-nova-garnet font-semibold mb-4">
              Our Story
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-nova-ink leading-[1.05]">
              Seventy years of light.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-5 font-sans font-light text-nova-ink/80 leading-relaxed">
            <p>
              Nova Lighting opened its doors in Salt Lake City in 1952, when Utah's
              first postwar neighborhoods were still finding their footing. What began
              as a single storefront selling table lamps and porch lanterns has grown
              — carefully, never quickly — into the state's most trusted lighting
              destination.
            </p>
            <p>
              Today we are still family-owned, still independent, and still guided by
              the same idea: that the right light changes the way a home feels.
              Three generations of the founding family sit on our showroom floors
              alongside a team of consultants who have spent, on average, more than
              a decade with us.
            </p>
            <p>
              We work with builders shaping mountainside estates, designers styling
              downtown lofts, and homeowners who simply want the pendant above their
              kitchen island to feel like it was made for the room.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────── OUR DIFFERENCE (merged) ─────────────── */}
      <section className="bg-nova-sand/40">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/5] overflow-hidden rounded-lg">
              <img
                src={editorialDining.url}
                alt="Sunlit hallway beneath a tiered green and clear glass chandelier"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-nova-garnet font-semibold mb-4">
                Our Difference
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl font-light text-nova-ink leading-[1.05] mb-8">
                A quieter approach to a beautiful home.
              </h2>
              <p className="font-sans font-light text-nova-ink/80 leading-relaxed mb-6">
                Most lighting is sold by the fixture. We plan it by the room. Our
                consultants read your architectural drawings, walk your finishes, and
                consider how a space is used at 7 a.m. and again at 10 p.m. before we
                ever recommend a piece.
              </p>
              <p className="font-sans font-light text-nova-ink/80 leading-relaxed">
                It's a slower way of working — and it's the reason our clients return
                home after home, generation after generation.
              </p>
            </div>
          </div>

          <div className="mt-20 sm:mt-28 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">
            {[
              {
                n: "01",
                title: "A curated house of brands.",
                body: "More than 200 makers, selected for quality, design, and the homes our clients are actually creating.",
              },
              {
                n: "02",
                title: "Guidance, not a sales pitch.",
                body: "Our consultants help you think through scale, placement, finish, light output, and how each piece works within the room.",
              },
              {
                n: "03",
                title: "Utah, top to bottom.",
                body: "Six showrooms from Layton to St. George, with local teams who understand the homes, builders, and designers in their communities.",
              },
              {
                n: "04",
                title: "Here long after installation.",
                body: "Our relationship doesn't end when the fixture leaves the showroom. We're here for questions, replacements, and whatever comes next.",
              },

            ].map((item) => (
              <div key={item.n}>
                <p className="font-serif italic text-nova-garnet text-2xl mb-3">
                  {item.n}
                </p>
                <h3 className="font-serif text-2xl text-nova-ink font-light mb-3 leading-snug">
                  {item.title}
                </h3>
                <p className="font-sans text-[15px] font-light text-nova-ink/70 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── VIDEO / AWARDS ─────────────────── */}
      <section id="arts-awards" className="scroll-mt-24 bg-nova-cream text-nova-ink border-y border-nova-brass/40">

        <div className="mx-auto max-w-5xl px-6 sm:px-10 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-7 order-1 text-left">
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-nova-garnet mb-4">
                36th Annual ARTS Awards
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light leading-[1.15] text-nova-ink">
                Lighting Showroom of the Year,
                <br className="hidden sm:block" /> West Region.
              </h2>
              <p className="mt-5 font-sans font-light text-[15px] leading-relaxed text-nova-ink/75 max-w-xl">
                The ARTS Awards are the home and design industry's highest honor,
                presented each January by Dallas Market Center and the
                Accessories Resource Team. Nova Lighting was named the West's
                retail lighting showroom of the year — an award judged on
                design, merchandising, and the guidance a showroom gives its
                clients.
              </p>
              <p className="mt-8 inline-block border-t border-nova-brass/40 pt-4 font-sans text-[10px] uppercase tracking-[0.3em] text-nova-stone">
                Dallas Market Center · Dallas, Texas · January 2026
              </p>
              <a
                href="https://dallasmarketcenter.com/artsawards/arts-winners-2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block font-sans text-[10px] uppercase tracking-[0.3em] text-nova-garnet border-b border-nova-garnet/40 pb-1 hover:border-nova-garnet transition-colors"
              >
                View the 2026 winners
              </a>
            </div>


            {/* Vertical video */}
            <div className="lg:col-span-5 order-2 mx-auto w-full max-w-[300px]">
              <div className="relative aspect-[9/16] overflow-hidden rounded-lg">
                <video
                  src={awardsVideo.url}
                  poster={awardCover.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ────────────── DETAIL IMAGE + QUOTE ────────────── */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5">
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <img
              src={editorialPendant.url}
              alt="Close-up of a brass chandelier arm with candle-style bulbs"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="lg:col-span-7">
          <p className="font-serif italic text-3xl sm:text-4xl text-nova-ink font-light leading-snug">
            "We don't sell fixtures. We help you finish a room — and the room is
            the reason anyone comes to us."
          </p>
          <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.35em] text-nova-stone">
            — Greg Johnson, Owner
          </p>
        </div>
      </section>

      {/* ─────────────────── NEXT STEPS ─────────────────── */}
      <section className="bg-nova-cream border-t border-nova-sand">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-24 sm:py-32">
          <div className="text-center mb-16">
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-nova-garnet font-semibold mb-4">
              Next Steps
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-nova-ink leading-[1.05]">
              Begin your project with Nova.
            </h2>
            <div className="mx-auto mt-6 h-px w-12 bg-nova-brass" />
            <p className="mx-auto mt-6 max-w-xl font-sans font-light text-nova-ink/70 leading-relaxed">
              However you like to start — quietly browsing, or shoulder-to-shoulder
              with a designer — we're ready when you are.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                step: "01",
                title: "Visit a Showroom",
                body: "Walk our floors, see fixtures lit as they will be in your home, and meet the team.",
                cta: "Find a Location",
                to: "/locations",
                icon: MapPin,
              },
              {
                step: "02",
                title: "Talk to a Consultant",
                body: "One complimentary hour with a designer — bring your plans, or just your ideas. Prefer to start with a call? Reach us Monday through Saturday, 9 to 6.",
                cta: "Contact Us",
                to: "/contact",
                icon: Phone,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="bg-nova-cream border border-nova-sand p-8 flex flex-col"
                >
                  <p className="font-serif italic text-nova-garnet text-xl mb-4">
                    {s.step}
                  </p>
                  <h3 className="font-serif text-2xl text-nova-ink font-light mb-3 leading-snug">
                    {s.title}
                  </h3>
                  <p className="font-sans text-[14px] font-light text-nova-ink/70 leading-relaxed mb-8 flex-1">
                    {s.body}
                  </p>
                  <Link
                    to={s.to}
                    className="inline-flex items-center gap-2 text-nova-ink border-b border-nova-ink/30 pb-1 self-start text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:border-nova-ink transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
