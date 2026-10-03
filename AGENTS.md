
- Coded pages are edited in place via InlineEditSurface; page overrides live in pages.inline_edits, shared-object overrides in object_registry.inline_edits (objects found via React fiber walk in lib/objectScopes), both keyed by DOM position and re-applied site-wide by InlineEditsLayer — avoids lossy conversion and keeps objects consistent everywhere.
- Coded objects open as live, as-built parts (locked sections with codedKey+chunk rendered by CodedChunk); only parts the user edits are converted, in place within the whole object — keeps untouched parts pixel-identical.
- Site Manager reads/writes the real Lovable Cloud database via `src/prototype/client.ts` (product catalog still demo); open-access `dev_open_all` policies are temporary while building and must be dropped before launch.
