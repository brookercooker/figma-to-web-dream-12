// Site manifest: which pages the public site has, which objects each page renders, and which images / videos / links each
// page (and each object) refers to.
//
// This is the only thing the Site Manager needs from the public site's code. The public site writes it on every build
// (and serves it while developing); the Site Manager reads it to show "Used on". It replaces the Site Manager scanning the
// public site's source files from inside its own bundle, which can't work once the two are separate projects.
//
// Plain JavaScript on purpose: it runs in Node (Vite plugin, command line, tests) with nothing to compile.
//
//   node scripts/siteManifest.mjs            prints a summary
//   node scripts/siteManifest.mjs --write    also writes public/site-manifest.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MANIFEST_VERSION = 1;

// Folders and files that belong to the Site Manager, the router shell, or tests: never scanned.
const SKIP_DIR = /(^|\/)(pages\/admin|__tests__|test|prototype|integrations)(\/|$)/;
const SKIP_FILE = /(\.test\.|\.spec\.|^App\.tsx$|^main\.tsx$|^components\/objects\/registry\.tsx$)/;

function walk(dir, rel = "", out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "node_modules") continue;
      walk(path.join(dir, e.name), r, out);
    } else if (/\.tsx$/.test(e.name)) out.push(r);
  }
  return out;
}

/** "/src/…" key for a file relative to src. */
const keyOf = (rel) => `/src/${rel}`;

/** Resolve an import specifier written in `fromRel` (relative to src) to a "/src/….tsx" key, or null. */
function resolveSpec(spec, fromRel, known) {
  let p;
  if (spec.startsWith("@/")) p = spec.slice(2);
  else if (spec.startsWith("./") || spec.startsWith("../")) p = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
  else return null;
  if (!/\.tsx$/i.test(p)) p += ".tsx";
  const k = keyOf(p);
  return known.has(k) ? k : null;
}

// ─── Objects ─────────────────────────────────────────────────────────────────

/** component_key → module file, read from the registry itself so there is no second list to keep in step. */
function readRegistry(srcDir, known) {
  const file = path.join(srcDir, "components/objects/registry.tsx");
  if (!fs.existsSync(file)) return {};
  const src = fs.readFileSync(file, "utf8");
  const out = {};
  const re = /([A-Za-z0-9_]+)\s*:\s*lazyEntry\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)/g;
  for (const m of src.matchAll(re)) {
    const spec = m[2].startsWith("./") ? `@/components/objects/${m[2].slice(2)}` : m[2];
    const mod = resolveSpec(spec, "components/objects/registry.tsx", known);
    out[m[1]] = mod; // may be null when the file is not found
  }
  return out;
}

function referencesObject(src, key, moduleRel) {
  if (src.includes(`objectRegistry.${key}`) || src.includes(`objectRegistry["${key}"]`) || src.includes(`objectRegistry['${key}']`)) return true;
  if (!moduleRel) return false;
  const escaped = moduleRel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`from\\s+["'][^"']*${escaped}(?:\\.tsx)?["']`).test(src);
}

/** Split a module with several `export const X =` into per-export blocks (each block keeps the shared preamble). */
function splitExports(src) {
  const matches = [...src.matchAll(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g)];
  if (matches.length === 0) return [];
  const preamble = src.slice(0, matches[0].index ?? 0);
  return matches.map((m, i) => {
    const start = m.index ?? 0;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? src.length : src.length;
    return { name: m[1], body: `${preamble}\n${src.slice(start, end)}` };
  });
}

