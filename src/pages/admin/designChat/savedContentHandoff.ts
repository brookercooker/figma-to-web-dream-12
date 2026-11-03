export const HANDOFF_KEY = "nova:manual-content-handoff";
export function needsManualContentEdit(reply: string) {
  return /saved in Site Manager/i.test(reply) || /Site Manager/i.test(reply) && /\b(delete|remove|replace|delet(?:e|ing)|remov(?:e|ing))\b/i.test(reply);
}
export function rememberContentHandoff(pageId: string, text: string) {
  try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ pageId, text })); } catch { /* Page still opens. */ }
}
export function consumeContentHandoff(pageId: string, blocks: readonly { id: string; type: string; url?: string }[]): string | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) ?? "null");
    if (!value || value.pageId !== pageId) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    const kind = /\bvideo|youtube\b/i.test(value.text) ? "video" : /\bimage|picture\b/i.test(value.text) ? "image" : null;
    const candidates = blocks.filter(b => b.url && value.text.includes(b.url));
    const matches = candidates.length ? candidates : blocks.filter(b => !kind || b.type === kind);
    return matches.length === 1 ? matches[0].id : null;
  } catch { return null; }
}