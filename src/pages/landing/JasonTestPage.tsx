import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSchedule } from "@/pages/admin/landingDates";
import NotFound from "@/pages/NotFound";

const ROUTE = "/landing/jason-test";
const YOUTUBE_ID = "rKX383X8lGU";

/**
 * Jason Test (/landing/jason-test)
 *
 * Visibility is driven entirely by the Site Manager row for this path
 * (build_status + start_at + end_at). This component never hard-codes it.
 */
export default function JasonTestPage() {
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

  if (row.build_status !== "ready") {
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
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-28">
        <h1 className="font-serif text-4xl md:text-5xl leading-tight text-ink mb-4">
          {row.name}
        </h1>
        {row.description ? (
          <p className="font-sans text-ink/70 text-base md:text-lg leading-relaxed mb-10 max-w-2xl">
            {row.description}
          </p>
        ) : (
          <div className="mb-10" />
        )}

        <div className="aspect-video overflow-hidden rounded-lg bg-sand/40">
          <iframe
            src={`https://www.youtube.com/embed/${YOUTUBE_ID}`}
            title={`YouTube video ${YOUTUBE_ID}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full border-0"
          />
        </div>
      </section>
    </div>
  );
}
