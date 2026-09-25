# Add scrolling marquee to the object editor

## What you'll get
- A new **Scrolling strip** layout option for any block with pictures or short text items (like brand names).
- Items slide continuously in a loop, with soft faded edges, like the homepage "Proudly Representing" strip.
- Side-panel settings (no pop-ups):
  - **Direction**: Left / Right
  - **Speed**: Slow / Medium / Fast
  - **Pause on hover**: On / Off
  - **Add store brand names**: one click fills the strip from the brand list
- Mini previews and thumbnails show the strip paused, like carousels.
- Converting the homepage brand strip (and "Our Brands") keeps it as a scrolling strip instead of a static row.

## Technical details
- `ObjectSections.tsx`: add `gallery: "marquee"` plus `marquee?: { direction, speed, pauseOnHover }` on free sections; new `MarqueeGallery` renders items twice in a `w-max` flex track using existing `scroll` / `scroll-reverse` keyframes, gradient edge masks from `background` token; paused when `useIsThumbnail()`. Text items render as serif names with `text-foreground/80`.
- `ObjectDesignPage.tsx`: add "Scrolling strip" to the layout picker and the settings group above; "Add store brand names" pulls `vendorNames` from `src/data/vendors.ts` into text items.
- `importCodedObject.ts`: detect elements with an infinite linear `animation-name` of `scroll`/`scroll-reverse` (or an `w-max` track with duplicated children), take the first half of children as items, set `gallery: "marquee"` and direction/speed from the computed animation.
- Verify in the test browser: add a strip, change settings, convert the homepage and confirm the brand strip moves.
