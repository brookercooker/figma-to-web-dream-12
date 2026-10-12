import PreviewPanel from "./designChat/PreviewPanel";

/**
 * The Preview tab: the draft of the design site. The chat that changes it is always on the right of the Site Manager (see
 * AdminIndex.tsx and designChat/ChatPanel.tsx), and the buttons for it are in the top bar (designChat/PreviewTools.tsx);
 * the state they share lives in designChat/DesignChatContext.tsx.
 *
 * Requests go to the design helper (prototyper-local), which makes the change in the builder, keeps every unpublished change
 * together as a draft, checks the whole draft once when "Submit for review" is pressed, and puts it live if the check passes.
 * The preview is a short-lived embed address from the `lovable-embed-url` function (the API key stays on the server).
 */
export default function DesignChatTab() {
  return <PreviewPanel />;
}
