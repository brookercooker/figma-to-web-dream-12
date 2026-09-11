// Current app build id, injected by Vite's `define` at build time.
// Used to determine when stored screenshots need to be regenerated after
// a redeploy (pages edited directly in Lovable don't touch the DB).
declare const __BUILD_ID__: string | undefined;

export const BUILD_ID: string =
  typeof __BUILD_ID__ !== "undefined" && __BUILD_ID__ ? __BUILD_ID__ : "dev";
