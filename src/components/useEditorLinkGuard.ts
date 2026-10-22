import { useEffect, type RefObject, type MouseEvent, type SyntheticEvent, type KeyboardEvent, type DragEvent } from "react";

const LINKS = 'a[href],[role="link"],button,[role="button"],[onclick]';
const NOTE = "Links are switched off while editing";

/** Block visitor actions, but explicitly retain the canvas's selection before stopping their handlers. */
export function useEditorLinkGuard(
  ref: RefObject<HTMLElement>,
  editing: boolean,
  select?: (event: MouseEvent<HTMLElement>) => void,
  contentOnly = false,
) {
  const actionAt = (target: EventTarget | null) => {
    const root = ref.current;
    const el = target instanceof Element ? target : null;
    const action = el?.closest<HTMLElement>(LINKS);
    return root && action && root.contains(action) && (!contentOnly || action.closest("[data-editor-content]")) ? action : null;
  };

  useEffect(() => {
    const root = ref.current;
    if (!editing || !root) return;
    const originals = new Map<HTMLElement, { title: string | null; draggable: string | null; cursor: string; priority: string }>();
    const update = () => {
      root.querySelectorAll<HTMLElement>(LINKS).forEach((el) => {
        if (contentOnly && !el.closest("[data-editor-content]")) return;
        if (!originals.has(el)) originals.set(el, { title: el.getAttribute("title"), draggable: el.getAttribute("draggable"), cursor: el.style.getPropertyValue("cursor"), priority: el.style.getPropertyPriority("cursor") });
        el.title = NOTE;
        el.draggable = false;
        el.style.setProperty("cursor", "default", "important");
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      originals.forEach((old, el) => {
        for (const attr of ["title", "draggable"] as const) {
          if (old[attr] === null) el.removeAttribute(attr); else el.setAttribute(attr, old[attr]);
        }
        if (old.cursor) el.style.setProperty("cursor", old.cursor, old.priority); else el.style.removeProperty("cursor");
      });
    };
  }); // Canvases may mount after their page finishes loading.

  const block = (event: SyntheticEvent<HTMLElement>) => {
    if (!editing || !actionAt(event.target)) return false;
    event.preventDefault();
    // Selection is dispatched explicitly before blocking visitor-side JavaScript (navigate/window.open).
    event.stopPropagation();
    return true;
  };
  return {
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (editing && actionAt(event.target)) { select?.(event); block(event); }
    },
    onAuxClickCapture: (event: MouseEvent<HTMLElement>) => { block(event); },
    onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
      // Editable wording keeps its Enter-to-commit and Space-to-type handlers; it cannot activate a link.
      if (event.target instanceof HTMLElement && event.target.isContentEditable) return;
      if (event.key === "Enter" || event.key === " ") block(event);
    },
    onDragStartCapture: (event: DragEvent<HTMLElement>) => { block(event); },
    onDoubleClickCapture: (event: MouseEvent<HTMLElement>) => {
      // Keep double-click text editing, but not visitor-side double-click actions.
      if (editing && actionAt(event.target)) event.preventDefault();
    },
  };
}