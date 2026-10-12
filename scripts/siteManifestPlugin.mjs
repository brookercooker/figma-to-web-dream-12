// Vite plugin: serves /site-manifest.json while developing and writes it into the build output.
// See siteManifest.mjs for what is in it.
import path from "node:path";
import { buildManifest } from "./siteManifest.mjs";

export default function siteManifest() {
  let root = process.cwd();
  const buildId = String(Date.now());
  const make = () => JSON.stringify(buildManifest({ srcDir: path.join(root, "src"), buildId }));
  return {
    name: "site-manifest",
    configResolved(config) { root = config.root; },
    configureServer(server) {
      server.middlewares.use("/site-manifest.json", (_req, res) => {
        try {
          const body = make();
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("Access-Control-Allow-Origin", "*"); // lists page paths only; the Site Manager may run on another origin
          res.end(body);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "site-manifest.json", source: make() });
    },
  };
}
