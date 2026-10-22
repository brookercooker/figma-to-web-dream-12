# Option 2: convert pages and objects from their code — measured estimate

Status: measured and planned only. No app code was changed. The earlier "Content coming soon" plan is parked.

## 1. Inventory (measured)

**Method.** I wrote a throwaway read-only script (`/tmp/inv/inv.cjs`) that uses the TypeScript compiler from `node_modules` (`@babel/parser` is not installed). It parsed 22 files of public routed pages and 36 objects in `src/components/objects` (the registry file is excluded).

**What counts as static.** An element counts as "static (would convert exactly)" only when all of these hold:
- it is a plain HTML tag;
- every attribute is a literal, or a `src` that is an imported asset;
- its `className` is a literal string;
- it has no handlers, refs or spreads;
- it is not inside a condition (`&&`, `?:`) or a `.map` over a non-literal array.

Repeating over a `const` array in the same file counts as convertible. A component tag such as `<Header/>` or `<Section>` counts as not exact; its children are judged separately.

**How files are classed.**
- **A:** at least 90% of elements are static, with no animation and no dynamic `.map`.
- **B:** at least 50% static.
- **C:** less than 50% static.

### Totals

| | Files | A | B | C | JSX elements | Static | Converts exactly |
|---|---|---|---|---|---|---|---|
| Pages | 22 | 1 | 12 | 9 | 1,311 | 861 | **65.7%** |
| Objects | 36 | 3 | 23 | 10 | 634 | 378 | **59.6%** |
| All | 58 | 4 (7%) | 35 (60%) | 19 (33%) | 1,945 | 1,239 | **63.7%** |

Other counts:
- **Pictures and videos:** only 15 of 52 `<img>`/`<video>` sources are literal or an imported asset. Most come from data files, `assetUrl()` or props, so pictures are the largest gap.
- **Links:** 53 of 74 hrefs are literal.
- **Class names:** 1,227 literal vs 35 built from expressions (`cn()`, templates, conditions). Styling is overwhelmingly literal, which is good news.
- **`.map`:** 21 over literal arrays vs 32 over data, props or hooks.
- **Animation and carousels:** found in 3 objects: FeaturedBrand, HinkleyNewArrivals and QuorumNewArrivals.
- **Screen measurement and refs:** 6 files.

Note: Terms & Conditions alone is 481 elements, about 25% of all elements, and is 81% static. It lifts the overall percentage. Without it, about 59% of elements convert exactly.

### Per file
Columns: class, % of static elements, main reason.

**Pages**

| Page | Class | Static | Main reason |
|---|---|---|---|
| ObjectsFlyer | A | 90% | Literal layout, one literal map |
| PrivacyPolicyPage | B | 83% | Text-heavy. Islands: the `<Section>`/`<List>` helpers and the `useEffect` page title |
| TermsConditionsPage | B | 81% | Same pattern, plus 5 class names built from expressions |
| TestPage | B | 82% | Static, with 3 component tags |
| NotFound | B | 89% | Static text, uses the current address |
| ComingSoonPage | B | 80% | Tiny, page-title effect |
| ShippingPolicyPage / ReturnPolicyPage | B | 65% / 67% | `<Section>` helper islands |
| Index (home) | B | 70% | 21 objects embedded; 2 of 3 images not literal |
| RaceTestPage | B | 67% | Tiny |
| FullVendorListPage | B | 53% | 2 maps over data, `useMemo` |
| TeamPage | B | 56% | 1 map over data |
| LocationsPage | B | 50% | Locations data map, 3 non-literal links |
| ObjectsLightingTips | C | 45% | Uses state; 1 picture not literal |
| BrandHighlightPage | C | 45% | Map over data, picture not literal |
| SimplePage (About) | C | 44% | Wraps the AboutUs object, scroll-to-anchor effect |
| InspirationGalleryPage | C | 40% | Filters: 4 `useState`, 5 `useMemo`, 5 maps over data |
| OutdoorEditPage | C | 38% | 3 maps over data, pictures not literal |
| LandingPage / DbPage | C | 40% / 25% | Content comes from the database, not code (already editable as blocks) |
| ContactPage | C | 28% | Form with 5 `useState`, 42 component tags |
| NewAndNowPage | C | 27% | 4 maps over data, 7 class names built from expressions |

**Objects**

