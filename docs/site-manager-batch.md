# Site Manager editing refinements

## Behavior
- Chat library cards toggle attached references immediately; Done dismisses without adding them again.
- Leave dialogs retain order/styles with save, discard and pencil icons.
- Tool groups open for each fresh selection and remain manually collapsible.
- Font controls name the inherited font and render choices in their fonts.
- Local Undo/Redo live at the right end of the left header; saving/object-editor disable rules and shortcuts remain unchanged.
- Image deletion reuses the five-second undo window, checks saved page/object content and edits as well as public usage, warns by name, and deletes files before rows. A storage error stops row deletion. No saved page/object references are rewritten.
- Object thumbnails prefer signed saved images. Missing previews queue serial local captures with router and thumbnail contexts, lazy commit readiness, image/font settling and fingerprint-safe saved inline replay. Draft/designed objects are included. Empty objects or failed captures retain a neutral placeholder; regeneration preserves the prior saved image on failure.
- Pickers open beneath the measured toolbar border with a short downward animation rather than moving in from above the page.

## Scroll protocol
The Manager records validated `{ source: "nova-site", type: "page-scroll", path, y }` reports per normalized path and posts `{ source: "nova-manager", type: "restore-scroll", path, y }` to the exact origin/window. Restores happen on edit-ready, preview-ready/location, shown-preview swaps and return from Manual Edit Mode. Hidden preview scroll reports are ignored. No database write is involved.

## Frame lifecycle audit
| Trigger | Outcome |
| --- | --- |
| First Preview opening | Necessary initial frame. |
| Manual-mode entry/exit, Finish/Discard | Preview remains mounted; edit frame opens/closes intentionally, with scroll handoff. |
| Page switch | Editor is keyed by page ID to reset Sections/history; preview uses in-frame navigation first. |
| Preview navigation unavailable/unconfirmed after 3 seconds | One deliberate address fallback; retained. |
| Editor Retry | Deliberate remount, may adopt the latest signed base. |
| Editor signed base/token changes during ordinary rerenders | Fixed: latch opening address until Retry or page change. |
| Section changes before edit-ready | Fixed: wait for capability negotiation before any legacy reload. |
| Section changes after ready | Capable frames receive edit-update without reload; older frames reload once per section revision. |
| Inline/shared edits, selection, style/placeholder, reports | edit-update/query only; no reload. |
| Separate object editor opening/return | Page editor temporarily unmounts; matching-path scroll remains in session. |
| Preview version/build changes | Deliberate fresh-frame loads and bounded follow-ups retained. |
| Superseded builder-finished timers after build detection/page navigation | Fixed: cancel older retry series. |
| Preview address expiry | Necessary refreshed signed address; restore after ready/shown swap. |
| Navigation during an address fetch | One queued follow-up for the requested page; retained. |
| Swap timeout | Chooses a loaded/pending frame; does not itself create a frame. |

## Verification
Signed-in checks verified reference toggle, desktop/manual/narrow picker placement, history position, generated stored object previews, used-image single/bulk confirmation, and temporary image upload → delete → Undo → delete → reload (test image removed).
Hosted preview/edit frames had no supplied draft address during this check, despite the public protocol deployment; real hosted scroll handoff is therefore unverified. Exact-origin protocol, same-page restoration and frame retention are tested locally.