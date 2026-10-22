// What a Site Manager user may do to a page.
//
//   landing pages  → "full":  create, edit everything, archive, delete. This is the group they own.
//   main-site pages → "tweak": small changes only (colours, sizes, pictures, wording typed over in place), made on the page
//                      itself. Anything bigger goes through the design chat.
//   anything else   → "view":  look at it, or send it to the chat. (A main-site page that isn't built in code, or that has
//                      already been converted to editable sections, can't be tweaked in place.)
//
// This is the Site Manager's rule for what it shows and offers. The database must enforce the same split before this goes
// live, so a changed screen can't be used to get around it (see the production notes in the plan).

import { codedPages } from "./codedPages";
import { manifestHasPage } from "./siteManifest";

export type PageAccess = "full" | "tweak" | "view";

export interface PageLike {
  path: string;
  page_type?: string | null;
}

/** The page's path as the preview and the coded-page table know it. */
export const codedPathOf = (path: string) => (path === "/" ? "/home" : path);

/** True if the page is built in code, so it can be shown and tweaked in place. */
export const isCodedPath = (path: string) => manifestHasPage(path) || !!codedPages[codedPathOf(path)];

export const isLandingPage = (p: PageLike) => p.page_type === "landing" || (p.path ?? "").startsWith("/landing/");

export function pageAccess(page: PageLike, opts: { tweakable?: boolean } = {}): PageAccess {
  if (isLandingPage(page)) return "full";
  const tweakable = opts.tweakable ?? isCodedPath(page.path);
  return tweakable ? "tweak" : "view";
}

/** Create, archive, delete, restructure, add sections. */
export const canChangeStructure = (a: PageAccess) => a === "full";

export const ACCESS_NOTE: Record<Exclude<PageAccess, "full">, string> = {
  tweak:
    "This is a main-site page. Here you can change colours, sizes and pictures, and type over wording. For bigger changes, use the chat: pick this page on the Pages tab and describe what you want.",
  view:
    "This is a main-site page and can't be changed in place. To change it, use the chat: pick this page on the Pages tab and describe what you want.",
};
