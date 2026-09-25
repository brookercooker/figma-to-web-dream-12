import fans from "@/assets/category-fans.jpg";
import table from "@/assets/category-table-lamp.jpg";
import { MapPin } from "lucide-react";

/** Test example: sand band with inline heading + button, then two image cards with captions beside a tall text column. */
export default function ExampleVisitStrip() {
  return (
    <section className="w-full bg-nova-sand/40 px-6 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-4xl font-light text-nova-ink">See it lit, in person.</h2>
        <a href="#" className="inline-flex items-center gap-2 bg-nova-ink px-6 py-3 font-sans text-[11px] uppercase tracking-[0.22em] text-nova-cream">
          <MapPin className="h-3.5 w-3.5" /> Plan a visit
        </a>
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        {[
          { img: fans, city: "Salt Lake City", hours: "Mon–Sat · 9 to 6" },
          { img: table, city: "Park City", hours: "Tue–Sat · 10 to 5" },
        ].map((l) => (
          <figure key={l.city}>
            <img src={l.img} alt={`${l.city} showroom`} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <figcaption className="mt-4 flex items-baseline justify-between">
              <span className="font-serif text-xl text-nova-ink">{l.city}</span>
              <span className="font-sans text-xs text-nova-stone">{l.hours}</span>
            </figcaption>
          </figure>
        ))}
        <div className="flex flex-col justify-center text-right">
          <p className="font-serif text-6xl font-light text-nova-garnet">6</p>
          <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.3em] text-nova-stone">Showrooms across Utah</p>
          <p className="mt-6 font-sans text-sm leading-relaxed text-nova-ink/70">
            Every floor is lit as a home would be, so you can judge warmth and glare before you choose.
          </p>
        </div>
      </div>
    </section>
  );
}
