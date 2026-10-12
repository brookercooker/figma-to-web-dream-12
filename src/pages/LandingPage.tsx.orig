import { inEditorPreview } from "@/lib/editorPreview";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "@/prototype/client";
import { formatSchedule } from "@/pages/admin/landingDates";
import NotFound from "./NotFound";
import { isPublicLandingHost } from "@/lib/publicHost";
import LandingScaffold from "@/components/landing/LandingScaffold";

/**
 * Renderer for /landing/:slug.
 *
 * Visibility model:
 *  - Draft  → always shows the branded "Landing Page Under Construction"
 *             scaffold (with the page's Name as the highlighted header).
 *  - Ready  → the built page renders. If nothing has been built yet (the
 *             DB-backed default), we show a simple "Coming soon" placeholder.
 *
 * Custom React-component landing pages registered in
 * `./landing/customLandingPages.ts` bypass this renderer entirely on both the
 * admin surface and the public subdomain.
 */
export default function LandingPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setRedirectTo(null);
    (async () => {
      const path = `/landing/${slug ?? ""}`;
      const { data } = await (supabase as any)
        .from("pages")
        .select("*")
        .eq("path", path)
        .eq("page_type", "landing")
        .maybeSingle();
      if (!alive) return;
      if (data) {
        setRow(data);
        setLoading(false);
        return;
      }
      const { data: r } = await (supabase as any)
        .from("page_redirects")
        .select("to_path")
        .eq("from_path", path)
        .maybeSingle();
      if (!alive) return;
      if (r?.to_path && r.to_path !== path) setRedirectTo(r.to_path);
      setRow(null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  if (loading) return <div className="min-h-[60vh]" aria-hidden />;
  if (redirectTo && !inEditorPreview()) {
    const target = isPublicLandingHost()
      ? redirectTo.replace(/^\/landing\//, "/")
      : redirectTo;
    return <Navigate to={target} replace />;
  }
  if (!row) return <NotFound />;

  const now = Date.now();
  const start = row.start_at ? new Date(row.start_at).getTime() : null;
  const end = row.end_at ? new Date(row.end_at).getTime() : null;
  const centered = (children: React.ReactNode) => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 gap-3">
      {children}
    </div>
  );

  // Draft → under-construction scaffold with the page's name.
  if ((row as any).build_status !== "ready") {
    return <LandingScaffold name={row.name} />;
  }

  // Ready but scheduled in the future.
  if (start && now < start) {
    return centered(<h1 className="font-serif text-3xl">Coming on {formatSchedule(row.start_at)}</h1>);
  }
  if (end && now > end) {
    return centered(
      <>
        <h1 className="font-serif text-3xl">This page has expired</h1>
        <Link to="/home" className="underline text-sm">Return to the home page</Link>
      </>,
    );
  }

  // Ready, in window. If the author chose to publish as-is, keep showing the
  // scaffold; otherwise show a simple "Coming soon" placeholder.
  if ((row as any).scaffold_dismissed === false) {
    return <LandingScaffold name={row.name} />;
  }
  return centered(<h1 className="font-serif text-3xl">Coming soon</h1>);
}
