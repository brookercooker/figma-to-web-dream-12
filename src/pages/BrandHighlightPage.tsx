import Breadcrumbs from "@/components/Breadcrumbs";
import { HINKLEY_BRAND, type FeaturedBrandData } from "@/components/objects/FeaturedBrand";

/** Highlights the products of a single brand. */
const BrandHighlightPage = ({ brand = HINKLEY_BRAND }: { brand?: FeaturedBrandData }) => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-[1400px] px-4 sm:px-8 pt-4 pb-2">
      <Breadcrumbs />
    </div>

    <section className="mx-auto max-w-4xl px-6 sm:px-10 pt-16 sm:pt-24 pb-16 text-center">
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className="h-px w-8 bg-brass" />
        <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-garnet font-semibold">Brand Highlight</p>
        <span className="h-px w-8 bg-brass" />
      </div>
      <h1 className="font-serif text-6xl md:text-8xl text-ink font-light leading-[0.9] tracking-tight">{brand.name}</h1>
      <p className="mt-5 font-serif italic text-lg text-ink/80">{brand.tagline}</p>
    </section>

    <section className="mx-auto max-w-6xl px-6 sm:px-10 pb-24">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {brand.products.map((p) => (
          <a
            key={p.sku}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-cream border border-sand rounded-lg overflow-hidden"
          >
            <div className="aspect-[4/5] bg-sand/30 overflow-hidden">
              <img
                src={p.image}
                alt={`${p.name} ${p.category} in ${p.finish} by ${brand.name}`}
                loading="lazy"
                className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="px-6 py-6">
              <p className="text-[10px] font-sans tracking-[0.28em] uppercase text-stone mb-2">{p.category}</p>
              <h2 className="font-serif text-2xl text-ink leading-tight mb-1">{p.name}</h2>
              <p className="font-sans text-xs text-stone italic mb-4">{p.finish}</p>
              <p className="font-sans text-sm font-light text-ink/75 leading-relaxed">{p.description}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  </div>
);

export default BrandHighlightPage;
