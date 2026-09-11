import { useParams } from "react-router-dom";
import TeamPreview from "@/components/TeamPreview";
import GoogleReviews from "@/components/GoogleReviews";
import NovaInTheNews from "@/components/objects/NovaInTheNews";
import FeaturedBrand from "@/components/objects/FeaturedBrand";
import ExploreOurProducts from "@/components/objects/ExploreOurProducts";
import InspirationGalleries from "@/components/objects/InspirationGalleries";

const objectRegistry: Record<string, { title: string; render: () => JSX.Element }> = {
  "explore-our-products":  { title: "Explore Our Products",  render: () => <ExploreOurProducts /> },
  "featured-brand":        { title: "Featured Brand",        render: () => <FeaturedBrand /> },
  "inspiration-galleries": { title: "Inspiration Galleries", render: () => <InspirationGalleries /> },
  "meet-the-team":         { title: "Meet the Team",         render: () => <TeamPreview /> },
  "news":                  { title: "News",                  render: () => <NovaInTheNews /> },
  "reviews":               { title: "Reviews",               render: () => <GoogleReviews /> },
};


const Objects = () => {
  const { name } = useParams();

  if (name) {
    const entry = objectRegistry[name];
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="font-serif text-2xl text-ink text-center mb-8">
          Object: <span className="text-garnet">{entry?.title ?? name}</span>
        </p>
        {entry ? (
          <div className="max-w-5xl mx-auto">{entry.render()}</div>
        ) : (
          <p className="text-center text-stone mt-2 font-sans text-sm">
            No object registered for <code>/objects/{name}</code>. Add it to{" "}
            <code>src/pages/Objects.tsx</code>.
          </p>
        )}
      </div>
    );
  }


  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-cream p-6">
      <div className="max-w-md w-full relative group">
        {/* Soft brass/garnet glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-tr from-brass/20 to-garnet/5 rounded-sm blur opacity-30 group-hover:opacity-50 transition duration-1000" />

        <div className="relative bg-cream border border-sand px-8 py-10 rounded-sm shadow-[0_4px_20px_-10px_hsl(var(--brass)/0.3)]">
          {/* Brass corner accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-brass/50" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-brass/50" />

          <div className="space-y-6">
            <header>
              <h1 className="font-serif text-3xl font-semibold text-ink leading-tight">
                Object Sandbox
              </h1>
            </header>


            <div className="h-px w-12 bg-garnet/40" />

            <p className="font-sans text-ink/70 leading-relaxed font-light text-sm">
              Refine and prototype individual items, sections, or components (objects) in
              isolation before placing them onto a full page. Use the following path to create an object:
            </p>

            <div className="bg-sand/40 border-l-2 border-brass p-4 font-sans text-sm font-light flex items-center justify-between">
              <span className="text-ink/80">
                /objects/<span className="text-garnet font-semibold">[name]</span>
              </span>
            </div>

            <p className="font-sans text-ink/70 leading-relaxed font-light text-sm">
              Replace <span className="text-garnet">[name]</span> with the name of the object (avoid spaces or punctuation). For example{" "}
              <span className="text-ink">/objects/hero-banner</span> or{" "}
              <span className="text-ink">/objects/product-card</span>.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Objects;
