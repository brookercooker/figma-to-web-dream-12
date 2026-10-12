# lovable-embed-url + Design Chat tab: setup

The Site Manager has the design chat always on the right, and the **Preview** tab (`/manage/preview`) shows an
embedded draft preview of the design project. The chat talks to the design helper (`prototyper-local`)
running on the same computer; the preview address comes from this function.

## One-time setup

In Brooklyn Prototype (Lovable Cloud) the code is already added and the function deploys automatically. Add secrets in Project Settings → Secrets instead of using the `supabase secrets set` commands below (same names and values).

1. **Design project.** Brooklyn Prototype, id `f9b2e62f-9648-44be-ad77-9e823be093ea` (Nova Lighting workspace, Business plan). The preview and the chat both target it. (An earlier throwaway test project, `02046e1a-39a5-44ee-85a4-1aca1c9a8220`, is no longer used.)
2. **API key.** (The name `LOVABLE_API_KEY` is reserved in Lovable Cloud, so this function reads `LOVABLE_EMBED_API_KEY`.) In the builder's workspace settings, create an API key with the `projects:write` scope.
   Put it in Supabase yourself: `supabase secrets set LOVABLE_EMBED_API_KEY=...` (never paste it in chat or commit it).
3. **Other secrets.**
   - `LOVABLE_PROJECT_ID=f9b2e62f-9648-44be-ad77-9e823be093ea`
   - `supabase secrets set EMBED_PARENT_ORIGINS=https://<your deployed Site Manager address>`
     The address must be https, with no port. `http://localhost:...` cannot be used for the preview.
4. **Deploy:** `supabase functions deploy lovable-embed-url`
   (`supabase/config.toml` already sets `verify_jwt = false`; the function does its own check.)
5. **Sign-in check.** The Site Manager is currently a prototype with no real sign-in, so the function
   would refuse every call (it requires a signed-in admin). Until real sign-in is wired up, and only for
   this test: `supabase secrets set EMBED_ALLOW_UNAUTHENTICATED=1`. Anyone who can reach the function
   address from an allowed origin can then request the preview of the test project. Remove the secret
   when sign-in is real.
6. **Site Manager build setting (optional):** `VITE_DESIGN_RELAY_URL` (default `http://127.0.0.1:4321/__prototyper`).

## Every session

Start the design helper on the computer you're using:

```
PROJECT_ID=f9b2e62f-9648-44be-ad77-9e823be093ea DRAFT_ONLY=1 ALLOW_ORIGIN=https://<your Site Manager address> npm start
```

Then open the Site Manager, go to Design Chat, and send a request.

Restart the helper after you update it. The newest helper is needed for file attachments and for the
review and publish state that the tab shows.

## What the layout does

- Tabs along the top: Preview, Pages, Objects, Images, Videos. The chat stays on the right whichever tab is open, and
  the preview keeps running behind the other tabs.
- Chat: type a request, attach pictures or documents (paperclip, drag and drop, or paste; up to 5 files, 10 MB each),
  or dictate with the microphone. Problems found by the review show in the chat with a "Fix this for me" button.
- Top bar: Mobile / Tablet / Desktop and Full screen (Preview tab only), a link to the published site, and Submit for
  review. In a narrow window the bar shortens itself (tab names first, then the size buttons).
- Pages tab: the chat-bubble button on a row makes the chat work on that page. The preview opens on it, the chat shows
  "Working on <page>", and the helper tells the builder which page. The page's address is added to the preview address;
  Lovable doesn't document this, so if the preview stays on the home page, tell us.
- If the helper isn't running the chat says so and keeps retrying.

The chat is meant to edit a separate design site that has no connection to the Site Manager (point `LOVABLE_PROJECT_ID`
here and `PROJECT_ID` for the helper at that site, for example the Demo Site).

## Tests

`npm test` runs the tab's tests (`src/pages/admin/__tests__/DesignChatTab.test.tsx` and
`src/pages/admin/designChat/__tests__/logic.test.ts`). They use a pretend helper, so nothing needs to be running.

## Notes

- The preview address lasts 1 hour. The tab asks for a new one before it expires and each time a change finishes.
- The embed shows the builder's draft preview (rebuilt after each change), not the published site.
- Hiding the builder's badge is a project setting on the paid workspace.
