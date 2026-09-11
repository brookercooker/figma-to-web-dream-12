import QuorumNewArrivals from "@/components/objects/QuorumNewArrivals";

const FeaturedBrandQuorum = () => {
  const now = new Date();
  const currentMonthYear = `${now.toLocaleString("en-US", { month: "short" })} — ${now.getFullYear()}`;

  return (
    <section className="bg-sand/20 border-y border-sand">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-20 sm:pt-28 pb-8">
        <div className="w-full flex flex-col items-center space-y-6">
          {/* Eyebrow with brass rules */}
          <div className="flex items-center gap-4">
            <span className="h-px w-8 bg-brass" />
            <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-garnet font-semibold">
              Featured Brand of the Month
            </p>
            <span className="h-px w-8 bg-brass" />
          </div>

          {/* Brand lockup */}
          <div className="relative flex flex-col items-center">
            <p className="absolute -left-20 top-1/2 -translate-y-1/2 hidden md:block font-sans text-[9px] uppercase tracking-[0.3em] text-brass [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
              {currentMonthYear}
            </p>
            <h2 className="font-serif text-7xl md:text-8xl text-ink leading-[0.8] font-light tracking-tight">
              Quorum
            </h2>
            <p className="mt-4 font-serif italic text-lg text-ink/80">
              Timeless Design, Refined Craft
            </p>
          </div>

          {/* Ornamental garnet dot */}
          <div className="pt-2">
            <span className="block w-1.5 h-1.5 rounded-full bg-garnet" />
          </div>
        </div>
      </div>
      <QuorumNewArrivals hideHeader />
    </section>
  );
};

export default FeaturedBrandQuorum;
