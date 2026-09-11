import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SimplePage from "./SimplePage";
import NotFound from "./NotFound";

/**
 * Dynamic page renderer for any /:slug that isn't matched by a static route.
 * Looks up the pages table by `path = /:slug`, and renders SimplePage with the
 * page's name. Falls back to NotFound if no matching (non-archived) page exists.
 */
export default function DbPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const path = `/${slug ?? ""}`;
      const { data } = await (supabase as any)
        .from("pages")
        .select("name")
        .eq("path", path)
        .is("archived_at", null)
        .maybeSingle();
      if (!mounted) return;
      setName(data?.name ?? null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <div className="min-h-[60vh]" aria-hidden />;
  if (!name) return <NotFound />;
  return <SimplePage title={name} />;
}