| Object | Class | Static | Main reason |
|---|---|---|---|
| ExampleQuoteBanner, TestObject1 | A | 100% | Fully literal |
| DesignServicesCard | A | 92% | Literal; pictures from a data import |
| AboutUs | B | 83% | Literal, 2 literal maps, 5 data imports |
| AinslieCard, FeaturedBrandQuorum | B | 83–86% | Mostly literal |
| DesignServices, ExampleFixtureSpotlight, ExampleSplitNewsletter | B | 80–82% | Literal |
| RaceSecondTest, BrandRepresentation, LocationsTeaser, ExampleVisitStrip | B | 73–78% | Small islands |
| CarouselControl, LightingTipsTeaser, ExampleFaqList | B | 64–67% | State and data maps |
| ShowroomFloor, RecentProjects, InspirationGalleries, ExploreOurProducts, PageCounter, ExampleTimeline, ExampleCareGuide, CurrentEvents, ExampleStatsRow, Categories | B | 50–62% | Maps over data, pictures from data |
| MailchimpForm | C | 48% | Form, 6 `useState` |
| ExampleServiceTiers, InTheNews, NovaInTheNews, YouMayLike, SteveObject | C | 38–43% | Data maps, state |
| FeaturedBrand | C | 36% | Animated carousel |
| NumberCounter | C | 25% | Count-up animation, screen measurement |
| HinkleyNewArrivals, QuorumNewArrivals | C | 17% | Carousels, state, effects |

**What the numbers say.** Almost nothing converts completely: only 4 of 58 files are class A. Most files (60%) are mostly static with islands. So option 2 only pays off when converted parts and locked islands can sit side by side, which is exactly the owner's constraint.

The two biggest islands are **helper components defined in the same file** (`<Section>`, `<List>`) and **data arrays imported from other files** (pictures, locations, brands). Following both would lift many B files towards A. Estimate: about +12 to +15 percentage points, to roughly 75–78% of elements (not measured; it is the next spike step).

## 2. Source converter design

**Where it runs.** In the public site's build, in the same Vite plugin and command-line tool as `scripts/siteManifest.mjs`. It writes `public/site-blocks.json` next to `site-manifest.json` and shares its build id. It reuses the TypeScript compiler, so nothing new is added to the site visitors download.

**Output, per page or object:**
`{ key, file, buildId, hash, blocks: Section[] }`. It reuses the object editor's `Section` union from `src/components/ObjectSections.tsx`.

**How each construct maps:**

| Code construct | Editor type |
|---|---|
| `h1`–`h6` | heading text item |
| `p`, `span`, inline text | text item |
| `a` / `Link` with a literal href | button or underlined text item with a link |
| `img` (literal or imported asset) | `SectionImage` / image row |
| `video` | `SectionVideo` |
| `hr`, or a border-only `div` | divider |
| A wrapper `div`/`section` with grid or flex classes | `free` section (positions taken from the layout classes) or split section |
| `.map` over a literal array | repeated items in captioned images / image row; the array's items become the items |

**No mapping (becomes a locked island):** `form`/`input`, `svg` drawings, `iframe`, carousels or animation, anything inside a condition, a map over data or hooks, components from other files, hook output, spread attributes, and event handlers.

**Styling.** Known Tailwind classes map to the editor's style options:
- type size and weight, font family (`font-serif`);
- text colour tokens, alignment, spacing (`mt-*`, `px-*`), rounded corners, width.

Every class is also kept word for word in `className`, so the converted block renders identically even where the style panel doesn't show the option. Classes built from expressions keep the element locked.

**Pictures and links.**
- An imported asset resolves to its built URL through Vite's own asset handling, so paths survive file renames.
- A literal `/...` URL is kept as written.
- `assetUrl("x")` with a literal argument is evaluated during the build, because it is pure.

**Components inside a page.**
- **Objects from the registry** (`<TeamObject/>`) become an object block that points to that object's own converted entry. This matches today's shared-object model.
- **Helpers in the same file** (`Section`, `List`) are expanded inline when their body is static and they only take literal props and children.
- **Site header and footer, shadcn parts and other components** stay locked islands, rendered live through the existing `CodedChunk`.

**Conditional or dynamic parts.** The smallest enclosing element becomes `LockedSection { codedKey, chunk }`. The chunk is identified by its position in the code (see IDs below), so the editor renders that part live, as it does today. Each island can still be changed with the chat, added above or below, moved, duplicated or deleted.

