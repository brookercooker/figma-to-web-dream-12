# Public Manual Edit: collapsible text expansion

Manager is implemented; no public files were changed. Existing section `collapsed` state and `edit-toggle` are section visibility, not FAQ open state. Detached Manager snapshots cannot click public accordion triggers or select unmounted answers.

## Exact protocol

Public frame announces the additional capability on existing readiness:

```ts
{ source: "nova-site", type: "edit-ready",
  capabilities: { /* keep other capabilities */ expandableContent: true } }
```

When a question/trigger or visible answer is selected, include metadata on the existing snapshot. `path` is the original numeric dotted path of the item's trigger in the same scope, not a CSS selector or URL. The ordinary selection key remains the question/answer element's own path.

```ts
{ source: "nova-site", type: "edit-select", selection: {
  key: "0.2.0", scope: "page", kind: "text", tag: "button",
  text: "Question wording", html: "Question wording", style: {}, rect: {},
  expandable: { path: "0.2.0", open: false }
} }
```

Manager's Expand Item / Collapse Item sends:

```ts
{ source: "nova-manager", type: "edit-expand",
  scope: "page", path: "0.2.0", open: true }
```

`open:false` collapses. Scope can also be the existing object scope, e.g. `object:<id>`. After applying the actual state, reply with a refreshed **existing `edit-select`** snapshot of the same selected element, including `expandable.open` and updated rect/style. No new reply message is needed. Manager does not optimistically report success. Errors/no-op must retain actual open state in the refreshed selection.

## Public handlers and rendering

- The public edit bridge that handles `edit-ready`, `edit-select`, `edit-init` and `edit-update` must advertise this capability, serialize expansion metadata, and handle `edit-expand`. This separate public project's bridge filename cannot be verified from Manager; `PreviewBridge.tsx` is known to own navigation but must only handle this if it also owns edit messages.
- Public `src/components/InlineEditSurface.tsx` (or its equivalent selection adapter) must discover a selected question's closest registered accordion item and identify its original trigger path. Preserve ordinary text selection instead of treating trigger clicks as visitor navigation.
- The pendant feature page's FAQ component and any shared accordion/collapsible implementation must provide a controlled, edit-session-only open setter; for native `details`, set `open`. For Radix/custom accordions, use the component state rather than simulating arbitrary DOM clicks. Exact pendant-page/shared-component filenames are not present in this Manager project.
- Expand only the owning item. Keep the selected question editable, render/mount the answer, then let ordinary answer clicks produce ordinary text `edit-select` and `edit-change` messages. Do not inject copied answer text into the Manager or change its key scheme.
- Open/closed state is temporary presentation state: never add it to inline edits, saved page/object data, history, publishing or content sync. Restore original visitor state on edit-exit. Preserve temporary open state through edit-update so typing does not close the answer.

## Safety

Accept only in an active edit session from the exact approved Manager origin and parent window. Validate source/type, boolean `open`, valid original numeric dotted path and current scope. Resolve against the registered editable trigger/item map in that scope; do not accept selectors, markup, URLs or arbitrary method names. Wrong scope/path is a no-op. No cross-origin DOM access. Shared-object selections retain the normal object-editor requirement. Manager accepts metadata only after the trusted frame handshake and refuses stale-selection expansion callbacks.

## Checks

Select closed question → Expand Item → answer visible/selectable → edit question/answer → Undo/Redo/Save preserve ordinary edits. Collapse updates button state without adding an edit. Repeat in object editor and phone sheet. Test wrong origin/window/path, stale selection, older frames, repeated updates and exit restoration.