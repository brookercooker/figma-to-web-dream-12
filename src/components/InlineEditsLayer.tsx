import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/db";
import InlineEditSurface from "@/components/InlineEditSurface";
import type { InlineEdits } from "@/lib/inlineEditCore";
import { useNavigate } from "react-router-dom";
import PageBlocks, { parseBlocks } from "@/components/PageBlocks";
import { codedPages } from "@/pages/admin/codedPages";

/** Shows in-place edits made in the page editor on the public site. */
export default function InlineEditsLayer({ path, children, objectsOnly = false }: { path: string; children: ReactNode; objectsOnly?: boolean }) {
  const navigate = useNavigate();
  const [edits, setEdits] = useState<InlineEdits>({});
  const [objectEdits, setObjectEdits] = useState<Record<string, InlineEdits>>({});
  const [content, setContent] = useState<unknown>(null);
  useEffect(() => {
    (supabase as any).from("object_registry").select("component_key,inline_edits").then(({ data }: any) => {
      const out: Record<string, InlineEdits> = {};
      (data ?? []).forEach((r: any) => { if (r.component_key && r.inline_edits) out[r.component_key] = r.inline_edits; });
      setObjectEdits(out);
    });
  }, [path]);
  useEffect(() => {
    if (objectsOnly) return;
    let live = true;
    const key = path === "/home" ? "/" : path;
    setContent(null);
    (supabase as any).from("pages").select("inline_edits,content").eq("path", key).is("archived_at", null).maybeSingle()
      .then(({ data }: any) => { if (live) { setEdits(data?.inline_edits ?? {}); setContent(data?.content); } });
    return () => { live = false; };
  }, [path, objectsOnly]);
  // One stable key for all Site Manager routes so the manager (and its chat state) survives tab changes.
  const surfaceKey = path.startsWith("/manage") || path.startsWith("/admin") ? "manager" : path;
  return <InlineEditSurface key={surfaceKey} edits={objectsOnly ? {} : edits} objectEdits={objectEdits} navigate={(href) => {
    if (!/^\/(?!\/)/.test(href)) return false;
    navigate(href); return true;
  }}>{children}{!objectsOnly && !path.startsWith("/manage") && !path.startsWith("/admin") && codedPages[path === "/" ? "/home" : path] && <PageBlocks blocks={parseBlocks(content)} />}</InlineEditSurface>;
}
