import { Button } from "@/components/ui/button";
import { postToHelper } from "./helper";
import { useDesignChat } from "./DesignChatContext";
import { problemsModel } from "./logic";

/** The review's problems with "Fix this for me" — one implementation, shown in the chat and in the review view. */
export default function ReviewProblems() {
  const { state, refreshSoon } = useDesignChat();
  const problems = problemsModel(state);
  if (!problems) return null;
  const fixIds = async (ids: string[]) => { await postToHelper("/fix", { findingIds: ids }); refreshSoon(); };
  return (
    <div className="self-stretch rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
      <h3 className="text-sm font-semibold text-destructive">{problems.title}</h3>
      <p className="text-xs">{problems.sub}</p>
      {problems.items.map((f) => (
        <div key={f.id} className="rounded-md border bg-background p-2 text-xs space-y-1">
          <div>{f.issue}</div>
          {f.request && <div className="text-muted-foreground">From your request: {f.request}</div>}
          {f.fix && !/developer/i.test(f.fix) && <div className="text-muted-foreground">Suggested fix: {f.fix}</div>}
          <Button type="button" size="sm" variant="outline" onClick={(ev) => { (ev.currentTarget as HTMLButtonElement).disabled = true; void fixIds([f.id]); }}>
            Fix this for me
          </Button>
        </div>
      ))}
      {problems.items.length > 1 && (
        <Button type="button" size="sm" onClick={(ev) => { (ev.currentTarget as HTMLButtonElement).disabled = true; void fixIds(problems.items.map((f) => f.id)); }}>
          Fix All {problems.items.length} for me
        </Button>
      )}
      {problems.devNote && <p className="text-xs">{problems.devNote}</p>}
    </div>
  );
}
