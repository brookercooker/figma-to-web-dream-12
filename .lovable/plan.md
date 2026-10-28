# One Manual Edit surface, full pane width

## Recommendation
Do what you suggested: every page opens in the public-site frame (FramedPageEditor), with held sections beneath it. One small change: **held sections should also be rendered by the frame, not by the Manager**. Today held sections are drawn locally below the frame by the Manager, using the Manager's own CSS. That gives a second look and is the last thing keeping the Manager-side wrappers. Sending held blocks to the frame (`edit-init`/`edit-update` gets a `heldBlocks` field; the public site draws them with its own PageBlocks after the saved content) means each page has one renderer, one width and one place to select things. Until the public side supports this, the local list stays as a fallback (step 4 below).

## 1. What the local surface still provides, and where it goes

| Today (local surface) | In the single frame surface |
|---|---|
| Add a block (top-bar Objects/Images/Videos through `requestAdd`) | No change. Blocks are held in DesignTab state, and the frame reloads once per section revision (already true for framed pages). |
| Reorder / delete / fold blocks (outline list at DesignTab ~780, chunk bars) | The outline list is Manager-side and works for any surface. Chunk reorder/toggle already arrive as `edit-reorder`/`edit-toggle`. |
| Draft / Ready per section | Stays in DesignTab state and saves. Draft sections stay held, and only Ready sections are saved to the page. Unchanged. |
| Starter section for a new empty page (`mx-auto max-w-3xl` h1 + empty text, line 825) | Deleted. The public site renders the page name as its own title on a 0-block page (confirm, see section 2). The user adds the first block from the top bar. It shows as a held section and needs no starter. |
| Header/Footer copies + "This edit changes the header on every page" banner (lines 810-811, 833) | The frame already renders the real header, and header edits arrive as Header object scope (objects-only replay). The banner moves to the existing site-wide confirmation that framed header edits already trigger before save. Local copies are deleted. |
| Held sections | Rendered by the frame (recommended), otherwise by the local list as today. |
| inline_edits recording/applying | Frame path already writes `pages.inline_edits` / `object_registry.inline_edits` and records through `edit-query op:"record"`. Same keys, so nothing changes in storage. |
| Save / Discard / Finish Editing | Already the same for both surfaces (pending saves plus exact discard snapshots). Unchanged. |
| Safety panel | Uses only `framedReports` from `edit-applied`. Drop the `inlineReports`/`headerReports` branch. |

**Delete:** the InlineEditSurface uses in DesignTab (page and header), `inlineApi`/`headerApi`/`inlineReports`/`headerReports`, the Header/Footer imports and copies, the starter section, the local branch and manifest lookup in `usePageEditorSurface` (it becomes "loading until a draft embed URL exists, then framed"), the "local" branches in the `record` handler, and the `!framed` conditionals.

**Keep:** InlineEditSurface itself (ObjectDesignPage/the object editor and coded objects use it), PageBlocks/BlockView (visitor rendering, legacy `code` blocks via PageCodeSection), codedPages compatibility consumers (unchanged from the phase-4 note), the manifest bridge (still used by Pages/registration), and the standalone non-embedded DesignTab add buttons.

## 2. What the frame needs for database-only pages
This repo has a local `/:slug` → DbPage route. I can't see how the **public repo** serves `/draft/:slug` and DB-only paths. The first step checks that against the live draft before any Manager change:
- `/draft/experiment` (0 blocks) and a brand-new page with `?nova-edit=1` load, post `edit-ready`, answer `edit-query op:"record"` and post `edit-applied`.
- A 0-block page renders a title and does not 404 or show "Content coming soon".
- Unpublished/draft-status pages render in edit mode. Draft embed is authenticated by the existing token.
- The edit frame does not add the first block itself. Adding is Manager-side (held, then saved), and the frame shows it after the one section reload.
If any of these fail, the public brief covers them and steps 3 onward wait.

