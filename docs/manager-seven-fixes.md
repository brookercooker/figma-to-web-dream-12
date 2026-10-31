# Manager live-test follow-up

- Replace Picture and toolbar image references now use `web_url`, `fallback_url`, then `original_url`, excluding raw private staging URLs. `web_path` is metadata for signed thumbnail lookup, not a source for synthesized public image references. Images tiles retain signed-thumbnail/local-preview priority, then try the same stored URLs. Exhausted sources render a neutral image icon, not broken-image alt text.
- The existing trusted frame handler accepts `{ source: "nova-site", type: "edit-key", key: "Delete" | "Backspace" }` after readiness and only for its current image snapshot. It invokes the same `hidden:<key>="1"` edit as Delete Image. Repeated deletion is a no-op; Manager history/save/discard remain authoritative.
- Section confirmations use the name field; incoming leading drag-handle glyphs are removed from that field.
- Pages tables use available-container width, hiding secondary fields before names/status/actions become squeezed. Three action columns stay pinned right. Both tables fit in a 778px content area at a 1440px viewport.
- Manager owns its document title while mounted. Visitor capture effects cannot replace `Pages · Site Manager`, `Preview · Site Manager`, or the corresponding tool title.
- Help describes Discard since the last save, multi-object addition and Save returning to Chat Mode.
- Footer-scope selections on pages use the existing site-wide Footer edit confirmation rather than inline page editing.

## Verification

All 877 tests passed; preview reports build OK. Signed-in 1440×1000 checks confirmed table/action bounds and title stability. No saved page content was changed. The localhost image check exhausted sampled asset URLs and showed neutral placeholders; this does not establish that all hosted thumbnails load. Public-frame Delete/Footer interaction remains unverified because the public preview requires a separate Lovable login; exact payload and image Undo/Redo/Discard tests passed.