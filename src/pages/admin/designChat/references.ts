// Library items (images, videos, objects) picked from the top bar and added to the next chat request.
// They travel as plain text after the person's words, so the design service's request format doesn't change.

export type ChatReference =
  | { kind: "image"; id: string; name: string; url: string; labels: string[]; thumb?: string }
  | { kind: "video"; id: string; name: string; url: string; altUrl?: string; poster?: string; labels: string[]; thumb?: string }
  | { kind: "object"; id: string; name: string; componentKey?: string | null; type: string; sections?: number; thumb?: string };

export const REFERENCES_HEADING = "References from the library:";
const KIND_LABEL = { image: "Image", video: "Video", object: "Object" } as const;

export const referenceKey = (r: Pick<ChatReference, "kind" | "id">) => `${r.kind}:${r.id}`;
const q = (name: string) => `"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function line(r: ChatReference): string {
  if (r.kind === "image") return `- Image ${q(r.name)}: ${r.url}${r.labels.length ? `, labels: ${r.labels.join(", ")}` : ""}`;
  if (r.kind === "video") {
    const urls = [r.url, r.altUrl].filter(Boolean).join(" ");
    return `- Video ${q(r.name)}: ${urls}${r.poster ? ` poster: ${r.poster}` : ""}${r.labels.length ? `, labels: ${r.labels.join(", ")}` : ""}`;
  }
  return `- Object ${q(r.name)}: id ${r.id}${r.componentKey ? `, key ${r.componentKey}` : ""}, kind ${r.type}${r.sections != null ? `; sections: ${r.sections}` : ""}`;
}

/** The person's words followed by the reference block (nothing added without references). */
export function withReferences(message: string, refs: ChatReference[]): string {
  if (!refs.length) return message;
  return `${message}\n\n${REFERENCES_HEADING}\n${refs.map(line).join("\n")}`;
}

/** For the chat history: the words, then "Image: name" lines instead of the raw addresses. */
export function readableReferences(text: string): string {
  const at = text.indexOf(`\n\n${REFERENCES_HEADING}\n`);
  if (at < 0) return text;
  const lines = text.slice(at + REFERENCES_HEADING.length + 3).split("\n");
  const shown = lines.map((l) => {
    const m = /^- (Image|Video|Object) "((?:[^"\\]|\\.)*)"/.exec(l);
    return m ? `${m[1]}: ${m[2].replace(/\\(.)/g, "$1")}` : null;
  }).filter(Boolean);
  return shown.length ? `${text.slice(0, at)}\n\n${shown.join("\n")}` : text;
}

export const kindLabel = (k: ChatReference["kind"]) => KIND_LABEL[k];
