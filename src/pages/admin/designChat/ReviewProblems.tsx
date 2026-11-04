import { useDesignChat } from "./DesignChatContext";
import { problemsModel } from "./logic";

/** The review result in the chat and the review view. Blocked changes only say a developer will review them; fixing is done on the Developer Review page. */
export default function ReviewProblems() {
  const { state } = useDesignChat();
  const problems = problemsModel(state);
  if (!problems) return null;
  return (
    <div role="status" className="self-stretch rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
      <h3 className="text-sm font-semibold text-destructive">{problems.title}</h3>
      <p className="text-xs">{problems.sub}</p>
      {problems.devNote && <p className="text-xs">{problems.devNote}</p>}
    </div>
  );
}
