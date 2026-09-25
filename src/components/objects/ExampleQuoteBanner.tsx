import room from "@/assets/card-design-services.jpg";

/** Test example: full-bleed photo with dark wash, quote pinned bottom-left, attribution right. */
export default function ExampleQuoteBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      <img src={room} alt="Living room lit in the evening" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-nova-ink/55" />
      <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col justify-end px-6 py-16">
        <p className="max-w-2xl font-serif text-4xl font-light italic leading-snug text-nova-cream">
          "They lit the house the way we'd always pictured it — and a few ways we never thought to."
        </p>
        <div className="mt-10 flex items-end justify-between border-t border-nova-cream/30 pt-6">
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-nova-cream/80">The Whitaker residence · Park City</p>
          <a href="#" className="font-sans text-[11px] uppercase tracking-[0.22em] text-nova-cream underline underline-offset-4">
            View the project
          </a>
        </div>
      </div>
    </section>
  );
}
