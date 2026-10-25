/** Shared-object scope is announced before edits can be saved, including autosave. */
export default function SharedObjectNotice({ componentKey }: { componentKey?: string }) {
  return <div role="note" className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
    {componentKey === "Header" ? "This edit changes the header on every page" : "Changes Here Apply Everywhere This Object Is Used."}
  </div>;
}
