import diff from "fast-diff";
import { clean } from "@/lib/inlineEditCore";

/** Patch text nodes only; unchanged runs retain their original inline formatting. */
export function replaceWording(html: string, text: string): string {
  const host = document.createElement("div"); host.innerHTML = clean(html);
  // Treat visible line breaks as text so a multiline field round-trips naturally.
  host.querySelectorAll("br").forEach(br => br.replaceWith(document.createTextNode("\n")));
  const original = host.textContent ?? "";
  let cursor = 0;
  const operations: { at: number; remove: number; insert: string }[] = [];
  for (const [kind, value] of diff(original, text)) {
    if (kind === 0) cursor += value.length;
    else if (kind === -1) { operations.push({ at: cursor, remove: value.length, insert: "" }); cursor += value.length; }
    else operations.push({ at: cursor, remove: 0, insert: value });
  }
  const locate = (offset: number): [Node, number] => {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode(), last: Node | null = null;
    while (node) { const len = node.textContent?.length ?? 0; if (offset <= len) return [node, offset]; offset -= len; last = node; node = walker.nextNode(); }
    if (last) return [last, last.textContent?.length ?? 0];
    const empty = document.createTextNode(""); host.append(empty); return [empty, 0];
  };
  for (const op of operations.reverse()) {
    const r = document.createRange(); const [start, s] = locate(op.at), [end, e] = locate(op.at + op.remove);
    r.setStart(start, s); r.setEnd(end, e); r.deleteContents();
    if (op.insert) r.insertNode(document.createTextNode(op.insert));
  }
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); const nodes: Node[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  for (const n of nodes) if (n.textContent?.includes("\n")) {
    const fragment = document.createDocumentFragment(); (n.textContent ?? "").split("\n").forEach((part, i) => { if (i) fragment.append(document.createElement("br")); fragment.append(document.createTextNode(part)); }); n.parentNode?.replaceChild(fragment, n);
  }
  return clean(host.innerHTML);
}
export function wordingText(html: string): string {
  const host = document.createElement("div"); host.innerHTML = clean(html);
  host.querySelectorAll("br").forEach(br => br.replaceWith(document.createTextNode("\n")));
  return host.textContent ?? "";
}