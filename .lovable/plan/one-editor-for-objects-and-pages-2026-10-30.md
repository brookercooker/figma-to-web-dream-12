# One editor for objects and pages

Objects open in the same screen as Manual Edit Mode pages. The edit frame shows the real public rendering of one object, and the Site Manager keeps the same left panel, top-bar Save Changes, Undo/Redo and dialogs. CodedObjectEditor, the embedded ObjectDesignPage and the standalone designer are retired once the new editor works.

## Screens

```text
+-------------------------------+------------------------------------------+
| Account Tools Review Help  ↶ ↷|  Preview Objects Images Videos   [Save]  |
| [Chat | Manual Edit]          |                                          |
| ← Back to Homepage            |   public edit frame:                     |
| Editing Site Header           |   /__object/<id>?nova-edit=1             |
| Site-wide object · every page |   (the object alone, full width)         |
| Discard Changes               |                                          |
| hint / option groups          |                                          |
| Reset All Edits               |                                          |
| Sections (designed objects)   |                                          |
+-------------------------------+------------------------------------------+
```

- **Header note:** the first line is "Editing <object name>". The note under it depends on the kind of object:
  - **Shared objects:** "Shared object · used on Homepage, About".
  - **Site Header / Site Footer:** "Site-wide object · shown on every page".
  - **Page copies:** "This copy is only used on <page>".
- **Back link:** it replaces the page switcher and its arrows. It reads "Back to <page name>" when you came from a page, and "Back to Objects" when you came from Tools > Objects.
- **Unchanged parts:** Discard Changes, the hint, Reset All Edits, the option groups (InlineStylePanel, link, picture, video and placeholder controls), Undo/Redo in the left header and Save Changes at top right all stay as they are.
- **Leaving with unsaved edits:** the back link, switching mode, the page switcher or any other way out goes through the same "Save Your Changes?" dialog.
- **Chat Mode while the editor is open:** the pickers and chat references keep working.

## Designed objects: sections as held blocks

A designed object's `content` (its list of sections) is handled like a page's held blocks:
- it appears in the same Sections list, with Move Up/Down and Delete;
- drag and drop uses edit-block-move;
- selecting works from the frame with edit-block-select;
- sections are added from the Objects / Images / Videos pickers.

| Today's designer section | New editor |
|---|---|
| free (paragraphs, dividers, buttons, icons) | Text and buttons edited in the frame. Adding a paragraph, divider or button uses an "Add to Section" menu in the section's options. |
| split, overlay, imageRow, captionedImages, carousel | Pictures, wording and links edited in the frame. Their layout settings go into a new "Section Layout" group. |
| button | Wording and link edited in the frame. |
| locked (converted coded parts) | Shown as now, and can be moved and deleted. |
| Picker image / video | A new image or video section. |
| Picker object | Nesting an object inside an object is not supported today, so the picker shows it greyed out with a short reason. |

Designer features with no counterpart in the page editor. Each gets a home in the panel's "Section Layout" group, shown when a section bar is selected, so nothing is dropped:
- **Layout:** columns and split ratio, and flow (inline or separate).
- **Spacing and alignment:** row and section alignment, vertical alignment.
- **Background and outlines:** colour or image, frame and outline (card outline, block frame).
- **Pictures:** height, fit, scrim, shadow, and free picture group positions.
- **Carousel:** carousel settings.
- **Picture text:** captions and picture text layers.

Each of these settings is checked against ObjectDesignPage before it is retired. Anything not carried over is listed in docs, not removed silently.

## Saving

Save Changes in the object editor:
1. Writes `object_registry.inline_edits` and/or `content` with the same checks as today.
2. Sends the content sync with lines named `Object "<name>": …`.
3. Starts thumbnail regeneration in the background.
4. Then, depending on where you came from:
   - **From a page:** returns to that page in Manual Edit Mode, scrolled to the object's slot.
   - **From Objects:** stays in the object editor.

Discard, Reset All Edits and Undo/Redo work the same as on pages. The frame never writes anything.

## Message shapes to agree with the public site

- **Route:** `/__object/<id>?nova-edit=1&nova-origin=<manager origin>`.
  - It renders one object by id, with no site header, footer or page wrapper, and is reachable only with the gated edit token.
  - Site Header and Footer are opened by id too (their object_registry rows).