## 3. Full width (Manager side)
Places that constrain width today:
- `DesignTab.tsx:825` starter `mx-auto max-w-3xl px-6 py-10`: deleted with the starter.
- `DesignTab.tsx:808` canvas `style={deviceStyle}`: keep it for device preview only, and make Desktop = `width:100%` with no max-width (I'll check `deviceStyle` and the EmbeddedBox wrapper for padding or max-w).
- Held list `<section className="relative ...">`: no width limit, but BlockView/PageBlocks blocks carry their own `max-w-*`/`mx-auto` (`hasWideBlocks`). If the frame renders held blocks, the public styles decide this. If held blocks stay local, add a full-width variant prop on BlockView only in the editor.
- `FramedPageEditor.tsx:119/124`: already `w-full`, no padding. No change.
- `EmbeddedBox` / preview pane wrappers in DesignChat layout: I'll check for `p-*`/`mx-*` and remove any.

Public repo (separate brief): any `container`/`max-w-*`/`mx-auto` on the DB/draft page template and PageBlocks wrappers in edit mode. Brooklyn's request suggests left-aligned, full-width content at pane scale, so the brief will list those classes once the template has been read.

## 4. Avoiding regressions
- Flicker latch (21a40d7): with one surface there's nothing to choose between. The hook keeps only "loading until an embed URL exists, then framed" and stays latched per page/opening, so a URL change mid-session can't remount the frame. Existing DesignTab.live tests become "never renders a local surface".
- Layering (696ad27): keep `relative isolate` on `blockCanvasRef`, the drag-ghost dialog rule and the Tooltip portal. The InlineEditSurface isolation test moves to the object editor, which still uses it.
- Experiment and new pages: open as loading → frame. If the frame is unreachable, show the existing "Couldn't reach the public page" + Retry, with no local substitute (same rule as manifest pages). AGENTS.md rule "Authoritatively non-manifest DB pages retain local block editing" is replaced.
- Stored local-surface edits: DB-only pages may have `pages.inline_edits` keyed against the local DOM (starter section, local Header copy). Step 1 runs a query to count pages that are not in the manifest and have non-empty inline_edits. Header edits already live in `object_registry` and replay the same way. Page keys that don't match in the frame show up as "could not be applied" in the safety panel (real reports). The only key unique to the local surface is the starter section, which never saved anything except text. Plan: list affected pages, and if any exist, copy starter text into a text block once with a reviewed one-off update, otherwise nothing to do.

## 5. Order of work (each one can ship on its own)
1. **Verify (no code):** check the public draft on DB-only and 0-block pages, and run the stored-edits query. Send the public brief (template width classes, optional `heldBlocks`).
2. **Full width on the Manager side:** desktop `deviceStyle` without max-width, remove wrapper padding. Test: canvas and frame have no max-width/mx-auto at desktop.
3. **Frame for all pages:** `usePageEditorSurface` only returns loading/framed. DesignTab removes the local page/header surfaces, starter, Footer copy and local report/record branches. Tests: a DB-only page (late manifest, MANIFEST_CHANGED, cache reset) only ever renders loading then the frame. An unreachable frame shows Retry, not a starter. Add/reorder/delete/Draft-Ready on a DB-only page still save. Discard restores the snapshot.
4. **Held sections in the frame** (after public support): send `heldBlocks` in edit-init/edit-update. Remove the local held list when the frame confirms it can draw them (capability flag in `edit-ready`), and keep the local list for older frames. Tests: protocol validation, fallback when the flag is missing.
5. **Clean-up:** remove dead imports, update AGENTS.md, docs/public-page-separation.md, the regression checklist and roadmap. Run the full test suite and tsgo.

## Risks
- The public site may not serve DB-only or draft pages in edit mode. This blocks step 3, which is why step 1 comes first.
- Every DB page now depends on the public draft being reachable. When it isn't, there's Retry but no editing (an accepted trade-off for one surface).
- Section changes still reload the frame once each, so it's slower than local editing for new pages.
