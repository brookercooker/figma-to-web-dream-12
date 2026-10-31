# Manual Edit panel: Brooklyn batch

## Controls
- Expand is the first collapsed rail icon. Account/Tools expand on menu opening (pointer and keyboard); Review expands before opening its list.
- Text headers contain one auto-growing Selected Text field, with the frame context beneath. Text-node diffs retain unchanged bold/italic/colour markup; escaped/sanitized HTML is stored under the existing selection key. Frame edit-change updates the field through normal edits.
- Text rows: B/I/U/S, size, colour; then font and weight. Position: alignment, letter spacing and line height, wrapping when narrow.
- Picture removal is a page/object inline edit, not deletion from the image library. Delete/Backspace ignores focused fields and dialogs; Restore Image removes the override. The public frame retains responsibility for the existing shared-object click/copy guard and image-key handling inside its window.
- Paste a Google Icon parses an inert document, accepts Material outlined/rounded/sharp and legacy classes plus optional link tags, validates name characters and rejects scripts/events/extra markup. Only style/name are rendered/stored. Presets and original/none remain.
- One Link Address field shows kind and inline choices, nested searchable page list, email/phone input types and protocols. Remove Link is destructive. No separate Goes To/helper buttons.
- Discard drops edits since the last save. Restore Original Page/Object removes all saved hand edits in its own scope, confirmed and staged until Save Changes/review; page restoration does not clear shared object edits.

## Exact storage/message shapes
```text
<key>: "sanitized inline html"
hidden:<key>: "1"
icon:<key>: "material:<outlined|rounded|sharp>:<name>"

nova-site -> Manager: {type:"preview-ready"} (existing source/path also accepted)
Manager -> exact ready preview frame:
{source:"nova-manager",type:"preview-content",
 pages:[{path,content,inline_edits}],
 objects:[{id,name,component_key,content,inline_edits,site_wide}]}
```
Existing edit-init/edit-update, edit-change/edit-range/edit-format, Undo/Redo and fingerprint shapes are unchanged. Legacy preview-edits follows full content for older frames. Public must mirror src/lib/inlineEditCore.ts (new hidden kind and Material icon rendering) verbatim and load the corresponding Material font families.

## Saved preview and relay
Ready pages only, no archived or internal paths; all nonarchived objects independent of deprecated status. Reads check returned errors. Trusted source/window/origin, last-load sequencing and unmount guards apply; errors expose Retry and retry reads after 20 seconds. Saves dispatch CONTENT_SAVED before the coalesced /content/sync so immediate database content does not wait for a public rebuild.

Relay blocked/error responses and exhausted 30-minute retries show the saved-but-preview-could-not-update message. Retry reissues full-content reads and owed sync; busy reviews keep the existing deferred message. Save exceptions or missing object rows retain pending edits and display an error.

Public-altering migrations/bulk changes must call notifyContentEdited or request one /content/sync once the transaction succeeds. No migration/bulk public change was performed in this batch; a catch-up request for the previous object-status change was attempted in the signed-in browser, but the design service was unreachable.

## Verification
Signed-in 1600x1000 check: Expand first; Account/Tools menus expand and open; Review expands and renders its list. Real public editing/preview connection and catch-up sync unavailable (failed fetch). No page test content was written. Automated regressions cover parsers, link protocols, preserved markup, hidden Undo/Redo/Discard/save and full preview payload/filtering/failure Retry.
An isolated signed-in display also verified text-box editing preserves bold markup, Material rounded paste stores material:rounded:home and displays its icon, and the 360px panel has no horizontal overflow. This does not substitute for the blocked public-frame end-to-end check.