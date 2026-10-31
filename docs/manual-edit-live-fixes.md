# Brooklyn Manual Edit live fixes

- Brand swatches resolve Manager CSS variables to concrete hex before `edit-format`, matching custom Apply; public documents do not inherit Manager tokens. Formatting waits for `edit-change` before recording history. Fingerprint-only/no-op changes do not add Undo steps.
- Letter spacing stores pixels and converts existing em/rem values for display. Line height is a unitless multiplier; existing px/% values convert for display.
- Object usage combines saved blocks/swaps, manifest component placements and trusted `edit-sections` object IDs retained per normalized page path. Frame placements are session metadata, not stored content. Missing componentKey in clicks falls back to the registry; unknown usage remains unknown rather than permitting accidental global edits. The object editor's usage header also includes manifest/observed placements. Its own sections omit Shared.
- Manual add-object thumbnails toggle selections; Add N Objects inserts one batch/history action. Replace Object remains single-select.
- Page held-section controls say Move to Top/Bottom and target the page-content boundary; object-internal and coded sibling moves remain Move Up/Down.
- Deletion asks for confirmation. Held removal and Undo/Redo update Manager rows and frame payloads immediately, without waiting for a new `edit-sections`. A named removal toast offers Undo. Coded deletion still requires the public frame's `edit-change` before persistence/history is authoritative.
- Chat preview sends the unchanged `preview-content` message proactively on registered iframe load and again on trusted preview-ready and successful saves. Exact target origin/window and stale delivery guards remain. No extra public message shape was introduced.
- Wording grows to its measured scroll height, up to eight lines, with width-change remeasurement.
- Equal frame state is not resent. Twenty capable-frame section moves/undos retain the same iframe and message listener. Legacy frames still require one compatibility reload per section action; reducing their rendering latency requires heldBlocks support, not weakening handshake checks.

## Verification

Full suite: 859 tests passed across 94 files. Preview build/typecheck: OK.

Signed-in 1440×1000 Homepage check: 31 object picker cards loaded; two cards stayed selected with Add 2 Objects; Deselect All disabled Add 0 Objects. Confirmed About Us removal updated immediately, toast Undo restored it, Save/Discard returned disabled. No Save was pressed and no page content was written.

Real Chat preview returned Failed to fetch with zero public iframes; Homepage public editor returned Couldn't reach the public page. Spotlight on /draft and real word formatting/section latency remain unverified because the design service did not supply a working public connection. The public-side parent-origin handler lives in another project and was not changed here.