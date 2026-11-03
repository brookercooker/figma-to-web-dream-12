export type WaitAction = "phone" | "tablet" | "draft" | "write" | "queue" | "manual" | "videos" | "library" | "pages" | "preview" | "reminder";
export type WaitSuggestion = { id: string; label: string; action: WaitAction };
export type WaitContext = {
  page?: { name: string; path: string; type?: string } | null;
  editable?: boolean; content?: unknown; draftCount: number; otherDraftPages: string[];
  otherPages: boolean; previewLoaded: boolean; device: string; request: string;
  elapsed: number; queued: boolean; previewReady?: boolean;
  available: WaitAction[];
};
export function contentKinds(content: unknown): Set<string> {
  const found = new Set<string>();
  const visit = (value: unknown, depth: number) => {
    if (depth > 12 || !value) return;
    if (Array.isArray(value)) { value.forEach(v => visit(v, depth + 1)); return; }
    if (typeof value !== "object") return;
    for (const [key, v] of Object.entries(value)) {
      if (key === "type" && typeof v === "string") found.add(v.toLowerCase());
      if (/^(videos|images|faqs|icons|form|fields)$/.test(key) && v && (!Array.isArray(v) || v.length)) found.add(key.replace(/s$/, ""));
      visit(v, depth + 1);
    }
  };
  if (typeof content === "string") { try { visit(JSON.parse(content), 0); } catch { /* Unknown content is not editable evidence. */ } }
  else visit(content, 0);
  return found;
}
/** Pure ranking/rotation. Keep the most relevant choice first; rotate only the remaining slots. */
export function waitSuggestions(c: WaitContext, previous: string[] = []): WaitSuggestion[] {
  const pool: (WaitSuggestion & { score: number })[] = [];
  const add = (id: string, label: string, action: WaitAction, score: number, enabled = true) => {
    if (enabled && c.available.includes(action)) pool.push({ id, label, action, score });
  };
  const kinds = contentKinds(c.content), video = kinds.has("video"), image = kinds.has("image");
  const mentions = (words: string) => new RegExp(`\\b(${words})\\b`, "i").test(c.request);
  add("saved-videos", "Check video alignment or delete a video", "videos", mentions("video|youtube") ? 110 : 85, video && !!c.editable);
  add("video-library", "Add real videos to your library", "library", 95, mentions("video|youtube"));
  add("manual", image ? "Fix a typo or swap an image yourself" : kinds.has("icon") ? "Adjust text or icons yourself" : "Fix a typo in Manual Edit Mode", "manual", mentions("text|heading|image|photo|icon|color|colour|link|form") ? 100 : 60, !!c.editable && ["image", "text", "heading", "icon", "faq", "form"].some(kind => kinds.has(kind)));
  add("phone", "Check this page on a phone", "phone", mentions("phone|mobile") ? 105 : 70, c.previewLoaded && c.device !== "mobile" && c.device !== "phone");
  add("tablet", "Check this page on a tablet", "tablet", 55, c.previewLoaded && c.device !== "tablet");
  add("draft", "Look at other pages in your draft", "draft", 75, c.draftCount > 0 && c.otherDraftPages.length > 0);
  add("queue", "Review your queued change", "queue", 90, c.queued);
  add("write", "Write your next change", "write", 65, !c.queued);
  add("pages", "Start a change on another page", "pages", 50, c.otherPages);
  add("preview", "Look at what changed", "preview", 120, c.previewLoaded && !!c.previewReady);
  add("reminder", "Your draft stays saved when you leave", "reminder", 80, c.elapsed > 60);
  pool.sort((a, b) => b.score - a.score);
  let result = pool.slice(0, 3);
  if (result.length && result.map(s => s.id).join("|") === previous.join("|")) {
    if (result.length === 1) return [];
    result = pool.length > 3 ? [pool[0], pool[1], pool[3]] : [result[0], ...result.slice(1).reverse()];
    if (result.map(s => s.id).join("|") === previous.join("|")) result = result.slice(0, 1);
  }
  return result.map(({ id, label, action }) => ({ id, label, action }));
}