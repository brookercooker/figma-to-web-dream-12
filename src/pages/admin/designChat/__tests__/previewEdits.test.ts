import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { previewSender, usePreviewEdits, previewContentLoaded } from "../previewEdits";
import { CONTENT_SAVED } from "../contentSync";

vi.mock("@/prototype/client", () => ({ supabase: {} }));

const ORIGIN = "https://draft.example.com";
function setup() {
  const root = document.createElement("section");
  const frame = document.createElement("iframe");
  frame.setAttribute("data-site-preview", "true");
  frame.src = `${ORIGIN}/draft`;
  root.appendChild(frame); document.body.appendChild(root);
  const win = { postMessage: vi.fn() } as unknown as Window;
  Object.defineProperty(frame, "contentWindow", { value: win });
  const ref = createRef<HTMLElement>() as { current: HTMLElement | null };
  ref.current = root;
  return { root, win, ref, frame };
}
const ready = (win: Window, origin = ORIGIN) => new MessageEvent("message", { origin, source: win as any, data: { source: "nova-site", type: "preview-ready", path: "/draft" } });
const payload = { edits: { "0.1.0": "Just tweaking" }, objectEdits: { Header: { "0.0": "Hi" } } };
const content = { pages: [{ path: "/", content: [], inline_edits: {} }], objects: [] };
const loadContent = vi.fn().mockResolvedValue(content);
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });
afterEach(() => { document.body.innerHTML = ""; });

describe("Chat Mode preview edits", () => {
  it("sends saved content for /draft on load without any preview-ready message and resends after save", async () => {
    const { win, ref, frame } = setup();
    const full = { pages: [{ path: "/draft", content: [{ id: "spotlight", type: "object", objectId: "fixture" }], inline_edits: {} }], objects: [{ id: "fixture", name: "Example Fixture Spotlight", component_key: null, content: [], inline_edits: {}, site_wide: false }] };
    renderHook(() => usePreviewEdits(ref as any, vi.fn().mockResolvedValue(payload), vi.fn().mockResolvedValue(full)));
    previewContentLoaded(frame); await flush();
    expect(win.postMessage).toHaveBeenCalledWith({ source: "nova-manager", type: "preview-content", ...full }, ORIGIN);
    window.dispatchEvent(new Event(CONTENT_SAVED)); await flush();
    expect((win.postMessage as any).mock.calls.filter(([m]: any[]) => m.type === "preview-content")).toHaveLength(2);
    frame.remove(); previewContentLoaded(frame); await flush();
    expect((win.postMessage as any).mock.calls.filter(([m]: any[]) => m.type === "preview-content")).toHaveLength(2);
  });
  it("shows load failure, retries and accepts the exact bare preview-ready shape", async () => {
    const { win, ref } = setup(); const load = vi.fn().mockResolvedValue(payload);
    const full = vi.fn().mockRejectedValueOnce(new Error("unavailable")).mockResolvedValue(content);
    const view = renderHook(() => usePreviewEdits(ref as any, load, full));
    window.dispatchEvent(new MessageEvent("message", { origin: ORIGIN, source: win as any, data: { type: "preview-ready" } })); await flush();
    expect(view.result.current).toBe(true);
    window.dispatchEvent(new Event("nova:preview-content-retry")); await flush();
    expect(view.result.current).toBe(false);
    expect(win.postMessage).toHaveBeenCalledWith({ source: "nova-manager", type: "preview-content", ...content }, ORIGIN);
  });
  it("sends the saved edits to the exact origin after preview-ready", async () => {
    const { win, ref } = setup();
    const load = vi.fn().mockResolvedValue(payload);
    renderHook(() => usePreviewEdits(ref as any, load, loadContent));
    window.dispatchEvent(ready(win)); await flush();
    expect(load).toHaveBeenCalledWith("/draft");
    expect(win.postMessage).toHaveBeenCalledWith({ source: "nova-manager", type: "preview-edits", path: "/draft", ...payload }, ORIGIN);
    expect(win.postMessage).toHaveBeenCalledWith({ source: "nova-manager", type: "preview-content", ...content }, ORIGIN);
  });
  it("sends again after Finish Editing (a successful save)", async () => {
    const { win, ref } = setup();
    const load = vi.fn().mockResolvedValue(payload);
    renderHook(() => usePreviewEdits(ref as any, load, loadContent));
    window.dispatchEvent(ready(win)); await flush();
    window.dispatchEvent(new Event(CONTENT_SAVED)); await flush();
    expect(win.postMessage).toHaveBeenCalledTimes(4);
  });
  it("never sends to a wrong origin or before ready", async () => {
    const { win, ref } = setup();
    const load = vi.fn().mockResolvedValue(payload);
    renderHook(() => usePreviewEdits(ref as any, load, loadContent));
    window.dispatchEvent(new Event(CONTENT_SAVED));
    window.dispatchEvent(ready(win, "https://evil.example.com")); await flush();
    expect(load).not.toHaveBeenCalled();
    expect(win.postMessage).not.toHaveBeenCalled();
  });
  it("ignores messages from windows that are not a preview frame", () => {
    const { root } = setup();
    expect(previewSender(ready({ postMessage: vi.fn() } as any), root)).toBeNull();
  });
});
