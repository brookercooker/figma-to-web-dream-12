import { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PreviewPanel from "../PreviewPanel";
import PreviewTools from "../PreviewTools";
import type { DesignChat } from "../DesignChatContext";

const context = vi.hoisted(() => ({ chat: null as unknown }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => context.chat }));
vi.mock("../DrawLayer", () => ({ default: () => <div>Drawing</div> }));
afterEach(cleanup);

function setup(overrides: Partial<DesignChat> = {}) {
  const chat = {
    device: "desktop", inFull: false, coverFull: false, toggleFull: vi.fn(),
    boxRef: createRef(),
    drawing: { capturing: false, on: false, areaRef: createRef(), setAvailable: vi.fn() },
    preview: { frames: [], loaded: true }, editing: false,
    previewNav: { back: vi.fn(), forward: vi.fn(), canBack: true, canForward: true },
    ...overrides,
  } as unknown as DesignChat;
  context.chat = chat;
  const view = () => <MemoryRouter initialEntries={["/manage/preview"]}><PreviewPanel /></MemoryRouter>;
  return { chat, view, ...render(view()) };
}

describe("floating preview navigation", () => {
  it("keeps the preview mounted across manual mode and restores the last matching position", () => {
    const { chat, view, rerender, container } = setup({ preview: { frames: [{ id: 1, url: "https://public.example/scroll-check" }], shownId: 1, loaded: true, finish: vi.fn() } as any });
    const frame = container.querySelector("iframe"); const win = frame?.contentWindow;
    if (!frame || !win) throw new Error("Missing preview");
    const post = vi.spyOn(win, "postMessage");
    const receive = (type: string, y?: number) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example", source: win, data: { source: "nova-site", type, path: "/scroll-check", y } })));
    receive("preview-ready"); receive("page-scroll", 800);
    chat.editing = true; rerender(view());
    expect(container.querySelector("iframe")).toBe(frame);
    receive("page-scroll", 0);
    chat.editing = false; rerender(view());
    expect(container.querySelector("iframe")).toBe(frame);
    expect(post).toHaveBeenCalledWith({ source: "nova-manager", type: "restore-scroll", path: "/scroll-check", y: 800 }, "https://public.example");
  });
  it("never draws Back/Forward over the site", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Forward" })).toBeNull();
  });
  it("puts Back/Forward in the toolbar with the existing callbacks and disabled states", () => {
    const { chat } = setup();
    cleanup();
    const view = () => <PreviewTools showViewControls navOnly />;
    const { rerender } = render(view());
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(chat.previewNav?.back).toHaveBeenCalledTimes(1);
    expect(chat.previewNav?.forward).toHaveBeenCalledTimes(1);
    if (chat.previewNav) { chat.previewNav.canBack = false; chat.previewNav.canForward = false; }
    rerender(view());
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });
  it("hides toolbar navigation while editing by hand", () => {
    setup({ editing: true }); cleanup();
    render(<PreviewTools showViewControls navOnly />);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
});
