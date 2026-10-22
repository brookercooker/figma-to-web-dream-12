import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import EmbeddedBox from "../EmbeddedBox";
import PreviewPanel from "../PreviewPanel";
import type { DesignChat } from "../DesignChatContext";

const context = vi.hoisted(() => ({ chat: null as unknown }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => context.chat }));
afterEach(cleanup);

describe("full-screen exit", () => {
  for (const coverFull of [false, true]) {
    for (const editor of [false, true]) {
      it(`exits ${coverFull ? "fallback" : "native"} full screen from the ${editor ? "editor" : "preview"}`, () => {
        const toggleFull = vi.fn();
        const chat = {
          device: "desktop", inFull: true, coverFull, toggleFull,
          boxRef: createRef(), editBoxRef: createRef(),
          drawing: { capturing: false, on: false, areaRef: createRef(), setAvailable: vi.fn() },
          preview: { frames: [], loaded: true }, editing: editor,
        } as unknown as DesignChat;
        context.chat = chat;
        const view = () => editor ? <EmbeddedBox chat={chat}>Content</EmbeddedBox> : <MemoryRouter><PreviewPanel /></MemoryRouter>;
        const { rerender } = render(view());
        fireEvent.click(screen.getByRole("button", { name: "Exit full screen" }));
        expect(toggleFull).toHaveBeenCalledTimes(1);
        chat.drawing.capturing = true;
        rerender(view());
        expect(screen.queryByRole("button", { name: "Exit full screen" })).toBeNull();
        chat.drawing.capturing = false;
        chat.inFull = false;
        rerender(view());
        expect(screen.queryByRole("button", { name: "Exit full screen" })).toBeNull();
      });
    }
  }
});