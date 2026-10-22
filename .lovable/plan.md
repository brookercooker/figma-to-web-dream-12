# "Content coming soon." in Edit manually: findings and fix

## 1. Where the text comes from

- The only source is `SimplePage` in `src/pages/SimplePage.tsx`. When it gets no `children`, it shows the title and "Content coming soon." The four policy pages no longer use it. `/shipping-policy`, `/return-policy`, `/privacy-policy` and `/terms-conditions` are now full pages in their own files (`ShippingPolicyPage.tsx` and the others). `SimplePage.tsx` still exports old placeholder versions of them, but nothing uses those exports.
- The only thing that calls `SimplePage` without children is `DbPage` (`src/pages/DbPage.tsx`). It reads `pages.name` and `pages.content` for the address. If there are no blocks, it renders `<SimplePage title={name}>{undefined}</SimplePage>`.
- How a page gets there:
  1. **Preview → auto-register.** `ChatPanel` "Edit manually" calls `registerPreviewPage` in `usePreviewPage.ts`. That creates a `pages` row with `pageRow()` from `registerPage.ts`: `content: null`, `inline_edits: {}`. The manifest sync (`manifestPageSync.ts`, `syncManifestPages`) creates rows the same way.
  2. **Editor load.** `DesignTab` runs `parseBlocks(page.content)`, which gives `[]`. Because the editor is embedded, `inPlace` and `hasExisting` are both true, so the live in-place editor (`InlineEditSurface`) is used.
  3. **Which component is shown.** The editor renders `codedPages[previewSrc(path)]` (`src/pages/admin/codedPages.tsx`). If the address is not in that list, it uses `LivePreviewPage` instead.
  4. **`LivePreviewPage`** (`designChat/LivePreviewPage.tsx`) calls `loadSiteManifest()` (`siteManifest.ts`). That fetches `site-manifest.json`, first from the draft preview and then from the public site or the same site, and keeps it for 60 s. It then looks for `manifest.pages.find(p => p.path === path)` and imports `entry.file` through `import.meta.glob`. **If there is no entry, the request fails, or the file or named export can't be found, it silently renders `<DbPage />`.** `DbPage` finds the new empty row and shows "Content coming soon."
- So the message really means: this page's code could not be found, so the editor fell back to the empty database row. Likely triggers:
  - The page exists only in the draft build, and the draft manifest can't be reached. Last time this failed with `net::ERR_FAILED`, which is why `/draft` was never verified.
  - The exact-path match fails: a trailing slash, `/home` vs `/`, or an entry the manifest's route regex didn't pick up. For example, `lazyRetry(() => SimplePages().then(...))` forms may not match the regex near `siteManifest.mjs:116`.
  - A load error that the `.catch(() => {})` swallows.
  - Multi-segment addresses: the `DbPage` fallback only matches `/:slug`.
- The policy addresses are in `codedPages`, so they should render their real content and should not reach `DbPage`. Which address the staff member actually hit is **unconfirmed**. Step 1 below confirms it.

## 2. Which pages are affected

| Kind | Shows now | Should show |
|---|---|---|
| (a) Placeholder page with no real content: a new chat page, or a page whose code can't be found | Title + "Content coming soon." Nothing to type into except the title | A heading block with the page name, plus an empty text block that has its cursor ready |
| (b) Coded page with real content (`/about`, `/team`, `/locations`, the policy pages) | Real content, editable in place, if listed in `codedPages`. If it is only in the manifest and the manifest fails, the same as (a) | Real content every time. Never the empty-row fallback |
| (c) Database page with blocks | Block editor. Works today | Unchanged |

## 3. How coded content becomes editable today

