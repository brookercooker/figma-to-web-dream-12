import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ manual: false, busy: false, mounts: 0 }));
vi.mock("../designChat/DesignChatContext", () => ({ DesignChatProvider: ({ children }: any) => children,
  useDesignChat: () => ({ mode: m.manual ? "manual" : "chat", editing: m.manual, workingPage: { id: "home", name: "Homepage", path: "/" },
    state: { busy: m.busy, publish: { open: 0 } }, stopEditing: vi.fn(), clearWorkingPage: vi.fn(), objectOpen: null, closeObject: vi.fn(), refs: { addReference: vi.fn() } }) }));
vi.mock("../designChat/ChatPanel", async () => {
  const { useEffect, useState } = await import("react");
  return { default: () => { const [text, setText] = useState(""); useEffect(() => { m.mounts++; }, []); return <section aria-label="Design Chat"><input aria-label="Held Chat Text" value={text} onChange={(e) => setText(e.target.value)} /></section>; } };
});
vi.mock("../designChat/LibraryPicker", () => ({ default: () => null }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }));
vi.mock("../DesignChatTab", () => ({ default: () => <div data-testid="preview">Preview</div> }));
vi.mock("../DesignTab", () => ({ default: () => <div data-testid="canvas">Unchanged Canvas</div> }));
import AdminIndex from "../AdminIndex";
beforeEach(() => { m.manual = false; m.busy = false; m.mounts = 0; localStorage.clear(); (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} }; });
afterEach(cleanup);
const app = () => <MemoryRouter initialEntries={["/manage/preview"]}><AdminIndex /></MemoryRouter>;
describe("Site Manager mode cues", () => {
  it("shows manual-only cues without wrapping the canvas and keeps chat mounted", async () => {
    const view = render(app());
    const input = screen.getByLabelText("Held Chat Text"); fireEvent.change(input, { target: { value: "Keep this request" } });
    expect(screen.getByRole("radio", { name: "Chat Mode" })).toHaveAttribute("aria-checked", "true");
    expect(document.querySelector("[data-manual-outline]")).toBeNull();
    m.manual = true; view.rerender(app());
    const canvas = await screen.findByTestId("canvas");
    expect(canvas.parentElement?.parentElement?.tagName).toBe("MAIN");
    const overlay = document.querySelector<HTMLDivElement>("[data-manual-outline]");
    const main = canvas.closest("main");
    expect(main).not.toContainElement(overlay);
    expect(overlay?.parentElement).toBe(main?.parentElement);
    expect(overlay).toHaveClass("pointer-events-none", "absolute");
    expect(overlay).not.toContainElement(canvas);
    expect(screen.getByText("Editing By Hand.")).toBeVisible();
    expect(screen.getByText("Want Claude To Do This?")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Ask Claude Instead" })).toHaveLength(2);
    expect(screen.queryByText("Chat Mode: Claude Makes the Changes")).toBeNull();
    expect(input).not.toBeVisible(); expect(input).toHaveValue("Keep this request"); expect(m.mounts).toBe(1);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent("Manual Edit Mode. You are editing by hand.");
    expect(screen.getByRole("region", { name: "Page Editing Options" })).toBeVisible();
    m.manual = false; view.rerender(app());
    expect(input).toBeVisible(); expect(input).toHaveValue("Keep this request"); expect(m.mounts).toBe(1);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent("Chat Mode. Claude makes the changes.");
    expect(document.querySelector("[data-manual-chat-bar]")).toBeNull();
    expect(document.querySelector("[data-manual-outline]")).toBeNull();
  });
  it("plainly shows an ongoing Claude change in Manual Mode", async () => {
    m.manual = true; m.busy = true; render(app());
    expect(screen.getByText("Claude Is Still Working on a Change")).toBeVisible();
    await waitFor(() => expect(screen.getByTestId("canvas")).toBeVisible());
  });
});