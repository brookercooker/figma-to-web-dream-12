import { describe, expect, it, vi } from "vitest";
import { acceptFrameScroll, rememberScroll, restoreFrameScroll, scrollPath } from "../frameScroll";
describe("frame scroll continuity", () => {
  it("stores only finite positive positions for internal page paths", () => {
    expect(rememberScroll("/contact", 750)).toBe(true);
    expect(rememberScroll("/contact", -1)).toBe(false);
    expect(rememberScroll("/contact", Infinity)).toBe(false);
    for (const path of ["//evil", "/manage/pages", "/a/../b", "https://evil", "/a?b"]) expect(scrollPath(path)).toBeNull();
    expect(scrollPath("/home")).toBe("/");
  });
  it("requires exact origin, window and matching path and restores only that path", () => {
    const frame = document.createElement("iframe"); frame.src = "https://public.example/contact"; document.body.appendChild(frame);
    const win = frame.contentWindow; if (!win) throw new Error("missing frame");
    const post = vi.spyOn(win, "postMessage");
    const event = (origin: string, source: MessageEventSource | null, path: string) => new MessageEvent("message", { origin, source, data: { source: "nova-site", type: "page-scroll", path, y: 925 } });
    expect(acceptFrameScroll(event("https://wrong.example", win, "/contact"), frame, "/contact")).toBe(false);
    expect(acceptFrameScroll(event("https://public.example", window, "/contact"), frame, "/contact")).toBe(false);
    expect(acceptFrameScroll(event("https://public.example", win, "/about"), frame, "/contact")).toBe(false);
    expect(acceptFrameScroll(event("https://public.example", win, "/contact"), frame, "/contact")).toBe(true);
    expect(restoreFrameScroll(frame, "/contact")).toBe(true);
    expect(post).toHaveBeenCalledWith({ source: "nova-manager", type: "restore-scroll", path: "/contact", y: 925 }, "https://public.example");
    expect(restoreFrameScroll(frame, "/no-position")).toBe(false); frame.remove();
  });
});