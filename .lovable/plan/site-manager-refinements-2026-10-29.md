# Site Manager refinements

Implement the nine changes without changing page content or existing save rules.

1. Toggle chat references directly from library cards, keeping their selected state and chat chips synchronized.
2. Add matching save, discard and editing icons to both leave dialogs.
3. Open editing option groups by default while retaining manual collapse.
4. Show the inherited font’s real name and display font choices in their own fonts.
5. Move local Undo/Redo into the right end of the left header.
6. Add confirmed single and bulk image deletion, including usage warnings and stored-file removal; reuse existing destructive-action timing.
7. Reuse object thumbnail capture and signed images, with background generation for missing thumbnails and neutral pending placeholders.
8. Correct picker downward opening so it originates beneath its measured button across modes and narrow windows.
9. Preserve scroll by page path across frame transitions and reloads, using the agreed messages; remove avoidable frame reloads without changing deliberate navigation or build refreshes.

## Technical details
- Preserve exact-origin/contentWindow checks for all scroll messages. Store scroll positions per normalized page path; only restore matching paths.
- Keep public frame markup authoritative and snapshot Undo/Redo unchanged.
- Inspect existing image deletion/storage and thumbnail helpers before reuse. Do not alter database permissions.
- Add focused tests, run the full suite, and verify key controls at desktop and narrow widths. Hosted frame checks depend on the public draft being reachable.