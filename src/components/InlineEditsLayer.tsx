import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/prototype/client";
import InlineEditSurface, { type InlineEdits } from "@/components/InlineEditSurface";

/** Shows in-place edits made in the page editor on the public site. */
export default function InlineEditsLayer({ path, children }: { path: string; children: ReactNode }) {
  const [edits, setEdits] = useState<InlineEdits>({});
  const [objectEdits, setObjectEdits] = useState<Record<string, InlineEdits>>({});
  useEffect(() => {
    (supabase as any).from("object_registry").select("component_key,inline_edits").then(({ data }: any) => {
      const out: Record<string, InlineEdits> = {};
      (data ?? []).forEach((r: any) => { if (r.component_key && r.inline_edits) out[r.component_key] = r.inline_edits; });
      setObjectEdits(out);
    });
  }, [path]);
  useEffect(() => {
    let live = true;
    const key = path === "/" ? "/home" : path;
    (supabase as any).from("pages").select("inline_edits").eq("path", key).is("archived_at", null).maybeSingle()
      .then(({ data }: any) => { if (live) setEdits(data?.inline_edits ?? {}); });
    return () => { live = false; };
  }, [path]);
  return <InlineEditSurface key={path} edits={edits} objectEdits={objectEdits}>{children}</InlineEditSurface>;
}
