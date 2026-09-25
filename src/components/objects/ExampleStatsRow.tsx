/** Test example: four stats divided by vertical lines, left-aligned heading with a right-aligned note on the same row. */
export default function ExampleStatsRow() {
  const stats = [
    { n: "75", unit: "yrs", label: "Family-run" },
    { n: "6", unit: "", label: "Showrooms" },
    { n: "120+", unit: "", label: "Brands carried" },
    { n: "14k", unit: "", label: "Homes lit" },
  ];
  return (
    <section className="w-full bg-nova-sand/30 px-6 py-20">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-8">
        <h2 className="font-serif text-3xl font-light text-nova-ink">By the numbers</h2>
        <p className="max-w-xs text-right font-sans text-sm text-nova-stone">Counted at the close of 2025.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-6xl grid-cols-4 divide-x divide-nova-brass/50 border-y border-nova-brass/50">
        {stats.map((s) => (
          <div key={s.label} className="px-8 py-10">
            <p className="font-serif text-5xl font-light text-nova-ink">
              {s.n}
              {s.unit && <span className="ml-1 font-sans text-sm text-nova-stone">{s.unit}</span>}
            </p>
            <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.25em] text-nova-garnet">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
