import { afterEach, describe, expect, it, vi } from "vitest";
import { notePreviewReady, postPreviewNavigate } from "../previewNavigate";

const ORIGIN = "https://draft.example.com";
function frame() {
  const f = document.createElement("iframe");
  f.setAttribute("data-site-preview", "true"); f.setAttribute("data-preview-shown", "true");
  f.src = `${ORIGIN}/about`; document.body.appendChild(f);
  const win = { postMessage: vi.fn() } as unknown as Window;
  Object.defineProperty(f, "contentWindow", { value: win });
  return { f, win };
}
const ready = (win: Window, origin = ORIGIN) => new MessageEvent("message", { origin, source: win as any, data: { source: "nova-site", type: "preview-ready", path: "/about" } });
afterEach(() => { document.body.innerHTML = ""; });

describe("preview in-place navigation", () => {
  it("Back posts preview-navigate to the exact origin without changing src or remounting", () => {
    const { f, win } = frame();
    expect(notePreviewReady(ready(win))).toBe(true);
    expect(postPreviewNavigate({ action: "back" })).toBe(true);
    expect(win.postMessage).toHaveBeenCalledWith({ source: "nova-manager", type: "preview-navigate", action: "back" }, ORIGIN);
    expect(f.src).toBe(`${ORIGIN}/about`);
    expect(document.querySelector("iframe")).toBe(f);
  });
  it("posts page choices with action to", () => {
    const { win } = frame(); notePreviewReady(ready(win));
    expect(postPreviewNavigate({ action: "to", path: "/team" })).toBe(true);
    expect(win.postMessage).toHaveBeenCalledWith({ source: "nova-manager", type: "preview-navigate", action: "to", path: "/team" }, ORIGIN);
  });
  it("falls back (returns false) when the frame has not said it is ready", () => {
    const { win } = frame();
    expect(postPreviewNavigate({ action: "forward" })).toBe(false);
    expect(win.postMessage).not.toHaveBeenCalled();
  });
  it("never trusts or posts for a wrong origin", () => {
    const { win } = frame();
    expect(notePreviewReady(ready(win, "https://evil.example.com"))).toBe(false);
    expect(postPreviewNavigate({ action: "back" })).toBe(false);
    expect(win.postMessage).not.toHaveBeenCalled();
  });
});
