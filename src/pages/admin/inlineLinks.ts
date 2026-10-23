import { cleanEditedHtml, segmentColorCss } from "@/components/ObjectSections";
import type { SectionImage } from "@/components/ObjectSections";

/** Keep the renderer's destination rule identical without changing the shared file. */
export function validInlineHref(href: string): boolean {
  if (!href || /[\s\u0000-\u001f\u007f\\]/.test(href)) return false;
  if (/^https?:\/\//i.test(href)) {
    try { return !!new URL(href).hostname; } catch { return false; }
  }
  return /^(mailto:|tel:|\/(?!\/)|#)/i.test(href);
}

export function mergePictureChanges(image: SectionImage, changes: Partial<SectionImage>): SectionImage {
  const next = { ...image, ...changes };
  if ("linkCard" in changes && !changes.linkCard) delete next.linkCard;
  return next;
}

export function linkAtRange(host: HTMLElement, range: Range): HTMLAnchorElement | null {
  const element = (node: Node) => node instanceof Element ? node : node.parentElement;
  const start = element(range.startContainer)?.closest("a") ?? null;
  const end = element(range.endContainer)?.closest("a") ?? null;
  return start && start === end && host.contains(start) && start !== host ? start : null;
}

export function changeInlineLink(host: HTMLElement, range: Range, href: string | null, styles?: { underline: boolean; color: string }): string | null {
  if (!host.contains(range.startContainer) || !host.contains(range.endContainer)) return null;
  if (href !== null && !validInlineHref(href)) return null;
  let link = linkAtRange(host, range);
  if (href === null) {
    if (!link) return null;
    link.replaceWith(...Array.from(link.childNodes));
  } else {
    if (!link) {
      if (range.collapsed) return null;
      const fragment = range.extractContents();
      fragment.querySelectorAll("a").forEach((a) => a.replaceWith(...Array.from(a.childNodes)));
      link = document.createElement("a");
      link.append(fragment);
      range.insertNode(link);
    }
    link.setAttribute("href", href);
    if (styles) {
      link.setAttribute("data-underline", styles.underline ? "1" : "0");
      link.classList.toggle("underline", styles.underline);
      link.classList.toggle("no-underline", !styles.underline);
      if (styles.color && segmentColorCss(styles.color)) {
        link.setAttribute("data-color", styles.color);
        link.style.color = segmentColorCss(styles.color) ?? "";
      } else {
        link.removeAttribute("data-color");
        link.style.color = "";
      }
    }
  }
  host.dispatchEvent(new Event("input", { bubbles: true }));
  return cleanEditedHtml(host.innerHTML);
}