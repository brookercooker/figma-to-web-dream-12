export type WaitKind = "question" | "normal" | "bigger" | "library" | "submit" | "contentSubmit" | "save";
export const WAIT_ESTIMATES: Record<WaitKind, readonly number[]> = {
  question: [20], normal: [40, 50], bigger: [75, 50], library: [55, 50],
  submit: [50, 10], contentSubmit: [140, 10], save: [10],
};
export function detectWaitKind(message: string, planOnly = false): WaitKind {
  if (planOnly) return "question";
  if (/References from the library:\s*\n- (Image|Video) /i.test(message)) return "library";
  const text = message.split("\n\nReferences from the library:")[0];
  if (/\?\s*$/.test(text) && /^(what|why|how|where|when|is|are|does|do|can you explain|could you explain)\b/i.test(text.trim())) return "question";
  if (text.length > 200 || text.split(/[.!?]+(?:\s|$)/).filter(s => s.trim()).length >= 3 ||
      /(^|\n)\s*(?:[-*•]|\d+[.)])\s/m.test(text) ||
      /\b(redesign|rebuild|layout|rename|everywhere|every page|all pages|new page|add a page|two columns|undo)\b/i.test(text)) return "bigger";
  if (/\?\s*$/.test(text) && !/\b(make|change|add|remove|replace|move|update|fix)\b/i.test(text)) return "question";
  return "normal";
}
export type WaitView = { value: number; label: string; error?: boolean; done?: boolean; fading?: boolean };
export function stageShares(kind: WaitKind) {
  const estimates = WAIT_ESTIMATES[kind];
  const total = estimates.reduce((a, b) => a + b, 0);
  return estimates.map(seconds => seconds / total);
}
export function timedProgress(kind: WaitKind, stage: number, elapsedSeconds: number, label: string, previous = 0, done = false): WaitView {
  if (done) return { value: 1, label, done: true };
  const estimates = WAIT_ESTIMATES[kind];
  const shares = stageShares(kind);
  const index = Math.min(stage, estimates.length - 1);
  const elapsed = Math.max(0, elapsedSeconds);
  const base = shares.slice(0, index).reduce((a, b) => a + b, 0);
  // Floating-point exponent underflow must not manufacture a completed stage.
  const eased = Math.min(1 - 1e-9, 1 - Math.exp(-elapsed / estimates[index] * 1.6));
  const value = Math.max(previous, Math.min(1 - 1e-9, base + shares[index] * eased));
  const remaining = Math.max(0, estimates[index] - elapsed) + estimates.slice(index + 1).reduce((a, b) => a + b, 0);
  const time = remaining < 10 ? "almost done" : remaining >= 55 && remaining <= 70 ? "about a minute left" : `about ${Math.ceil(remaining)} sec left`;
  return { value, label: elapsed > estimates[index] * 2 ? "Taking a bit longer than usual. Still working." : `${label} · ${time}` };
}