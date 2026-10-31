# Site Manager on Phone, Tablet and Small Laptop

Goal: staff can send a request, edit a page and manage pages on a phone, tablet or small laptop. Nothing changes at 1280 px and wider except the scaled Desktop preview (3), button labels (4) and Back/Forward moving into the toolbar (5).

## Today
The Manager shell (`AdminIndex.tsx`) has one breakpoint (`lg`, 1024 px). Below that width it stacks the preview on top and the panel at a fixed 45vh underneath. At `lg` and up the panel is `clamp(320px, 26vw, 400px)`. Back/Forward sit on top of the preview iframe (`PreviewPanel.tsx`, absolute top-left), so they cover the site's own icons.

## Layout tiers
A single `useManagerLayout()` hook returns `phone` (< 640), `tablet` (640–1023), `laptop` (1024–1279) or `wide` (≥ 1280), plus a `labels` flag for ≥ 1100. The shell renders one tree per tier. The iframe, chat state and editor stay mounted when the tier changes. Only their containers change, so the protocols and frame reloads behave as they do now.

### Phone (< 640)
- The shell is `h-dvh` with a bottom tab bar (safe-area padded):
  - Chat Mode: Preview | Chat.
  - Manual Edit Mode: Page | Sections.
  - Pages/Images/Videos/Objects routes: their own content | Chat.
- Hidden panes use `hidden` and stay mounted, so the chat draft and the iframe survive tab changes.
- Chat tab: full-height history, with the composer pinned to the bottom. The textarea grows from 2 to 6 lines, and Send sits on the same row. A `visualViewport` listener sets `--kb-inset`, so the composer stays above the on-screen keyboard.
- Manual Edit, Page tab: the frame fills the height. A selection opens the editing menu (the existing InlineStylePanel content) in a bottom sheet:
  - It opens at 45% height. The handle drags it to 92% or closes it, with snap points at closed, 45% and 92%.
  - Escape and closing it send the same deselect the panel already uses.
  - When it opens, we send the existing `edit-query scrollTo` with a bottom inset, so the selected element sits above the sheet.
- Sections tab: the existing Sections list, page switcher, Discard and Reset.
- Toolbar: mode switch, Undo/Redo, Back/Forward, a "Save" text button (Manual Edit Mode only) and a ⋯ menu. The menu holds Objects, Images, Videos, device size, full screen and open in new tab. The left-header actions (Account, Tools, Review, Help) move into the ⋯ menu under a separator.

### Tablet (640–1023)
- Side by side: the panel on the left, the page on the right.
- The panel defaults to 320 px. A drag handle resizes it from 280 to 420 px, and the width is saved in localStorage under `nova-manager-panel-width`.
- Chat history scrolls, and the composer is pinned to the bottom of the panel. The editing menu shows in the panel, as it does on desktop.

### Laptop (1024–1279) and wide (≥ 1280)
- At laptop width the panel minimum becomes 300 px (resizable as on tablet). At ≥ 1280 the current width rule stays.
- **Scaled desktop preview:** with Desktop selected, the frame renders at a virtual 1280 px width inside a wrapper with `transform: scale(available/1280)` and `transform-origin: top left`. The wrapper's height is `available height / scale`. Clicks inside the iframe map correctly, because the iframe is transformed as a whole.
  - Positions coming back from the frame (selection rects for the panel anchor and draw layer) are multiplied by the scale in one helper.
  - Draw-on-preview divides pointer coordinates by the scale.
  - Tablet (768) and Phone (390) render at 1:1 when they fit, and scale the same way when they don't.
  - A small "Showing desktop at 62%" label appears in the toolbar whenever the scale is below 100%.

## Shared changes
- **Labels (4):** Objects, Images, Videos and Save Changes show text at ≥ 1100 px. Below that they show icons with tooltips, but Save always shows the word "Save".
- **Back/Forward (5):** removed from the preview overlay and placed in the toolbar beside the page chip, at every width. Same `previewNav` handlers.
- **Pages tool under 768 (6):**
  - The labels sidebar moves into a "Filter" button that opens a sheet.
  - The table becomes cards: thumbnail, name, path, status, and Open in Preview / Edit / ⋯ actions. The same actions apply to the Landing Pages view.
  - On phone the chat panel is hidden here, reachable through the Chat tab.
- **Position group (7):** in panels narrower than 360 px (container query), alignment goes on row 1 and Letter Spacing / Line Height on row 2, each half width. Labels and values never truncate (`whitespace-nowrap`, with the input shrinking instead).
- **Object picker on phone (8):** two-column grid with smaller cards. The disabled button reads "Select objects to add", then "Add N Objects" once something is picked.
- **Dialogs (9):** shared `DialogContent`/`AlertDialogContent` get `w-[calc(100vw-2rem)] max-w-…`. Footers stack full width under 400 px (`max-[399px]:flex-col` with full-width buttons). This includes the unsaved-change, page-switch, delete and site-wide dialogs.

## Checks
New Playwright spec `e2e/narrow.spec.ts` (using the existing `playwright.config.ts`/fixture, signed in) at 390×844, 768×1024 and 1024×768:
- Chat Send is inside the viewport and clickable, including with the textarea filled to 6 lines.
- Manual Edit: selecting text in the fixture frame opens the sheet (phone) or panel. A control changes a value, and the selected element is visible above the sheet.
- Pages: at least one page card or row is visible, and the Filter sheet opens on phone.
- No horizontal scroll: `scrollWidth <= clientWidth` on the document.
- Save is visible in Manual Edit Mode.
- At 1024 px, the Desktop device iframe reports a 1280 px width, and the scale label is shown.

We will also add Vitest unit tests for the tier hook, the scale math (rect and pointer mapping) and the picker button label. The existing suite must stay green.

## Risks
- The public frame may read `window.innerWidth`. Scaling keeps the iframe's own width at 1280, so its layout logic is unaffected.
- Keeping hidden panes mounted avoids reloads. On phone, both the iframe and the chat stay alive as now.
- `visualViewport` support differs between iOS and Android. If it isn't available, the composer falls back to `dvh`.
- The public site handles the frame-side bar gap and its own overlap at narrow widths separately.

## Files
`AdminIndex.tsx` (shell tiers, tab bar, resizable panel), new `useManagerLayout.ts`, `BottomTabs.tsx`, `EditSheet.tsx`, `previewScale.ts`; `PreviewPanel.tsx` / `PreviewTools.tsx` (toolbar nav, ⋯ menu, scale wrapper, label); `ChatPanel.tsx` (composer); `DesignTab.tsx` / `InlineStylePanel.tsx` (sheet host, Position layout); `PagesTab.tsx` / `LandingPagesView.tsx` (cards, Filter sheet); `LibraryPicker.tsx`; `ui/dialog.tsx` / `ui/alert-dialog.tsx`; `DrawLayer.tsx`; `AGENTS.md` and memory.
