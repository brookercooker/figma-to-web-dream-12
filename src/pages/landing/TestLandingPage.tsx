import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { Button } from "@/components/ui/button";
import { formatSchedule } from "@/pages/admin/landingDates";
import NotFound from "@/pages/NotFound";

const ROUTE = "/landing/test-landing-page";

/**
 * Test Landing Page (/landing/test-landing-page)
 *
 * Visibility is driven entirely by the Site Manager row for this path
 * (status + start_at + end_at). This component never hard-codes visibility.
 */
export default function TestLandingPage() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("pages")
        .select("*")
        .eq("path", ROUTE)
        .eq("page_type", "landing")
        .maybeSingle();
      if (!alive) return;
      setRow(data ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="min-h-[60vh]" aria-hidden />;
  if (!row) return <NotFound />;

  const now = Date.now();
  const start = row.start_at ? new Date(row.start_at).getTime() : null;
  const end = row.end_at ? new Date(row.end_at).getTime() : null;

  const Centered = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 gap-3 bg-cream">
      {children}
    </div>
  );

  if ((row as any).build_status !== "ready") {
    return <Centered><h1 className="font-serif text-3xl text-ink">Coming soon</h1></Centered>;
  }
  if (start && now < start) {
    return <Centered><h1 className="font-serif text-3xl text-ink">Coming on {formatSchedule(row.start_at)}</h1></Centered>;
  }
  if (end && now > end) {
    return (
      <Centered>
        <h1 className="font-serif text-3xl text-ink">This page has expired</h1>
        <Link to="/home" className="underline text-sm text-ink/70">Return to the home page</Link>
      </Centered>
    );
  }

  return (
    <div className="bg-cream text-ink">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sand/60 via-cream to-glow/40" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 py-28 md:py-36 text-center">
          <p className="font-sans uppercase tracking-[0.2em] text-xs text-garnet mb-4">
            Nova Lighting
          </p>
          <h1 className="font-serif text-5xl md:text-6xl leading-tight text-ink mb-6">
            {row.name}
          </h1>
          <p className="font-sans text-ink/70 max-w-2xl mx-auto text-base md:text-lg mb-10 leading-relaxed">
            {row.description ||
              "A quiet, considered space to introduce this campaign. Refine the headline and copy to suit the story you want to tell."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild className="rounded-none">
              <Link to="/contact">Book a Consultation</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-none border-ink/20">
              <Link to="/locations">Visit a Showroom</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PLACEHOLDER — Featured Products / Collection */}
      <SectionPlaceholder
        label="Featured Products"
        hint="Drop in an ExploreOurProducts or curated product grid Object here."
      />

      {/* PLACEHOLDER — Featured Brand */}
      <SectionPlaceholder
        label="Featured Brand"
        hint="Use the FeaturedBrand Object to highlight a partner brand."
      />

      {/* PLACEHOLDER — Inspiration Gallery */}
      <SectionPlaceholder
        label="Inspiration Gallery"
        hint="Use the InspirationGalleries Object for lifestyle imagery."
      />

      {/* PLACEHOLDER — Social Proof */}
      <SectionPlaceholder
        label="Social Proof"
        hint="Use the Reviews (GoogleReviews) Object or a testimonial block."
      />

      {/* CTA */}
      <section className="border-t border-sand/70">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
            Let's design your space
          </h2>
          <p className="font-sans text-ink/70 mb-8 max-w-xl mx-auto">
            Sit down with a Nova Lighting consultant and plan a room worth coming home to.
          </p>
          <Button asChild className="rounded-none">
            <Link to="/contact">Book a Consultation</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionPlaceholder({ label, hint }: { label: string; hint: string }) {
  return (
    <section className="border-t border-sand/70">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <p className="font-sans uppercase tracking-[0.2em] text-[10px] text-stone mb-3">
          Section placeholder
        </p>
        <h2 className="font-serif text-2xl md:text-3xl text-ink mb-3">{label}</h2>
        <div className="rounded-none border border-dashed border-stone/40 bg-sand/20 p-10 text-center">
          <p className="font-sans text-sm text-ink/60">{hint}</p>
        </div>
      </div>
    </section>
  );
}