/** Which of `keys` a source file renders: `true` for the whole file, or the names of the exports that do. */
function objectsIn(file, src, keys, registry) {
  const out = {};
  const blocks = splitExports(src);
  for (const key of keys) {
    const mod = registry[key];
    if (mod && mod === file) continue; // an object's own module doesn't "use" itself
    const moduleRel = mod ? mod.replace(/^\/src\//, "").replace(/\.tsx$/, "") : null;
    if (blocks.length > 1) {
      const hit = blocks.filter((b) => referencesObject(b.body, key, moduleRel)).map((b) => b.name);
      if (hit.length) { out[key] = hit; continue; }
    }
    if (referencesObject(src, key, moduleRel)) out[key] = true;
  }
  return out;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

function readRoutes(srcDir, known) {
  const appFile = path.join(srcDir, "App.tsx");
  if (!fs.existsSync(appFile)) return [];
  const src = fs.readFileSync(appFile, "utf8");
  const locals = {};
  // const Foo = lazy(() => import("…"))  /  lazyRetry(() => import("…"))
  const lazyRe = /const\s+([A-Za-z0-9_]+)\s*=\s*lazy(?:Retry)?\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)\s*\)/g;
  for (const m of src.matchAll(lazyRe)) {
    const file = resolveSpec(m[2], "App.tsx", known);
    if (file) locals[m[1]] = { file };
  }
  // const Foo = lazy(() => SimplePages().then((m) => ({ default: m.Bar })))
  const simpleRe = /const\s+([A-Za-z0-9_]+)\s*=\s*lazy(?:Retry)?\(\s*\(\)\s*=>\s*SimplePages\(\)[^;]*?m\.([A-Za-z0-9_]+)/g;
  for (const m of src.matchAll(simpleRe)) locals[m[1]] = { file: "/src/pages/SimplePage.tsx", exportName: m[2] };

  const routes = [];
  const routeRe = /<Route\s+[^>]*?path=(?:"([^"]+)"|\{"([^"]+)"\})[^>]*?element=\{\s*<([A-Za-z0-9_]+)/g;
  for (const m of src.matchAll(routeRe)) {
    const local = locals[m[3]];
    if (!local) continue;
    routes.push({ path: m[1] ?? m[2], file: local.file, ...(local.exportName ? { exportName: local.exportName } : {}) });
  }

  // Custom landing pages: { slug: "x", component: lazyRetry(() => import("./Y")) }  →  /landing/x
  const landingFile = path.join(srcDir, "pages/landing/customLandingPages.ts");
  if (fs.existsSync(landingFile)) {
    const ls = fs.readFileSync(landingFile, "utf8");
    const re = /slug:\s*["']([^"']+)["']\s*,\s*component:\s*lazy(?:Retry)?\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']\s*\)/g;
    for (const m of ls.matchAll(re)) {
      const file = resolveSpec(m[2], "pages/landing/customLandingPages.ts", known);
      if (file) routes.push({ path: `/landing/${m[1]}`, file });
    }
  }
  return routes;
}

// ─── Things a file refers to (images, videos, links) ─────────────────────────

/**
 * The quoted pieces of text in a file that could name an asset: paths, file names, ids, addresses. Text with spaces is
 * ordinary copy and is left out, which keeps the manifest small. Lower-cased, so matching ignores case.
 */
export function referencesIn(src) {
  const out = new Set();
  for (const m of src.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n]){6,400}?)\1/g)) {
    const s = m[2];
    if (/\s/.test(s)) continue;
    out.add(s.toLowerCase());
  }
  // Template strings: `/media/${x}/hero.webp` → the fixed pieces on either side of the holes.
  for (const m of src.matchAll(/`([^`]{6,600})`/g)) {
    for (const piece of m[1].split(/\$\{[^}]*\}/)) {
      const p = piece.trim();
      if (p.length >= 6 && !/\s/.test(p)) out.add(p.toLowerCase());
    }
  }
  return [...out].sort();
}

// ─── The manifest ────────────────────────────────────────────────────────────

/**
 * @param {{ srcDir: string, buildId?: string }} opts
 * @returns the manifest (see `docs` below)
 *
 * {
 *   version, generatedAt, buildId,
 *   pages:   [{ path, type: "static" | "landing", file, exportName?, objects: [componentKey], files: [file] }],
 *   objects: { [componentKey]: { file, files? } },      // the module each object lives in
 *   files:   { [file]: { refs: [lower-cased quoted text that could name an asset] } }
 * }
 *
 * A page's `files` is its own file plus the modules of the objects it renders, so an image that lives inside an object is
 * counted for the pages that show that object.
 */
export function buildManifest({ srcDir, buildId = "" }) {
  const all = walk(srcDir).filter((rel) => !SKIP_DIR.test(rel) && !SKIP_FILE.test(rel));
  const known = new Set(walk(srcDir).map(keyOf)); // everything, so imports of skipped files still resolve
  const registry = readRegistry(srcDir, known);
  const keys = Object.keys(registry);

  const sources = {};
  for (const rel of all) sources[keyOf(rel)] = fs.readFileSync(path.join(srcDir, rel), "utf8");

  const routes = readRoutes(srcDir, known);
  const seen = new Set();
  const pages = [];
  for (const r of routes) {
    // Catch-all and parameter routes ("*", "/:slug", "/landing/:slug") render pages stored in the database, not code.
    if (/[*:]/.test(r.path)) continue;
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    const src = sources[r.file];
    if (src == null) continue;
    const used = objectsIn(r.file, src, keys, registry);
    const objects = Object.entries(used)
      .filter(([, v]) => v === true || !r.exportName || v.includes(r.exportName))
      .map(([k]) => k)
      .sort();
    const files = [r.file, ...objects.map((k) => registry[k]).filter(Boolean)];
    pages.push({
      path: r.path,
      type: r.path.startsWith("/landing/") ? "landing" : "static",
      file: r.file,
      ...(r.exportName ? { exportName: r.exportName } : {}),
      objects,
      files: [...new Set(files)],
    });
  }

  const wanted = new Set(pages.flatMap((p) => p.files));
  const files = {};
  for (const f of [...wanted].sort()) {
    if (sources[f] == null) {
      // An object module outside the scanned set (e.g. under a skipped folder) is read directly.
      const abs = path.join(srcDir, f.replace(/^\/src\//, ""));
      if (!fs.existsSync(abs)) continue;
      files[f] = { refs: referencesIn(fs.readFileSync(abs, "utf8")) };
    } else files[f] = { refs: referencesIn(sources[f]) };
  }

  const objects = {};
  for (const k of keys) if (registry[k]) objects[k] = { file: registry[k] };

  return {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    buildId: String(buildId),
    pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
    objects,
    files,
  };
}

// ─── Command line ────────────────────────────────────────────────────────────

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const m = buildManifest({ srcDir: path.join(root, "src"), buildId: String(Date.now()) });
  const refs = Object.values(m.files).reduce((n, f) => n + f.refs.length, 0);
  console.log(`${m.pages.length} pages, ${Object.keys(m.objects).length} objects, ${Object.keys(m.files).length} files, ${refs} references`);
  for (const p of m.pages) console.log(`  ${p.type.padEnd(7)} ${p.path.padEnd(32)} ${p.objects.join(", ")}`);
  if (process.argv.includes("--write")) {
    const out = path.join(root, "public", "site-manifest.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(m));
    console.log(`wrote ${path.relative(root, out)} (${fs.statSync(out).size} bytes)`);
  }
}
