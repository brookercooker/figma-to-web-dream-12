import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSchedule } from "@/pages/admin/landingDates";
import NotFound from "@/pages/NotFound";
import MailchimpForm from "@/components/objects/MailchimpForm";

const ROUTE = "/landing/summer-sale";

/**
 * Summer Sale landing page (/landing/summer-sale)
 * Renders the Newsletter Signup object. Visibility is driven by the Site
 * Manager row for this path (build_status + start_at + end_at).
 */
export default function SummerSaleLandingPage() {
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
      <MailchimpForm tags={["Test of Object"]} />
    </div>
  );
}