- **`edit-ready`:** the same as today. Adds `capabilities.objectScope: true` and `objectSections: true` (designed objects).
- **`edit-init` / `edit-update`:** the same fields as today, plus:
  - `scope: "object"` and `objectId`;
  - `object: { name, status, component_key, siteWide }`;
  - `inlineEdits` (the object's own saved edits);
  - `heldBlocks` (designed objects only): the object's sections in order, plus `activeBlockId`, with the same caps (50 sections, 500 KB).
- **Frame → Manager:** the same as pages, so `edit-change`, `edit-select`, `edit-block-select`, `edit-block-move`, `edit-size`, `edit-undo` / `edit-redo`, `page-scroll` and `edit-applied` all keep their current shape.
  - Selections carry `scope` = the object's component_key, as today for objects shown on a page.
  - Coded objects never send section messages.
  - `edit-navigate` and `edit-object-click` are ignored in object scope.
- **Return scroll:** after Save, the Manager sends the page frame `{ source: "nova-manager", type: "scroll-to-slot", slot }`. The page frame scrolls to that object.

## What is removed

- **CodedObjectEditor.tsx.**
- **The embedded ObjectDesignPage:** every DesignTab → ObjectDesignPage hand-off goes, and ObjectDesignPage itself is deleted once everything below is kept or moved.
- **The standalone `/manage/objects/design` page:** the route now redirects to the new editor and keeps `object`, `returnPage` and `section`.
- **The local section editors and object option panels** used only by those screens.
- **What is kept:**
  - importCodedObject (converting a coded object into a designed one);
  - section normalising and parsing on load (lib/pageChunks);
  - the shared ObjectSections renderer (still byte-identical to the public site);
  - thumbnail capture;
  - ObjectWorkspace's status/save dialog, moved to the new editor's top bar.

## Order of work

1. **Agree the shapes.** Agree the route and message shapes with the public site and add them to the frame protocol module and its tests.
2. **Set up a check of today's output.** For every object with saved inline edits or content, record what it renders today. Use the existing thumbnail capture container, one record per object id, stored for comparison only.
3. **Add the object editor.** Add `ObjectEditor`, using FramedPageEditor with object scope, the shared panel parts, Save Changes, Discard, Reset, Undo/Redo, the "Save Your Changes?" dialog and the back link. Coded objects come first.
4. **Edit designed objects' sections.** Use held blocks for them in the Sections list, pickers and drag and drop, plus the "Section Layout" group (ported settings).
5. **Switch every way in over to ObjectEditor:**
   - Open in Object Editor;
   - the object click dialog;
   - Tools > Objects;
   - the old standalone route.
6. **Hook up the save.** Add the save steps (changes lines, thumbnail, return to the page and scroll to the object).
7. **Check rendering matches.** Compare the step 2 records against the new frame's output, using its `edit-applied` reports and a rendered copy. Every mismatch blocks removal.
8. **Remove the old editors.** Retire them, clean up imports and update AGENTS.md, docs and the roadmap.
9. **Test and finish.** Run the full test suite and a production build.

## Tests

- **Object scope messages:** edit-init carries object scope, and object-scope messages are accepted only from the exact frame and origin.
- **Header note:** wording for shared objects, site-wide objects and page copies, and Back to page vs Back to Objects.
- **Sections:** adding, moving and deleting a designed object's sections, then saving writes `content`, and Discard restores it.
- **Save:** writes only the object, sends `Object "…"` lines, starts the thumbnail, then returns to the page with scroll-to-slot, or stays when opened from Objects.
- **Unsaved edits:** the "Save Your Changes?" dialog appears on every way out.
- **Old route:** the redirect keeps its parameters.
- **Same rendering:** every saved object renders the same before and after.

## Risks

- **Public route not ready or unreachable:** the editor shows Retry, as pages do, and never falls back to a local copy. The old editors stay until step 7 passes.
- **Settings in the designer with no frame counterpart:** a wrong mapping could hide a setting. The check in step 4 and the list in docs are there to catch this.
- **Edit keys shifting:** keys for coded objects could change if the public rendering differs from the local copy. The step 7 comparison and fingerprints report mismatches before anything is retired.
- **Size cap:** large designed objects could pass the 500 KB limit. The editor then falls back to a section list with one reload per change.
- **Header/Footer objects:** they must still never be archived or copied.
- **Going back to the page:** the return must not lose the page's own unsaved state. The page is saved or discarded before the object opens, as today.

## Technical notes

- **New files:** `src/pages/admin/ObjectEditor.tsx`, and `objectEditorState.ts` (pure state, undo and save helpers).
- **Reused as they are:** `framedPageProtocol.ts` (scope field added), `manualEditHistory.ts`, `changeLines.ts`, `contentSync.ts`.
- **DesignChatContext:** `objectOpen` gains `{ id, section?, from: { pageId } | "objects" }`.
- **Database:** none planned.
