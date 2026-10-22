import { describe, expect, it, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildManifest, referencesIn } from "../../../scripts/siteManifest.mjs";

const w = (root: string, rel: string, text: string) => {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
};

describe("buildManifest (small made-up site)", () => {
  let root: string;
  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
    const src = path.join(root, "src");
    w(src, "App.tsx", `
      const Home = lazyRetry(() => import("./pages/Index.tsx"));
      const Contact = lazy(() => import("./pages/ContactPage"));
      const SimplePages = () => import("./pages/SimplePage.tsx");
      const AboutPage = lazyRetry(() => SimplePages().then((m) => ({ default: m.AboutPage })));
      const Admin = lazyRetry(() => import("./pages/admin/AdminIndex.tsx"));
      const DbPage = lazyRetry(() => import("./pages/DbPage.tsx"));
      <Route path="/home" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/manage/pages" element={<Admin />} />
      <Route path="/:slug" element={<DbPage />} />
    `);
    w(src, "components/objects/registry.tsx", `
      export const objectRegistry = {
        Hero: lazyEntry(() => import("./Hero")),
        Team: lazyEntry(() => import("@/components/TeamPreview")),
        Unused: lazyEntry(() => import("./Unused")),
      };`);
    w(src, "components/objects/Hero.tsx", `export default () => <img src="/storage/images-web/hero-banner.webp" />;`);
    w(src, "components/objects/Unused.tsx", `export default () => <p>unused</p>;`);
    w(src, "components/TeamPreview.tsx", `export default () => <img src="team-photo-large.jpg" />;`);
    w(src, "pages/Index.tsx", `import Hero from "@/components/objects/Hero";\nexport default () => <div><Hero /><video src="/storage/videos-web/intro-reel.mp4" /><p>Some ordinary words here</p></div>;`);
    w(src, "pages/ContactPage.tsx", `import { objectRegistry } from "@/components/objects/registry";\nconst T = objectRegistry.Team.component;\nexport default () => <T />;`);
    w(src, "pages/SimplePage.tsx", `
      import { objectRegistry } from "@/components/objects/registry";
      export const AboutPage = () => <div>{objectRegistry.Team.component && null}</div>;
      export const OtherPage = () => <div>{objectRegistry.Hero.component && null}</div>;`);
    w(src, "pages/DbPage.tsx", `export default () => null;`);
    w(src, "pages/admin/AdminIndex.tsx", `import Hero from "@/components/objects/Hero"; // the Site Manager is never scanned`);
  });
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  const make = () => buildManifest({ srcDir: path.join(root, "src"), buildId: "b1" });

  it("finds routes written with lazy and lazyRetry, and skips admin, catch-all and parameter routes", () => {
    const m = make();
    expect(m.pages.map((p: any) => p.path)).toEqual(["/about", "/contact", "/home"]);
    expect(m.version).toBe(1);
    expect(m.buildId).toBe("b1");
  });

  it("lists the objects each page renders (direct import and registry lookup)", () => {
    const m = make();
    const by = Object.fromEntries(m.pages.map((p: any) => [p.path, p.objects]));
    expect(by["/home"]).toEqual(["Hero"]);
    expect(by["/contact"]).toEqual(["Team"]);
  });

  it("splits a module with several pages, so each page only gets its own objects", () => {
    const m = make();
    const about = m.pages.find((p: any) => p.path === "/about");
    expect(about.exportName).toBe("AboutPage");
    expect(about.objects).toEqual(["Team"]); // not Hero, which only OtherPage uses
  });

  it("an object's own module is not counted as using itself, and unused objects are listed in the registry only", () => {
    const m = make();
    expect(Object.keys(m.objects).sort()).toEqual(["Hero", "Team", "Unused"]);
    expect(m.pages.every((p: any) => !p.objects.includes("Unused"))).toBe(true);
  });

  it("a page's files include the modules of its objects, so assets inside an object count for the page", () => {
    const m = make();
    const home = m.pages.find((p: any) => p.path === "/home");
    expect(home.files).toEqual(["/src/pages/Index.tsx", "/src/components/objects/Hero.tsx"]);
    expect(m.files["/src/components/objects/Hero.tsx"].refs).toContain("/storage/images-web/hero-banner.webp");
    expect(m.files["/src/pages/Index.tsx"].refs).toContain("/storage/videos-web/intro-reel.mp4");
  });
});

describe("referencesIn", () => {
  it("keeps paths, names and ids, drops sentences, lower-cases, and reads the fixed parts of template strings", () => {
    const refs = referencesIn(`
      const a = "/Images/Hero.WEBP"; const b = 'dQw4w9WgXcQ'; const c = "Some ordinary sentence here";
      const d = \`/media/\${id}/banner.png\`; const e = "short";`);
    expect(refs).toContain("/images/hero.webp");
    expect(refs).toContain("dqw4w9wgxcq");
    expect(refs).toContain("/media/");
    expect(refs).toContain("/banner.png");
    expect(refs).not.toContain("some ordinary sentence here");
    expect(refs).not.toContain("short");
  });
});

describe("buildManifest (the real site in this project)", () => {
  const m = buildManifest({ srcDir: path.resolve(__dirname, "../.."), buildId: "t" });
  it("finds the home page and the pages written with lazyRetry", () => {
    const paths = m.pages.map((p: any) => p.path);
    expect(paths).toContain("/home");
    expect(paths).toContain("/team");
    expect(paths.some((p: string) => /[*:]/.test(p))).toBe(false);
    expect(m.pages.length).toBeGreaterThan(10);
  });
  it("finds the custom landing pages", () => {
    expect(m.pages.some((p: any) => p.type === "landing")).toBe(true);
  });
  it("reads the objects from the registry", () => {
    expect(Object.keys(m.objects)).toContain("AboutUs");
    expect(Object.keys(m.objects).length).toBeGreaterThan(5);
  });
  it("never scans the Site Manager", () => {
    expect(Object.keys(m.files).some((f) => f.includes("/pages/admin/"))).toBe(false);
  });
});

describe("buildManifest (this site)", () => {
  it("lists the routed coded pages, including lazyRetry and AboutPage forms", () => {
    const m = buildManifest({ srcDir: path.resolve(__dirname, "../..") });
    const paths = m.pages.map((p: { path: string }) => p.path);
    for (const p of ["/shipping-policy", "/about", "/team", "/locations", "/contact"]) expect(paths).toContain(p);
    expect(m.pages.find((p: { path: string }) => p.path === "/about")).toMatchObject({ file: "/src/pages/SimplePage.tsx", exportName: "AboutPage" });
  });
});
