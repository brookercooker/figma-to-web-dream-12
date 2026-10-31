import { parseKey, type InlineEdits } from "@/lib/inlineEditCore";
import type { PageContentItem } from "../pageContentOrder";
export interface ManualEditSnapshot { blocks: PageContentItem[]; inlineEdits: InlineEdits; objectEdits: Record<string, InlineEdits> }
export interface EditAction { label: string; mergeKey?: string }
interface Step { before: ManualEditSnapshot; after: ManualEditSnapshot; action: EditAction; time: number }
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => [key, canonical(v)])) : value;
export const sameEditState = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export function inlineEditAction(scope: string, before: InlineEdits, after: InlineEdits): EditAction {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key => before[key] !== after[key] && !key.startsWith("fp:"));
  const parsed = keys.length === 1 ? parseKey(keys[0]) : null;
  if (parsed?.kind === "html" && (before[keys[0]] ?? "").replace(/<[^>]*>/g, "") === (after[keys[0]] ?? "").replace(/<[^>]*>/g, "")) return { label: "style change" };
  if (parsed?.kind === "html" || parsed?.kind === "placeholder") return {
    label: parsed.kind === "placeholder" ? "placeholder text change" : "text change", mergeKey: `${scope}|${parsed.kind}|${parsed.path}`,
  };
  return { label: keys.some(key => key.startsWith("style:")) ? "style change" : "changed page details" };
}
/** Full local snapshots only; this module never persists content. */
export class ManualEditHistory {
  private undoSteps: Step[] = [];
  private redoSteps: Step[] = [];
  get undoLabel() { return this.undoSteps.at(-1)?.action.label ?? ""; }
  get redoLabel() { return this.redoSteps.at(-1)?.action.label ?? ""; }
  get changeCount() { return this.undoSteps.length; }
  reset() { this.undoSteps = []; this.redoSteps = []; }
  record(before: ManualEditSnapshot, after: ManualEditSnapshot, action: EditAction, time = Date.now()) {
    if (sameEditState(before, after)) return false;
    const withoutMetadata = (state: ManualEditSnapshot) => ({ ...state, inlineEdits: Object.fromEntries(Object.entries(state.inlineEdits).filter(([key]) => !key.startsWith("fp:"))), objectEdits: Object.fromEntries(Object.entries(state.objectEdits).map(([scope, edits]) => [scope, Object.fromEntries(Object.entries(edits).filter(([key]) => !key.startsWith("fp:"))])) });
    if (sameEditState(withoutMetadata(before), withoutMetadata(after))) return false;
    const last = this.undoSteps.at(-1);
    const merge = !this.redoSteps.length && action.mergeKey && last?.action.mergeKey === action.mergeKey && time - last.time <= 1000;
    if (merge && last) { last.after = structuredClone(after); last.time = time; }
    else this.undoSteps.push({ before: structuredClone(before), after: structuredClone(after), action, time });
    this.redoSteps = [];
    if (this.undoSteps.length > 100) this.undoSteps.shift();
    return true;
  }
  undo() { const step = this.undoSteps.pop(); if (!step) return null; this.redoSteps.push(step); return structuredClone(step.before); }
  redo() { const step = this.redoSteps.pop(); if (!step) return null; this.undoSteps.push(step); return structuredClone(step.after); }
}
export function manualHistoryShortcut(event: KeyboardEvent): "undo" | "redo" | null {
  const target = event.target;
  if (target instanceof HTMLElement && (target.closest("input,textarea,select") || target.isContentEditable || target.closest('[contenteditable]:not([contenteditable="false"])'))) return null;
  if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  return key === "y" && event.ctrlKey && !event.shiftKey ? "redo" : null;
}