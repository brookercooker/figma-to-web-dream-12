# Site Manager batch: save flow, pickers, fonts, section bars, object click dialogs

## 1. Save flow in Manual Edit Mode
- Top-right button becomes "Save Changes" (Save icon) in Manual Edit Mode, disabled with no unsaved edits. It runs the current Finish Editing save (same checks, same busy-sync retry), then switches to Chat Mode, where Submit for Review returns.
- Remove "Finish Editing" from the panel header; "Discard Changes" stays, with Trash2.
- Leave dialog: title "Save Your Changes?", buttons left to right "Save Changes" (primary, Save), "Discard Changes" (Trash2), "Keep Editing" (Pencil).
- Page-switch dialog: same three labels/icons/order; page name stays in the body.
- Update help text mentioning Finish Editing (HeaderActions, DesignChatContext hints, tests).

## 2. Deselect All in pickers
- Footer of Objects / Images / Videos pickers gets "Deselect All" next to "N selected"; removes every reference of that kind from chat references and chips; disabled when none.

## 3. Font and weight menus
- Drop "(default)". The inherited option shows just the font name in its own font. If it is also in EDITOR_FONTS, list it once and show it selected. Weight menu shows e.g. "Light".

## 4. Section bars
- The local held-section list (older frames only) gets the same reserved spacing as the public frame and never overlays page content; capable frames draw their own bars, so the Manager adds nothing there.

## 5. Clicking an object asks first
- Handle `edit-object-click` (same origin/window checks). Three dialogs:
  - Shared object: "Edit <name>?", Used-on list, "Open in Object Editor" / "Make a Copy for This Page" / "Cancel". Opening goes through Save Your Changes? when there are unsaved edits.
  - Page-only copy: "This copy is only used on <page>.", Open / Cancel.
  - Header/Footer (site-wide): "Edit the Site Header?" / "Footer", site-wide warning, Open / Cancel.
- Make a Copy: inserts a Draft object_registry row (same component_key, content, inline_edits, labels; name "<name> (<page>)"), records `objectSwap:<slot>` → new id in the page's pending inline edits, and replaces objectId in pages.content for page-content blocks. `objectSwaps` sent in edit-init/edit-update. Undo/Redo snapshots include it. Saved only by Save Changes; Discard (or leaving without saving) deletes the unsaved copy row. After copying, open the copy in the object editor.

## Database change (item 5)
- Migration: add `site_wide boolean not null default false` to object_registry; a trigger blocks archiving site-wide rows. Existing permissions unchanged.
- Data: the "Site Header" row already exists (component_key Header, Ready) and gets site_wide = true. No Footer row exists; add "Site Footer" (component_key Footer, Ready, site_wide = true), only if Footer is a registered component; otherwise I will report that it's missing instead of adding a row that can't render.
- Site-wide rows hide Make a Copy and Archive in the Objects list and appear there with thumbnails.

## Tests
- Save flow labels/order in both dialogs and the Save Changes button state.
- Deselect All removes only that kind and is disabled when empty.
- Font/weight labels without "(default)" and with no duplicates.
- The three object dialogs; copy plus swap removed by Discard; undo covers the swap; edit-object-click validation.

## Open assumption
- Copy cleanup on Discard deletes the row (it was never saved by any page), rather than archiving it.
