import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/db";
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
  // One stable key for all Site Manager routes so the manager (and its chat state) survives tab changes.
  const surfaceKey = path.startsWith("/manage") || path.startsWith("/admin") ? "manager" : path;
  return <InlineEditSurface key={surfaceKey} edits={edits} objectEdits={objectEdits}>{children}</InlineEditSurface>;
}
