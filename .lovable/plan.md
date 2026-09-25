## Goal

A phone-first capture page at `/manage/capture`, installable to your home screen, where you take or pick photos and videos, name and label them, mark which page they're destined for, and then upload the whole batch into the existing Images and Video tools in one go.

## How it works

```text
[ Capture ]  ->  [ Stage & tag ]  ->  [ Upload batch ]
 camera/roll     name, labels,        buckets + rows
 multi-select    used-on page         + labels + usage
```

Nothing leaves the phone until you press Upload. Everything you tag beforehand is written alongside the row, so items never land untagged in the manager.

## What gets built

**1. Installable app shell (manifest only)**
- Web app manifest with Nova name, ink/tan theme color, standalone display, and app icons; head tags for manifest, theme color, Apple touch icon.
- No service worker, no offline mode — home-screen only, so it stays simple and can never serve stale code.

**2. Capture screen — `/manage/capture`**
- Behind the existing Site Manager login, same gate as every other manager route.
- Large capture button using a file input with `capture="environment"` so the phone opens the camera directly; a second control picks existing media from the roll.
- Accepts multiple files at once; each is auto-routed by MIME type to photos or video.

**3. Staging list (the pre-tagging step)**
Each file becomes a card with a local thumbnail (object URL for photos, captured first frame for videos) plus:
- **Name** — editable, pre-filled from the filename, duplicate-checked against the library before upload.
- **Labels** — the existing label picker, scoped correctly (image labels for photos, video labels for videos, since labels are per-tool).
- **Used on page** — page selector.
- Remove-from-batch control.

A batch bar applies name prefix, labels, and used-on page to every staged item at once, then you adjust individuals.

**4. Upload** reuses the exact pipelines already in `ImagesTab` and `VideoTab`, with progress, per-file success/failure, and failed items left staged for retry.

## How the backend (Lovable Cloud) is involved — in depth

**Auth.** The page renders inside the existing `AdminGate`. The backend client already persists the session in localStorage and auto-refreshes tokens, which matters here: a phone left idle mid-shoot must not have its upload rejected. Every storage and table call carries that session's JWT, and your `is_site_user()` / `is_admin()` role functions decide what it can do. No new auth work.

**Storage — four buckets, all private.**
- Photos: the untouched original goes to `images-original`; a client-side WebP derivative goes to `images-web`.
- Videos: the file goes to `videos-original`; a poster frame is generated in the browser from a canvas grab and uploaded alongside it.
- Because every bucket is private, nothing is readable by URL. The app calls `createSignedUrl` after upload and stores that signed URL on the row, and the manager re-signs on demand for thumbnails. That is exactly why the manager fires sign calls when you scroll the Images list.
- Storage writes are governed by RLS policies on `storage.objects`, which is why the earlier "new row violates row-level security policy" error appeared. Uploading from a phone hits the identical policies — if it works on desktop for your account, it works here.

**Database — no schema changes required.** Every table this needs already exists:
- `images` — filename, `original_path` / `web_path`, `original_url` / `web_url`, dimensions, byte sizes, `tags`, and the EXIF columns (`taken_at`, `camera`, `lens`, `gps_lat`, `gps_lng`, `place_name`).
- `videos` — name, `storage_path` / `storage_url`, `poster_path` / `poster_url`, duration, dimensions, `tags`.
- `image_page_usages` and `video_page_usages` — the join rows written from your "used on page" selection.
- `tags` — the shared label table, partitioned by its `scope` column and supporting up to four levels of nesting. The capture screen reads `scope = 'images'` or `scope = 'videos'` and writes the selected ids into the row's `tags` array.
- `slug_id` is filled automatically by the `set_image_slug_id` / `set_video_slug_id` triggers, so the client never invents one.

**Guardrails that fire on every capture upload.** The `images_reject_source_paths` trigger rejects any row whose paths point at a build-time `src/assets/...` location, and the client repeats that check before inserting. Both apply to the capture page unchanged — a phone upload physically cannot reintroduce the broken-path bug you fixed earlier.

**Edge functions.** After each photo insert, EXIF is parsed in the browser and, when GPS is present, the coordinates are sent to your existing `reverse-geocode` function to resolve a place name. This runs in the background and never blocks the upload — a failed geocode just leaves `place_name` empty. This is where field capture actually pays off: photos taken on a phone carry real GPS and capture timestamps, so showroom shots become searchable by location and date automatically.

**Ordering matters.** Upload file → insert row → write labels and usage rows → kick off EXIF in the background. If the file upload succeeds but the insert fails, the orphaned object is removed so storage doesn't accumulate untracked files.

**Cost/behavior note.** Uploads are sequential with limited concurrency rather than all-at-once, because a phone on cellular pushing ten originals in parallel will time out. Photos are downscaled client-side first, so a 12MP shot uploads at a fraction of its raw size while the full original still lands in `images-original`.

## Technical notes

- New route `/manage/capture`; new `src/pages/admin/CapturePage.tsx` plus a `useBatchUpload` hook.
- Upload logic currently inline in `ImagesTab.tsx` and `VideoTab.tsx` gets extracted into shared `uploadImage.ts` / `uploadVideo.ts` so both the tabs and the capture page use one implementation and cannot drift.
- Manifest at `public/manifest.webmanifest`, icons under `public/`.
- No migration needed.

## Caveats

- iOS installs from Safari only, via Share → Add to Home Screen; a manifest cannot trigger that prompt.
- Without a service worker, launching the installed app with no signal shows the browser offline page. Offline queueing can be added later if field connectivity proves to be a real problem.
