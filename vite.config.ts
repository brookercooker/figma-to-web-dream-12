import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import siteManifest from "./scripts/siteManifestPlugin.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // siteManifest(): writes site-manifest.json (pages, objects, what each page uses) for the Site Manager.
  plugins: [react(), siteManifest(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Bumps on every build. Used by the Site Manager to detect when stored
    // thumbnails are stale relative to the currently-deployed app version.
    __BUILD_ID__: JSON.stringify(String(Date.now())),
  },
}));