**Stable IDs.** `file + component name + element path` (the child indexes from the component's return), plus a short hash of the tag and literal text. The plugin also adds `data-nova-src="<id>"` to each element. That makes write-back possible and lets the option 1 checker match rendered pieces to blocks.

**Living alongside option 1 (the checker).** Each converted section is flagged `verified: pending`. When the editor opens it, the checker:
1. renders the converted section and the live chunk off-screen;
2. compares the text, the pictures, and the boxes' size and position, allowing ±2 px;
3. if they differ, swaps the section back to a locked block.

The result is stored per `hash`, so each code version is checked only once. The current on-screen method (`sectionsFromDom`) stays as a third fallback for parts the checker rejects.

## 3. Saving changes back

**(a) Changes saved in the database, as today** (`pages.content` or `inline_edits` overrides keyed by stable ID instead of screen position):
- Instant, and works with Draft and Ready.
- But the code and the stored content drift apart. When the code changes, an override for an ID that no longer exists is orphaned. Today it is silently lost; with hashes, it can be detected and flagged.

**(b) Writing changes back into the code as small commits**, located through `data-nova-src`:
- One truth: the edit becomes a code change in the public site's repository, reviewed by Submit for review, and the chat sees the real code.
- Needs the design service (the relay) to apply the change and commit to the draft branch. The editor would send `{id, old text, new text, class changes}`.
- Breaks when the code moved since the build. Guard: compare the element's hash at the tagged position, and reject with "the page changed, reload" when it differs.

**Recommendation:** (b) fits the draft → Submit for review pipeline best. Edits become draft commits, just like chat changes, so review, rollback and publishing all work unchanged.
- Keep (a) as the fallback while the service is offline, for locked islands, and for database pages.
- Phase it: text and links first (the safest single-literal replacements), then classes and pictures.

## 4. Estimate

Effort assumes one engineer familiar with the codebase. Prompts are focused Lovable requests of similar size to recent ones.

| Step | Engineer-days | Prompts |
|---|---|---|
| (i) Inventory + parser spike (incl. following helpers and data imports, measuring the gain) | 1–2 | 2–3 |
| (ii) Static converter for class A and the static parts of B → `site-blocks.json` | 4–6 | 6–8 |
| (iii) Locked islands for B (smallest enclosing element, stable IDs, `CodedChunk` wiring) | 3–5 | 4–6 |
| (iv) Editor integration: load `site-blocks.json`, fall back to live in-place editing, old overrides keep working | 3–4 | 4–5 |
| (v) Write-back via relay commits (text and links, then classes and pictures) | 5–8 | 6–10, plus relay-side work |
| (vi) Tests and sample files (one snapshot per page and object, round-trip tests) | 3–4 | 3–4 |
| (vii) Option 1 checker as the safety net | 3–4 | 3–5 |
| **Total** | **22–33 days** | **28–41** |

### Phases

1. **Spike + converter + islands + editor reading the file** (i–iv, about 11–17 days). Visible on its own: pages and objects open instantly as blocks, with no off-screen render or 6 s wait, and islands are clearly locked.
   - Element share editable as blocks: about 64% (as measured today), or about 75% once same-file helpers and literal data imports are followed.
   - Pages that open with most of their content editable (at least 50%): 13 of 22 pages and 26 of 36 objects.
2. **Checker** (vii). Same coverage, but no risk of a block that looks different from the live page. Expect a few percentage points to drop back to locked.
3. **Tests** (vi), spread through phases 1–2.
4. **Write-back** (v). Edits become draft commits, and no orphaned overrides remain when the code changes.

### Top 5 risks

1. **Pictures from data.** Only 15 of 52 media sources are literal. Without following imported data arrays, most pictures stay locked, and pictures are what staff change most.
2. **Matching the look exactly.** Free-form Tailwind (responsive prefixes, arbitrary values, parent and child state styling) only matches if every class is kept word for word and the block renderer reproduces the HTML structure. Otherwise converted blocks look slightly different. The checker mitigates this.
3. **Code drift.** Stable IDs shift when the builder rearranges JSX, which orphans overrides or breaks write-back. Hashes and a "page changed" refusal are needed.
4. **Two converters to maintain** (code and on-screen) until the on-screen one can be retired. Double the edge cases.
5. **Write-back depends on the design service and repository permissions.** Conflicts with chat edits running at the same time on the same draft.

### Go / no-go

**Conditional go for phase 1 only.**
- **For:** styling is 97% literal and text is mostly literal. Most files (60%) are "mostly static with islands", which is the model the owner asked for. Opening becomes instant and predictable.
- **Against:** only 7% of files convert completely, and pictures are mostly dynamic. "Fully editable pages" will not happen; "mostly editable with clearly locked parts" will.
- **Go condition:** the spike (step i) must show that following same-file helpers and literal data imports lifts exact conversion to at least 75% of elements and at least 50% of pictures. If not, stay with today's on-screen conversion plus the parked "Content coming soon" fix.
- Decide on write-back (v) after phase 1 is in use.

## Notes

- Paths that are not touched: `src/integrations/supabase/*`, `supabase/functions/*`, `useThumbnailCapture.ts`.
- This planning session can only edit this plan, so the roadmap line for this task is added when building starts.