- It renders the live component and reads the result off the screen. Nothing reads the source code, and no block list is shipped.
  - **In-place editing.** `InlineEditSurface` renders the real component. Changes are stored as overrides keyed by position on the page (`pages.inline_edits` and `object_registry.inline_edits`, plus the `objectScopes` lookup). Nothing is converted.
  - **Conversion** ("Edit this section", import). The import probe in `DesignTab.tsx` (around lines 270–330) renders the whole page off-screen at a 1280 px width. It waits up to 6 s for images and loading placeholders, then waits another 250 ms. Next it runs `pageChunks()` (`src/lib/pageChunks.ts`) and lazy-loads `importCodedObject.ts` (1,760 lines) to run `sectionsFromDom` on each part.
- Cost and weak points:
  - The page is rendered twice: once visible and once in the probe.
  - It is held back by the slowest image, up to 6 s, every time.
  - It depends on screen size and layout (`getBoundingClientRect`).
  - Moving content (scrolling text, carousels, `useEffect` changes to the page title) is captured as a single still frame.
  - Overrides keyed by position break when the code changes.
  - The manifest is fetched again whenever the 60 s cache has expired.
  - `import.meta.glob("/src/pages/**/*.tsx")` turns every page into a separate loadable piece of the Site Manager's code. That's cheap, but it ties the Site Manager to the public site's files.
  - Failures are silent and go straight to the empty-row fallback.

## 4. Recommended design

Options considered:
- **Block list built when the site is built** (exported next to the manifest). Opening a page would be instant. But it needs a JSX → blocks extractor that can't see data from hooks or the database, or anything that moves. It would be a second converter to keep in step, and it still fails when the manifest can't be reached. Too large and fragile for now.
- **Convert only what is visible or selected.** This is already how conversion works, one section at a time. Keep it.
- **Convert when editing starts and save the result in `pages.content`.** This would drop coded behaviour such as scrolling text, links and live data, and turn living pages into frozen copies. It is not right for pages with real content.

**Recommendation:** keep live in-place editing for pages that have code, but make finding the code reliable and the fallback honest. Give truly empty pages a ready-to-type starter instead of the placeholder text.

Changes:
1. **Confirm the cause first.** Reproduce in the browser on the address the staff member used. Log in `LivePreviewPage` whether the manifest loaded, whether an entry was found, and whether the import worked.
2. **`LivePreviewPage.tsx`:**
   - Clean up the address before matching: trailing slash, and `/home` → `/`.
   - Also use the static `codedPages` list as a backup when the manifest has no entry.
   - Don't swallow errors. When the code can't be found, return a "not found" result instead of quietly rendering `DbPage`.
3. **`DesignTab.tsx`:** when `LivePreviewPage` reports "not found" and the row is empty, switch to the block editor with starter blocks instead of in-place mode: a heading with the page name and an empty text block that has focus. These are held as unsaved changes, so Discard leaves nothing and nothing is written until Finish Editing. If the page has code that just failed to load, show a short "Couldn't load this page's design, try again" note with a Retry button rather than offering an empty page.
4. **`siteManifest.ts`:** report a failed draft fetch, so the editor can tell "missing" apart from "couldn't be reached". Retry once when the preview rebuilds.
5. **`siteManifest.mjs`:** check that pages wrapped in `lazyRetry` and named exports are included in `pages[]`, and add a test for it.
6. **Cleanup:** delete the unused placeholder policy exports in `SimplePage.tsx`. Change `SimplePage`'s empty state for visitors to render nothing instead of "Content coming soon."
7. **Tests:**
   - Address cleanup and the `codedPages` backup.
   - The not-found path gives the starter blocks.
   - Discard after the starter blocks writes nothing.
   - The manifest includes the `lazyRetry` routes.

Risks:
- Starter blocks only ever appear on pages with no code, so special behaviour on coded pages (scrolling text, carousels, live data) is never converted or lost.
- The Retry note depends on reliably telling "not found" apart from "couldn't be reached".
- `/draft`-style pages still need the draft manifest to be reachable, which was not verified last time.

Files touched: `designChat/LivePreviewPage.tsx`, `DesignTab.tsx`, `siteManifest.ts`, `scripts/siteManifest.mjs`, `SimplePage.tsx`, and their tests. `src/integrations/supabase/*`, `supabase/functions/*` and `useThumbnailCapture.ts` are not touched.
