import { Check } from "lucide-react";

/** Test example: centred header, three outlined cards (middle one inverted), footnote. */
export default function ExampleServiceTiers() {
  const tiers = [
    { name: "Consult", price: "Complimentary", note: "One hour with a designer", items: ["Room walkthrough", "Fixture shortlist"], dark: false },
    { name: "Plan", price: "$450", note: "Credited toward your order", items: ["Full lighting plan", "Layered scenes", "Two revisions"], dark: true },
    { name: "Install", price: "Quoted", note: "Coordinated with your builder", items: ["Delivery", "On-site oversight"], dark: false },
  ];
  return (
    <section className="w-full bg-nova-cream px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-stone">Working together</p>
        <h2 className="mt-4 font-serif text-5xl font-light text-nova-ink">Three ways to begin</h2>
      </div>
      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-lg border p-8 ${t.dark ? "border-nova-ink bg-nova-ink text-nova-cream" : "border-nova-sand text-nova-ink"}`}
          >
            <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-brass">{t.name}</p>
            <p className="mt-4 font-serif text-4xl font-light">{t.price}</p>
            <p className={`mt-2 font-sans text-sm ${t.dark ? "text-nova-cream/70" : "text-nova-stone"}`}>{t.note}</p>
            <ul className="mt-8 flex-1 space-y-3">
              {t.items.map((i) => (
                <li key={i} className="flex items-center gap-3 font-sans text-sm">
                  <Check className="h-4 w-4 text-nova-brass" /> {i}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className={`mt-10 border px-6 py-3 text-center font-sans text-[11px] uppercase tracking-[0.22em] ${t.dark ? "border-nova-cream" : "border-nova-ink"}`}
            >
              Choose {t.name}
            </a>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-md text-center font-sans text-xs text-nova-stone">
        Plans are credited in full when fixtures are ordered through Nova.
      </p>
    </section>
  );
}
