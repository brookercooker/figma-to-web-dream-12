/** Test example: centered heading, then a horizontal timeline — year above a dot on a shared line, caption below. */
export default function ExampleTimeline() {
  const steps = [
    { year: "1951", title: "A single storefront", body: "Lamps repaired and rewired on Main Street." },
    { year: "1978", title: "The first showroom", body: "Lighting shown as it would live at home." },
    { year: "2004", title: "Design services", body: "In-home consultations become part of every project." },
    { year: "2026", title: "Six locations", body: "Still family-run, still hand-selected." },
  ];
  return (
    <section className="w-full bg-nova-cream px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-stone">Our history</p>
        <h2 className="mt-4 font-serif text-4xl font-light text-nova-ink">
          Lighting homes <em className="text-nova-garnet">since 1951</em>
        </h2>
      </div>
      <div className="relative mx-auto mt-16 max-w-5xl">
        <div className="absolute left-0 right-0 top-[52px] h-px bg-nova-sand" />
        <ol className="grid grid-cols-4 gap-8">
          {steps.map((s) => (
            <li key={s.year} className="relative text-center">
              <p className="font-serif text-2xl text-nova-garnet">{s.year}</p>
              <span className="mx-auto mt-4 block h-3 w-3 rounded-full border border-nova-brass bg-nova-cream" />
              <h3 className="mt-6 font-serif text-xl text-nova-ink">{s.title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-nova-stone">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
