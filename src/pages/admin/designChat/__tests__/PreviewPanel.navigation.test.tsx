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
  it("keeps the existing history callbacks and disabled states", () => {
    const { chat, view, rerender } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    expect(chat.previewNav?.back).toHaveBeenCalledTimes(1);
    expect(chat.previewNav?.forward).toHaveBeenCalledTimes(1);
    if (chat.previewNav) { chat.previewNav.canBack = false; chat.previewNav.canForward = false; }
    rerender(view());
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDisabled();
  });

  for (const device of ["mobile", "tablet", "desktop"] as const) {
    for (const coverFull of [false, true]) {
      it(`anchors inside the ${device} frame in ${coverFull ? "fallback" : "native"} full screen without intercepting the page`, () => {
        const { chat } = setup({ device, inFull: true, coverFull });
        const back = screen.getByRole("button", { name: "Back" });
        expect(back.parentElement?.parentElement).toBe(chat.drawing.areaRef.current);
        expect(back.parentElement).toHaveClass("pointer-events-none", "absolute", "left-2", "top-2");
        expect(back).toHaveClass("pointer-events-auto");
        expect(screen.getByRole("button", { name: "Forward" })).toHaveClass("pointer-events-auto");
      });
    }
  }

  it("hides navigation during drawing, capture and manual editing", () => {
    const { chat, view, rerender } = setup();
    chat.drawing.on = true;
    rerender(view());
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    chat.drawing.on = false;
    chat.drawing.capturing = true;
    rerender(view());
    expect(screen.queryByRole("button", { name: "Forward" })).toBeNull();
    chat.drawing.capturing = false;
    chat.editing = true;
    rerender(view());
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    chat.editing = false;
    rerender(view());
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  for (const tight of [false, true]) {
    it(`removes navigation from the ${tight ? "compact" : "normal"} top bar`, () => {
      setup();
      cleanup();
      render(<PreviewTools showViewControls tight={tight} />);
      expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Forward" })).toBeNull();
      expect(screen.getByRole("button", { name: "Full Screen" })).toBeInTheDocument();
    });
  }
});