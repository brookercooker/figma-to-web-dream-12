
- Coded pages are edited in place via InlineEditSurface; page overrides live in pages.inline_edits, shared-object overrides in object_registry.inline_edits (objects found via React fiber walk in lib/objectScopes), both keyed by DOM position and re-applied site-wide by InlineEditsLayer — avoids lossy conversion and keeps objects consistent everywhere.
