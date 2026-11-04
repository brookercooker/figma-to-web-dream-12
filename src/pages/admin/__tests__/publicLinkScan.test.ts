import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseLinkReport, scanPublicPage, scanPublicPages } from "../publicLinkScan";

const BASE = "https://public.example.com/?__lovable_token=abc";
const ORIGIN = "https://public.example.com";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); document.querySelectorAll("iframe").forEach((f) => f.remove()); });

describe("link report messages", () => {
  const valid = { source: "nova-site", type: "link-report", id: "a", path: "/about", status: "ok", links: [{ href: "/team", url: `${ORIGIN}/team`, text: "Team", area: "page" }] };
  it("accepts a well-formed report for this request", () => {
    expect(parseLinkReport(valid, "a")).toEqual({ status: "ok", finalPath: "/about", links: valid.links });
  });
  it.each([
    ["another request's id", { ...valid, id: "b" }],
    ["the wrong source", { ...valid, source: "someone" }],
    ["an unknown status", { ...valid, status: "great" }],
    ["no links list", { ...valid, links: "nope" }],
    ["a relative path", { ...valid, path: "about" }],
  ])("rejects %s", (_name, data) => {
    expect(parseLinkReport(data, "a")).toBeNull();
  });
  it("drops malformed links but keeps good ones", () => {
    const report = parseLinkReport({ ...valid, links: [valid.links[0], { href: 1 }, { href: "/x", text: "X", area: "sidebar" }] }, "a");
    expect(report?.links).toHaveLength(1);
  });
});

describe("scanning one public page", () => {
  beforeEach(() => vi.useFakeTimers());

  function frameFor(path: string) {
    const frame = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe[data-link-scan]")).find((f) => new URL(f.src).pathname === path);
    if (!frame) throw new Error(`no frame for ${path}`);
    return frame;
  }
  const reply = (frame: HTMLIFrameElement, data: unknown, origin = ORIGIN, source: MessageEventSource | null = frame.contentWindow) =>
    window.dispatchEvent(new MessageEvent("message", { data, origin, source }));

  it("loads the public address with the preview credentials, asks for the report, and removes the frame", async () => {
    const result = scanPublicPage(BASE, "/about", 5000);
    const frame = frameFor("/about");
    expect(frame.src).toBe(`${ORIGIN}/about?__lovable_token=abc`);
    const post = vi.spyOn(frame.contentWindow!, "postMessage").mockImplementation(() => {});
    reply(frame, { source: "nova-site", type: "location", path: "/about" });
    const request = post.mock.calls[0];
    expect(request[0]).toMatchObject({ source: "nova-manager", type: "link-report-request" });
    expect(request[1]).toBe(ORIGIN);
    const id = (request[0] as any).id;
    reply(frame, { source: "nova-site", type: "link-report", id, path: "/about", status: "ok", links: [] });
    await expect(result).resolves.toEqual({ path: "/about", status: "ok", finalPath: "/about", links: [] });
    expect(document.querySelector("iframe[data-link-scan]")).toBeNull();
  });

  it("ignores reports from other windows or origins", async () => {
    const result = scanPublicPage(BASE, "/team", 3000);
    const frame = frameFor("/team");
    const post = vi.spyOn(frame.contentWindow!, "postMessage").mockImplementation(() => {});
    await vi.advanceTimersByTimeAsync(2000); // periodic request
    const id = (post.mock.calls[0][0] as any).id;
    const report = { source: "nova-site", type: "link-report", id, path: "/team", status: "ok", links: [] };
    reply(frame, report, "https://evil.example");
    reply(frame, report, ORIGIN, window);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ path: "/team", status: "unreachable" });
  });

  it("counts a page that never answers as unreachable, not as a page with no links", async () => {
    const result = scanPublicPage(BASE, "/slow", 4000);
    await vi.advanceTimersByTimeAsync(4000);
    await expect(result).resolves.toEqual({ path: "/slow", status: "unreachable" });
    expect(document.querySelector("iframe[data-link-scan]")).toBeNull();
  });

  it("refuses addresses that aren't a separate https site", async () => {
    await expect(scanPublicPage(`${window.location.origin}/`, "/about", 1000)).resolves.toEqual({ path: "/about", status: "unreachable" });
  });

  it("scans several pages a few at a time and reports progress", async () => {
    const progress = vi.fn();
    const all = scanPublicPages(BASE, ["/a", "/b", "/c", "/d"], progress, 2, 1000);
    expect(document.querySelectorAll("iframe[data-link-scan]")).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(2000);
    const results = await all;
    expect(results.map((r) => r.path)).toEqual(["/a", "/b", "/c", "/d"]);
    expect(progress).toHaveBeenLastCalledWith(4, 4);
  });
});
