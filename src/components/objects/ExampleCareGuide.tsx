import { Droplets, Sun, Wrench, Clock } from "lucide-react";

/** Test example: left sticky heading column, right 2x2 icon grid, numbered notes and a bottom rule. */
export default function ExampleCareGuide() {
  const tips = [
    { icon: Droplets, title: "Dust, don't wash", body: "A soft, dry cloth keeps hand-rubbed finishes as they left the workshop." },
    { icon: Sun, title: "Mind the window", body: "Direct afternoon sun deepens brass faster. Some clients prefer that." },
    { icon: Wrench, title: "Tighten once a year", body: "Canopies and arms settle over time. A quarter turn is usually enough." },
    { icon: Clock, title: "Warm bulbs, long life", body: "2700K lamps are kinder to shades and to the room." },
  ];
  return (
    <section className="w-full bg-nova-cream px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-garnet">Care guide</p>
          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-nova-ink">Designed to be lived with.</h2>
          <p className="mt-6 font-sans text-sm leading-relaxed text-nova-stone">
            A few habits that keep fixtures looking the way they did on install day.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-12 gap-y-14 sm:grid-cols-2">
          {tips.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="border-t border-nova-sand pt-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-nova-brass" strokeWidth={1.5} />
                  <span className="font-serif text-lg italic text-nova-garnet">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-serif text-2xl font-light text-nova-ink">{t.title}</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-nova-ink/70">{t.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
