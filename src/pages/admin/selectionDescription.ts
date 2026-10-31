import type { InlineSelection } from "@/components/InlineEditSurface";
import { remoteSnapshot } from "./remoteSelection";

export function selectionDescription(sel: InlineSelection) {
  const snapshot = remoteSnapshot(sel.el);
  const plain = (snapshot?.text ?? sel.el.textContent ?? "").replace(/\s+/g, " ").trim();
  const attr = (name: string) => snapshot?.attrs?.[name] ?? sel.el.getAttribute(name) ?? "";
  const filename = (src: string) => { try { return decodeURIComponent(new URL(src, window.location.origin).pathname.split("/").pop() ?? ""); } catch { return ""; } };
  const kind = sel.kind === "image" ? "Picture" : sel.kind === "video" ? "Video" : sel.kind === "input" ? "Form Field" : /^h[1-6]$/i.test(sel.el.tagName) ? "Heading" : sel.el.tagName === "BUTTON" ? "Button" : sel.link ? "Link" : "Text";
  const label = sel.kind === "image" ? attr("alt") || filename(attr("src")) || kind : sel.kind === "video" ? attr("title") || filename(attr("src")) || kind : sel.kind === "input" ? attr("label") || attr("placeholder") || kind : plain;
  const short = label.length > 60 ? `${label.slice(0, 59).trimEnd()}…` : label;
  return { title: sel.kind === "text" && short ? `“${short}”` : short || kind, subtitle: snapshot?.context?.trim() || kind, thumbnail: sel.kind === "image" ? attr("src") : undefined };
}