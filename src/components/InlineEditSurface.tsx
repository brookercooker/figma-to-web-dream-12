/**
 * In-place editing for pages built in code. The page renders exactly as
 * visitors see it; text can be typed over directly and pictures swapped.
 * Changes are stored as overrides keyed by each element's position in the page.
 */
import { useEffect, useRef, type ReactNode } from "react";
import DOMPurify from "dompurify";

export type InlineEdits = Record<string, string>;
export type InlineStyle = Partial<Record<"fontSize" | "fontWeight" | "fontStyle" | "textAlign" | "color" | "textTransform" | "letterSpacing" | "width" | "height" | "objectFit" | "maxWidth", string>>;
export interface InlineSelection { path: string; kind: "text" | "image"; el: HTMLElement }
export const styleKey = (path: string) => `style:${path}`;
export const readStyle = (edits: InlineEdits, path: string): InlineStyle => {
  try { return JSON.parse(edits[styleKey(path)] ?? "{}"); } catch { return {}; }
};

const TEXT_TAGS = "h1,h2,h3,h4,h5,h6,p,li,a,button,span,blockquote,figcaption,dt,dd,label,small,em,strong";
const BLOCKISH = /^(DIV|SECTION|ARTICLE|UL|OL|IMG|VIDEO|IFRAME|SVG|FORM|INPUT|TEXTAREA|SELECT|H[1-6]|P|LI|FIGURE|TABLE|NAV|HEADER|FOOTER|BUTTON)$/;

/** Position of el under root, e.g. "0.3.1". */
export function pathOf(root: Element, el: Element): string {
  const parts: number[] = [];
  let n: Element | null = el;
  while (n && n !== root) {
    const p: Element | null = n.parentElement;
    if (!p) break;
    parts.unshift([...p.children].indexOf(n));
    n = p;
  }
  return parts.join(".");
}

function byPath(root: Element, path: string): Element | null {
  let n: Element | null = root;
  for (const i of path.split(".")) {
    if (!n) return null;
    n = n.children[Number(i)] ?? null;
  }
  return n;
}

const clean = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: ["b", "strong", "i", "em", "br", "span", "u"], ALLOWED_ATTR: [] });

/** Leaf text elements that are safe to edit in place. */
function editableTexts(root: Element): HTMLElement[] {
  return ([...root.querySelectorAll(TEXT_TAGS)] as HTMLElement[]).filter((el) => {
    if (!(el.textContent ?? "").trim()) return false;
    if (el.closest("[data-inline-skip],form,header,footer,nav,[role=banner],[role=contentinfo]")) return false;
    if ([...el.children].some((c) => BLOCKISH.test(c.tagName))) return false;
    // Skip a span/em whose parent is itself editable — edit the parent instead.
    const parent = el.parentElement;
    if (parent && parent !== root && parent.matches(TEXT_TAGS) && ![...parent.children].some((c) => BLOCKISH.test(c.tagName))) return false;
    return true;
  });
}

/** Re-apply saved overrides whenever the page (re)renders. */
function applyEdits(root: Element, edits: InlineEdits) {
  for (const [key, value] of Object.entries(edits)) {
    if (key.startsWith("style:")) {
      const el = byPath(root, key.slice(6)) as HTMLElement | null;
      if (!el) continue;
      let st: InlineStyle = {};
      try { st = JSON.parse(value); } catch { /* ignore */ }
      for (const [k, v] of Object.entries(st)) {
        if (v && (el.style as any)[k] !== v) (el.style as any)[k] = v;
      }
    } else if (key.startsWith("img:")) {
      const el = byPath(root, key.slice(4));
      if (el instanceof HTMLImageElement && el.getAttribute("src") !== value) {
        el.src = value;
        el.removeAttribute("srcset");
      }
    } else {
      const el = byPath(root, key) as HTMLElement | null;
      if (el && document.activeElement !== el && el.innerHTML !== value) el.innerHTML = value;
    }
  }
}

export default function InlineEditSurface({
  children, edits, editing = false, onChange, onPickImage, onSelect, selectedPath,
}: {
  onSelect?: (sel: InlineSelection | null) => void;
  selectedPath?: string | null;
  children: ReactNode;
  edits: InlineEdits;
  editing?: boolean;
  onChange?: (next: InlineEdits) => void;
  /** Ask the host for a new picture; resolve with its address. */
  onPickImage?: (current: string) => Promise<string | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const editsRef = useRef(edits);
  editsRef.current = edits;

  // Keep overrides applied as lazy content loads or React re-renders.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let busy = false;
    const run = () => {
      if (busy) return;
      busy = true;
      applyEdits(root, editsRef.current);
      if (editing) {
        editableTexts(root).forEach((el) => {
          if (el.dataset.inlineEditable) return;
          el.dataset.inlineEditable = "1";
          el.contentEditable = "true";
          el.spellcheck = true;
        });
        root.querySelectorAll("img").forEach((img) => {
          if (img.closest("header,footer,nav")) return;
          img.dataset.inlineImage = "1";
        });
      }
      busy = false;
    };
    run();
    const mo = new MutationObserver(() => requestAnimationFrame(run));
    mo.observe(root, { childList: true, subtree: true });
    const id = window.setInterval(run, 800); // catches late-loading lazy sections
    return () => {
      mo.disconnect();
      window.clearInterval(id);
      root.querySelectorAll<HTMLElement>("[data-inline-editable]").forEach((el) => {
        el.removeAttribute("contenteditable");
        delete el.dataset.inlineEditable;
      });
      root.querySelectorAll<HTMLElement>("[data-inline-image]").forEach((el) => delete el.dataset.inlineImage);
    };
  }, [editing]);

  // Apply new overrides straight away (e.g. once loaded on the live site).
  useEffect(() => { if (ref.current) applyEdits(ref.current, edits); }, [edits]);

  const onInput = (e: React.FormEvent) => {
    const root = ref.current;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-inline-editable]");
    if (!root || !el || !onChange) return;
    onChange({ ...editsRef.current, [pathOf(root, el)]: clean(el.innerHTML) });
  };

  const onClick = async (e: React.MouseEvent) => {
    if (!editing) return;
    const t = e.target as HTMLElement;
    // Links and buttons shouldn't navigate while editing.
    if (t.closest("a,button")) e.preventDefault();
    const img = t.closest("img[data-inline-image]") as HTMLImageElement | null;
    const txt = t.closest("[data-inline-editable]") as HTMLElement | null;
    if (!ref.current) return;
    if (img) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.({ path: pathOf(ref.current, img), kind: "image", el: img });
    } else if (txt) {
      onSelect?.({ path: pathOf(ref.current, txt), kind: "text", el: txt });
    }
  };

  // Outline the selected element.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll("[data-inline-selected]").forEach((n) => n.removeAttribute("data-inline-selected"));
    if (selectedPath) byPath(root, selectedPath)?.setAttribute("data-inline-selected", "1");
  }, [selectedPath, edits]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter finishes a line of text instead of adding new blocks inside it.
    if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).dataset.inlineEditable) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <div
      ref={ref}
      className={editing ? "inline-edit-surface" : undefined}
      onInput={onInput}
      onClickCapture={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
