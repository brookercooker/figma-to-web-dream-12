import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/prototype/client";
import InlineEditSurface, { type InlineEdits } from "@/components/InlineEditSurface";

/** Shows in-place edits made in the page editor on the public site. */
export default function InlineEditsLayer({ path, children }: { path: string; children: ReactNode }) {
  const [edits, setEdits] = useState<InlineEdits>({});
  useEffect(() => {
    let live = true;
    const key = path === "/" ? "/home" : path;
    (supabase as any).from("pages").select("inline_edits").eq("path", key).is("archived_at", null).maybeSingle()
      .then(({ data }: any) => { if (live) setEdits(data?.inline_edits ?? {}); });
    return () => { live = false; };
  }, [path]);
  return <InlineEditSurface key={path} edits={edits}>{children}</InlineEditSurface>;
}
