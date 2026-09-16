import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/prototype/client";
import { objectRegistry } from "@/components/objects/registry";
import ObjectSections, { parseSections, type Section } from "@/components/ObjectSections";

/**
 * Renders a saved object by reference, so a page always shows the object's
 * latest design — editing it in the Objects tab updates every page using it.
 */
export default function ObjectBlockView({ objectId, name }: { objectId: string; name?: string }) {
  const [row, setRow] = useState<any | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("object_registry")
        .select("*")
        .eq("id", objectId)
        .maybeSingle();
      if (cancelled) return;
      if (!data) setMissing(true);
      else { setRow(data); setMissing(false); }
    })();
    return () => { cancelled = true; };
  }, [objectId]);

  if (missing) {
    return (
      <div className="my-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {name ? `“${name}” is no longer available.` : "This object is no longer available."}
      </div>
    );
  }
  if (!row) return <div className="my-6 h-40 animate-pulse rounded-lg bg-muted" aria-hidden />;

  const entry = row.component_key ? objectRegistry[row.component_key] : undefined;
  const designed: Section[] = parseSections(row.content);

  if (entry) {
    const C = entry.component as React.ComponentType;
    return (
      <div className="my-6">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
          <C />
        </Suspense>
      </div>
    );
  }

  if (designed.length) return <div className="my-6"><ObjectSections sections={designed} /></div>;

  return (
    <div className="my-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {row.name} has nothing designed yet.
    </div>
  );
}
