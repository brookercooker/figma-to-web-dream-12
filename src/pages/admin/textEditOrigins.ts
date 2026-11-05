import { parseKey, type InlineEdits } from "@/lib/inlineEditCore";

/** Text aliases stay transport-only until the shared public core supports them. */
export function isTextEditKey(key: string): boolean {
  return parseKey(key)?.kind === "html" || (key.startsWith("text:") && parseKey(key.slice(5))?.kind === "html");
}
export function textEditPath(key: string): string | undefined {
  return isTextEditKey(key) ? key.startsWith("text:") ? key.slice(5) : key : undefined;
}
/** Existing originals survive frame replies; removed wording removes its metadata too. */
export function retainTextOrigins(previous: InlineEdits, next: InlineEdits, originals: Record<string, string> = {}): InlineEdits {
  const out = { ...next };
  for (const key of Object.keys(out)) {
    if (key.startsWith("orig:") && (!isTextEditKey(key.slice(5)) || out[key.slice(5)] === undefined)) delete out[key];
  }
  for (const key of Object.keys(out)) {
    if (!isTextEditKey(key)) continue;
    const originKey = `orig:${key}`;
    if (out[originKey] === undefined) {
      const original = previous[originKey] ?? (previous[key] === undefined ? originals[textEditPath(key) ?? key] : undefined);
      if (original !== undefined) out[originKey] = original;
    }
  }
  return out;
}