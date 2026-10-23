import { useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "./ConfirmDialog";
import { ToolGroup } from "./designChat/ToolPanel";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { parseKey, type InlineEdits } from "@/lib/inlineEditCore";
import type { InlineReports, InlineSelection } from "@/components/InlineEditSurface";

export default function InlineEditSafetyPanel({ reports, selection, editsFor, discard, record, resetAll, objectName }: {
  objectName?: string;
  reports: InlineReports;
  selection: InlineSelection | null;
  editsFor: (scope: string) => InlineEdits;
  discard: (scope: string, path: string) => void;
  record: () => void;
  resetAll: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const orphaned = Object.entries(reports).flatMap(([scope, report]) => report.orphaned.map((o) => ({ ...o, scope })));
  const unchecked = Object.values(reports).reduce((n, report) => n + report.unchecked.length, 0);
  const label = (scope: string, path: string, kinds: string[]) => {
    const text = Object.entries(editsFor(scope)).find(([key]) => { const p = parseKey(key); return p?.kind === "html" && p.path === path; })?.[1];
    const plain = text?.replace(/<[^>]*>/g, "").trim().slice(0, 70);
    return kinds.includes("link") ? "Link" : kinds.includes("html") ? `Text ${scope === "page" ? "on this page" : "in this shared object"}${plain ? `, saved edit starts with: ${plain}…` : ""}` : kinds.includes("img") ? "Picture" : kinds.includes("icon") ? "Icon" : "Appearance or position";
  };
  return <div className="mt-4 space-y-3 border-t pt-3">
    {orphaned.length > 0 && <ToolGroup title="Edits That Could Not Be Applied" icon={ShieldAlert} summary={String(orphaned.length)}>
      <p className="text-xs text-muted-foreground">{orphaned.length} saved {orphaned.length === 1 ? "edit could" : "edits could"} not be applied.</p>
      {orphaned.map((o) => <div key={`${o.scope}|${o.path}`} className="space-y-2 border-b py-2 text-xs">
        <p>{label(o.scope, o.path, o.kinds)}</p><p className="text-muted-foreground">{o.reason}</p>
        <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" onClick={() => discard(o.scope, o.path)}>Discard This Edit</Button><Button size="sm" variant="ghost">Keep For Now</Button></div>
      </div>)}
    </ToolGroup>}
    {unchecked > 0 && <div className="space-y-2"><p className="text-xs font-medium">{unchecked} Edits Not Yet Verified</p><Button size="sm" variant="outline" title="Do this while the page still looks right." onClick={record}>Record Fingerprints</Button></div>}
    <div className="flex flex-wrap gap-2">
      {selection && <Button size="sm" variant="outline" onClick={() => discard(selection.scope, selection.key)}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reset Element</Button>}
      <Button size="sm" variant="ghost" onClick={() => setConfirm(true)}>{objectName ? "Reset All Edits on This Object" : "Reset All Edits on This Page"}</Button>
    </div>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={objectName ? "Reset All Edits on This Object" : "Reset All Edits on This Page"} description={objectName ? "Remove this object’s in-place edits everywhere it is used?" : "Remove this page’s in-place edits, including edits to shared objects shown here? Shared-object edits will also be removed everywhere those objects are used."} confirmLabel="Reset All Edits" onConfirm={resetAll} />
  </div>;
}
