# Saved video editing (Manager only)

Sections and SavedVideoOptions mutate held content through existing changeBlocks/history. Save writes only pages.content or object_registry.content. No video library row or storage file is deleted. Nested object videos are removed from their containing section's videos array without deleting text, pictures or sibling videos.

Manager uses poster images, falling back to the standard YouTube thumbnail when a poster is missing or fails. It never mounts a live player in the saved-video panel or local held-block canvas.

## Existing public-frame contract

No new message or delete affordance is required for the reliable Sections path. Poster clicks should use the existing selection message:

```ts
{ source: "nova-site", type: "edit-block-select", id: "saved-block-id" }
```

The Manager updates its existing held-block payload, selection and scope:

```ts
{ source: "nova-manager", type: "edit-update",
  heldBlocks: [/* remaining blocks, with the existing optional page-content marker */],
  activeBlockId: null,
  // Existing edits, objectEdits, collapsed, selectedKey and scope fields unchanged.
}
```

Object frames retain existing scope:"object" and object snapshot fields. If a nested object-video poster supports selection, its edit-block-select id is the existing stored video id; Manager resolves it to the containing section's video. The Sections path needs no frame response and remains usable while the frame is unavailable or a player swallows clicks. Frames without heldBlocks retain the existing one-reload-per-section-change behavior. Exact origin/window guards are unchanged.

## Chat hand-off

Assistant replies containing "saved in Site Manager", or Site Manager plus remove/delete/replace, offer an opt-in button when a saved working/preview page is known. It uses the existing mode guard and opens that page, with a one-shot page-scoped hint. Exact URL or a single matching video/image/section determines selection; ambiguity opens just the page. No relay signal or call is added. Replies lacking historical page metadata use the currently picked page; identifying an older reply's different page precisely still requires that metadata.

## Verification

Focused tests cover list/panel confirmation, page and nested-object removal, undo/redo/discard, no library writes, object Save, poster fallback and chat handoff. Signed-in real /draft/experiment: select from Sections, confirm local deletion, empty state, Undo restores; desktop/tablet/phone poster/options render without panel overflow. Nothing was saved during that browser check. Actual public-frame poster selection remains unverified because the public edit frame was unavailable.