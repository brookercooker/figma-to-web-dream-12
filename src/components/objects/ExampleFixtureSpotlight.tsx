import lamp from "@/assets/category-floor-lamp.jpg";
import { ArrowRight } from "lucide-react";

/** Test example: image left, specs list right, two buttons, stat row below. */
export default function ExampleFixtureSpotlight() {
  return (
    <section className="w-full bg-nova-cream px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-[1.1fr_1fr]">
        <img src={lamp} alt="Brass floor lamp beside a linen armchair" className="aspect-[4/5] w-full rounded-lg object-cover" />
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-garnet">Fixture of the month</p>
          <h2 className="mt-4 font-serif text-5xl font-light leading-[1.05] text-nova-ink">
            The Arden <em className="text-nova-stone">floor lamp</em>
          </h2>
          <div className="mt-6 h-px w-12 bg-nova-brass" />
          <p className="mt-6 max-w-md font-sans text-[15px] font-light leading-relaxed text-nova-ink/70">
            Hand-finished brass, a pleated linen shade, and a dimmer that lives where your hand expects it.
          </p>
          <dl className="mt-10 divide-y divide-nova-sand border-y border-nova-sand">
            {[
              ["Finish", "Aged brass"],
              ["Height", "62 in"],
              ["Lamping", "E26, dimmable"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3">
                <dt className="font-sans text-[11px] uppercase tracking-[0.24em] text-nova-stone">{k}</dt>
                <dd className="font-serif text-lg text-nova-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex items-center gap-6">
            <a href="#" className="bg-nova-ink px-7 py-3 font-sans text-[11px] uppercase tracking-[0.22em] text-nova-cream">Shop the lamp</a>
            <a href="#" className="inline-flex items-center gap-2 border-b border-nova-ink/30 pb-1 font-sans text-[11px] uppercase tracking-[0.22em] text-nova-ink">
              See the collection <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
