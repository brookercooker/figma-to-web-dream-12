# Home page can't be edited manually: findings and fix

## What happens, step by step

### Rows in the `pages` table (queried)
All three rows below are live (not archived) and have no saved content (`content` is null):

| Name | Path | Slug id |
|---|---|---|
| Homepage | `/` | homepage-59318a |
| About | `/about` | about-968c65 |
| Team | `/team` | team-dcaf16 |

There is no row with path `/home`.

### 1. The address the preview reports
- `DesignChatContext.tsx` (message listener, around line 135) accepts `{source:"nova-site", type:"location", path}` from the preview frame.
- The code that sends this message lives in the public site's own project, not in this repo. I found no sender here, so **I could not verify** whether the front page reports `/` or `/home`.
- In this repo's own routes (`App.tsx`), the front page component (`Index.tsx`) lives at **`/home`**, and `/` redirects to `/manage/pages`. The public-site copy most likely uses the same route, so the preview would report `/home`.

### 2. Looking up the page and the "Edit manually" button
- `usePreviewPage` (`designChat/usePreviewPage.ts:64`) normalises the address with `normalizePreviewPath`. That only trims trailing slashes, so `/home` stays `/home`.
- The lookup only tries both spellings one way round: `key === "/" ? ["/", "/home"] : [key]`. For `/home` it searches `["/home"]` only, so the `/` row is never found.
- `pageToRegister` (`registerPage.ts`) refuses to auto-register both `/` and `/home` (`key === "/" || key === "/home"`). So `registrable` is null, and nothing is ever inserted for the home page. That rules out an insert collision or refusal.
- `ChatPanel.tsx:154-155`: the button is disabled when `!editTarget?.id && !previewRegistrable`. Its tooltip then reads "This address isn't a page that can be edited."
- `ChatPanel` is the only place that uses `previewPage` / `previewRegistrable`. No other gate, edit policy or allow/deny list blocks the home page.
  - `pagePolicy.ts` `codedPathOf` maps `/` to `/home`, so the home page gets "tweak".
  - `manifestPageSync.ts` treats `/home` and `/` as the same page, so no duplicate row is created.

**Throwaway trace (verified).** I ran `/tmp/home/trace.ts` against the real functions and the real row paths. It is not part of the project.

| Address reported | Lookup | Row found | Can auto-register | Edit manually |
|---|---|---|---|---|
| `/` | `/`, `/home` | `/` | no | **on** |
| `/home` | `/home` | none | none | **off** |
| `/home/` | `/home` | none | none | **off** |
| `/about` | `/about` | `/about` | no | **on** |

### 3. The editor itself
- `previewSrc("/")` gives `/home`, and `codedPages["/home"]` exists (`Index.tsx`). So the home page opens in the in-place editor directly; `LivePreviewPage` and the manifest are never used for it.
- The manifest lists the home page as `/home` → `/src/pages/Index.tsx`.
- The home page embeds 21 objects. I have **not verified** whether that makes the editor slow or choke. Nothing in the code points to a hard limit; the import probe has a 6 s wait, but that only applies to conversion, not to opening.
- Since the button is disabled, staff never get as far as the editor.

### 4. Browser
- Last time, the hosted preview and the draft could not be reached from here (`net::ERR_FAILED`), so I could not watch the real preview report the front page's address.

## Likely causes, ranked
1. **Most likely; the mechanism is verified, the trigger isn't confirmed.** The preview reports `/home`. The lookup only treats `/` as possibly meaning `/home`, never the other way round, so the `/` row isn't found. Auto-registration excludes `/home`, so the button stays greyed out.
2. **Unverified guess.** The preview reports `/` correctly, but the editor struggles with the 21-object home page. This is unlikely, because the report says staff cannot start editing at all.

## Minimal fix (not implemented)
1. **`usePreviewPage.ts`:** look up both spellings either way, so `["/", "/home"]` when the key is `/` or `/home`. Store the result in the cache under one shared key, so both spellings share it, and do the same in `registerPreviewPage`'s duplicate check.
2. **`registerPage.ts`:** add one shared `homeAlias` helper (`/home` → `/`) and use it in `normalizePreviewPath` callers. Keep refusing to auto-register the home page (its row already exists).
3. **First step of the fix:** add one `console.debug` of the reported address in `DesignChatContext`. That confirms which spelling the preview really sends.
4. **Tests:**
   - `usePreviewPage.test.tsx`: an address of `/home` finds a `/` row, and an address of `/` finds a `/home` row.
   - `ChatPanel.test.tsx`: "Edit manually" is enabled for `/home` when the home row exists.

Not touched: `src/integrations/supabase/*`, `supabase/functions/*`, `useThumbnailCapture.ts`.
