import { describe, expect, it, vi } from "vitest";
import { buildOnce, missingPageRows } from "../manifestPageSync";

vi.mock("@/prototype/client", () => ({ supabase: {} }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: vi.fn() }));

describe("missingPageRows", () => {
  it("adds missing static pages with the shared ready draft shape and leaves inputs unchanged", () => {
    const manifest = [{ path: "/race-test-page/", type: "static" as const }, { path: "/existing", type: "static" as const }];
    const existing = [{ path: "/existing", archived_at: null }];
    const before = JSON.stringify({ manifest, existing });
    expect(missingPageRows(manifest, existing)).toEqual([{
      name: "Race Test Page", path: "/race-test-page", page_type: "static", status: "draft", build_status: "ready",
      content: null, inline_edits: {}, slug_id: expect.stringMatching(/^race-test-page-[0-9a-f]{6}$/),
    }]);
    expect(JSON.stringify({ manifest, existing })).toBe(before);
  });
  it("counts archived rows as existing without resurrecting them", () => {
    expect(missingPageRows([{ path: "/archived", type: "static" }], [{ path: "/archived", archived_at: "2026-10-01" }])).toEqual([]);
  });
  it("treats /home as / and never adds home", () => {
    expect(missingPageRows([{ path: "/home", type: "static" }, { path: "/", type: "static" }], [{ path: "/" }])).toEqual([]);
    expect(missingPageRows([{ path: "/home", type: "static" }], [])).toEqual([]);
  });
  it.each(["/", "/manage", "/manage/pages", "/admin", "/admin/users", "/preview/object/x", "*", "/:slug"])("skips excluded %s", (path) => {
    expect(missingPageRows([{ path, type: "static" }], [])).toEqual([]);
  });
  it("keeps landing pages draft and never marks them ready or live", () => {
    const [row] = missingPageRows([{ path: "/landing/summer-sale", type: "landing" }], []);
    expect(row).toMatchObject({ name: "Summer Sale", path: "/landing/summer-sale", page_type: "landing", status: "draft", build_status: "draft", content: null, inline_edits: {} });
  });
  it("deduplicates manifest paths and never deletes unlisted existing pages", () => {
    expect(missingPageRows([{ path: "/new", type: "static" }, { path: "/new/", type: "static" }], [{ path: "/old" }])).toHaveLength(1);
  });
});

describe("buildOnce", () => {
  it("runs once per distinct build, including concurrent triggers", async () => {
    const once = buildOnce();
    const run = vi.fn(async () => {});
    await Promise.all([once("a", run), once("a", run)]);
    await once("a", run);
    expect(run).toHaveBeenCalledTimes(1);
    await once("b", run);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("retries a failed build on the next trigger", async () => {
    const once = buildOnce();
    const run = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    await expect(once("a", run)).rejects.toThrow("offline");
    await once("a", run);
    expect(run).toHaveBeenCalledTimes(2);
  });
});