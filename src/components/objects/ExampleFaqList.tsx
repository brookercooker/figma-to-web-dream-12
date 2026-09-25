import { Plus } from "lucide-react";

/** Test example: sticky-style intro column left, FAQ rows right — question left, plus icon far right, answer below, line between rows. */
export default function ExampleFaqList() {
  const faqs = [
    { q: "Do you install what you sell?", a: "Yes. Our own electricians handle installation across the Wasatch Front." },
    { q: "Can I borrow a fixture before buying?", a: "Table and floor lamps can go home for a weekend with a small deposit." },
    { q: "How long do special orders take?", a: "Most arrive in four to eight weeks. We call when yours ships." },
  ];
  return (
    <section className="w-full bg-nova-cream px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="font-serif text-4xl font-light text-nova-ink">Questions</h2>
          <p className="mt-4 font-sans text-sm text-nova-stone">
            Something else? <a href="#" className="text-nova-ink underline underline-offset-4">Write to us</a>.
          </p>
        </div>
        <dl className="divide-y divide-nova-sand border-t border-nova-sand">
          {faqs.map((f) => (
            <div key={f.q} className="py-6">
              <dt className="flex items-center justify-between gap-6 font-serif text-xl text-nova-ink">
                {f.q}
                <Plus className="h-4 w-4 shrink-0 text-nova-brass" />
              </dt>
              <dd className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-nova-stone">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
