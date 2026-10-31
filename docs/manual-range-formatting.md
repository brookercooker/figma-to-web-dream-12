# Manual Edit word formatting

The Manager accepts `edit-ready.capabilities.rangeFormatting: true`, followed by `edit-range { key, scope, collapsed, text, marks: { bold, italic, underline, strike, color, size, weight, font } }`. Messages require the ready frame's exact origin and window, valid fields and the current selection's key/scope.

With a noncollapsed range, controls reflect its marks and send `edit-format { key, scope, command, value? }` with commands `bold`, `italic`, `underline`, `strike`, `color`, `size`, `weight`, `font`, `clear`. The frame retains its range while panel fields/popovers have focus and emits `edit-change` with the resulting scoped map. That map uses existing fingerprint validation, unsaved state, save/discard and Undo/Redo; commands alone do not invent saved overrides. Alignment and spacing remain whole-element properties.

Collapsed/absent ranges and older frames retain whole-element controls, without a limitation note. Selection headers use `edit-select.selection.text` and optional string `context`; images use alt/filename plus thumbnail. The compact colour popover offers semantic brand tokens, inheritance and validated custom hex values.