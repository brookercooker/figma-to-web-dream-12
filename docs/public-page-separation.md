# Phase 4 / Separation Step 6

## Outcome

DesignTab (embedded and standalone) opens every manifest page in FramedPageEditor, including Homepage, Contact, About, Team, Locations, Full Vendor List, Inspiration Gallery, Test Page, Race Test Page and custom landing pages. It no longer imports codedPages or PageRoute. When the manifest has not loaded, it fails closed to the public editor rather than inventing an empty original. Authoritatively non-manifest database pages retain their existing local block editor.

All existing inline_edits keys are sent unchanged through edit-init/update. The manager remains the only database writer. Held sections remain local, original first; save/discard persistence and explicit section revisions are unchanged.

## Removed

- DesignTab's local coded-page selection/rendering, PageRoute import and unused Suspense/PageMiniPreview imports.
- Unused canIframe export.
- `src/pages/admin/codedPages.tsx.orig`: stale duplicate map and old section-splitting implementation.
- The codedPages section-splitting re-export; ObjectDesignPage now imports the existing shared lib/pageChunks directly.
- Copy-specific preservation tests/mocks, replaced with frame coverage across the required page paths and positional-map save/discard assertions.

No PageImportProbe exists in this checkout.

## Retained dependencies (not safe to delete)

| Files | Current uses / reason |
| --- | --- |
| codedPages.tsx and its page imports (Index, Contact, SimplePage/About, Team, Locations, FullVendorList, InspirationGallery, TestPage, RaceTestPage, custom landing pages, policy/marketing pages) | Local visitor routes in App.tsx still render these. PageMiniPreview uses them for Pages/Landing thumbnails. PageCodeSection uses them for legacy saved `code` blocks. InlineEditsLayer uses map membership to append saved local content. These are compatibility consumers, not the page edit entry path. |
| designChat/LivePreviewPage.tsx | PageCodeSection's fallback for saved code-block pages without a mapped copy; its local module glob is not used by DesignTab. |
| PageCodeSection.tsx / PageRoute | PageBlocks renders existing saved code blocks; deleting would break stored content. |
| lib/pageChunks.ts | InlineEditSurface section discovery and ObjectDesignPage's explicit conversion. |
| importCodedObject.ts / sectionsFromDom / CodedImportProbe | ObjectDesignPage's confirmed object conversion; unrelated to public page entry. |
| InlineEditSurface, InlineEditsLayer, objectScopes and object registry | Shared object editor, previews, Header, visitor replay and object thumbnails. |
| PageMiniPreview, ObjectMiniPreview, ObjectLiveThumbnail, ObjectPreview, ObjectRoute | Active Pages/Landing/Object lists and capture workflows. |
| LinkAuditView, PagesTab, siteManifest | Link audit and authoritative page/usage discovery. LinkAudit itself does not import codedPages. |

Unused historical object/page prototypes and unrelated .orig/.rej artifacts were left alone; no speculative deletion of source that may be referenced by stored metadata.

**Limit:** this phase retires duplicate markup from page editing, not from every compatibility surface. Deleting all routed page files would require a separate local-route/thumbnail/saved-code-block replacement. They were retained as explicitly required by the no-used-file-deletion constraint.

## Positional-key comparison

Read-only public snapshot: Nova Lighting Public Site, commit `b85827c9`.

Both InlineEditSurface copies have byte-identical `pathOf(root, el)`: walk element parents, prepend each child's index in `parent.children`, join with dots. Their surface wrappers both add one inner root; React routing/Suspense providers do not add DOM wrappers. Public frameRoot is outside that root. Therefore **the same rendered page DOM and scope root produce identical positional keys**, despite the complete surface files not being identical. A concrete compatibility test fixes paths `0.0.3` and `0.1`, checks public/local algorithms and replay.

Source comparison: Index, Contact, Team, Locations, FullVendorList, InspirationGallery, TestPage and RaceTestPage were byte-identical across projects. This is not a guarantee for dynamic descendants, data, responsive menus or future code changes.

SimplePage differs: public markup can add a `Content coming soon.` paragraph when children are absent. TestLandingPage differs: the manager retains scheduled/expired variants while the public copy no longer renders those branches. **The same URL is not guaranteed to have the same DOM, so About/other SimplePage variants and scheduled/expired landing pages may have drifted keys.** No keys or fingerprints were rewritten, no saved rows were migrated. Fingerprinted replay remains fail-closed; legacy edits without fingerprints remain subject to positional drift. Public /brands redirecting to /coming-soon remains expected.

The public snapshot suppresses appended saved sections for framed `nova-edit=1` pages before and after the handshake; local held sections therefore render once with that public version. Older public deployments may still show duplicate saved additions.

## Verification and delivery

Full manager test suite covers per-page frame entry, exact-origin/source guards, preserved positional maps, held save/discard, section order, one reload per section action, timeout/load-error handling, explicit Retry and no automatic retry.

Signed-in localhost check: Contact opened in Manual Edit Mode with “Couldn't reach the public page” and Retry, no empty substitute, no runtime errors and no recursive frame/document requests. The live design/preview service returned no draft embed address in this session, so real public selection/style/save read-back cannot be reverified here; the user's earlier live Draft verification is not presented as a new check.

Git commits are managed by the hosting harness; no manual git commit was created. Changes are delivered together in this task. Actual commit grouping is not independently controlled by the agent.