import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ manual: false, busy: false, mounts: 0, reviewOpen: false }));
vi.mock("../designChat/DesignChatContext", () => ({ DesignChatProvider: ({ children }: any) => children,
  useDesignChat: () => ({ mode: m.manual ? "manual" : "chat", editing: m.manual, workingPage: { id: "home", name: "Homepage", path: "/" },
    state: { busy: m.busy, publish: { open: 0 } }, stopEditing: vi.fn(), clearWorkingPage: vi.fn(), objectOpen: null, closeObject: vi.fn(), refs: { addReference: vi.fn() }, reviewOpen: m.reviewOpen, setReviewOpen: vi.fn(), showPreviewPath: vi.fn() }) }));
vi.mock("../designChat/ChatPanel", async () => {
  const { useEffect, useState } = await import("react");
  return { default: () => { const [text, setText] = useState(""); useEffect(() => { m.mounts++; }, []); return <section aria-label="Design Chat"><input aria-label="Held Chat Text" value={text} onChange={(e) => setText(e.target.value)} /></section>; } };
});
vi.mock("../designChat/LibraryPicker", () => ({ default: () => null }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }));
vi.mock("../DesignChatTab", () => ({ default: () => <div data-testid="preview">Preview</div> }));
vi.mock("../DesignTab", () => ({ default: () => <div data-testid="canvas">Unchanged Canvas</div> }));
import AdminIndex from "../AdminIndex";
beforeEach(() => { m.manual = false; m.busy = false; m.mounts = 0; m.reviewOpen = false; localStorage.clear(); (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} }; });
afterEach(cleanup);
const app = () => <MemoryRouter initialEntries={["/manage/preview"]}><AdminIndex /></MemoryRouter>;
describe("Site Manager mode cues", () => {
  it("swaps the chat for the review view without unmounting it", () => {
    const view = render(app());
    fireEvent.change(screen.getByLabelText("Held Chat Text"), { target: { value: "Draft text" } });
    m.reviewOpen = true; view.rerender(app());
    expect(screen.getByRole("region", { name: "Changes Waiting for Review" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Chat Mode" })).toBeNull();
    expect(screen.getByLabelText("Held Chat Text", { selector: "input" }).closest("[hidden]")).not.toBeNull();
    m.reviewOpen = false; view.rerender(app());
    expect(screen.getByLabelText("Held Chat Text")).toHaveValue("Draft text");
    expect(m.mounts).toBe(1);
  });
  it("shows manual-only cues without wrapping the canvas and keeps chat mounted", async () => {
    const view = render(app());
    const input = screen.getByLabelText("Held Chat Text"); fireEvent.change(input, { target: { value: "Keep this request" } });
    expect(screen.getByRole("radio", { name: "Chat Mode" })).toHaveAttribute("aria-checked", "true");
    expect(document.querySelector("[data-mode-switch]")?.previousElementSibling).toContainElement(screen.getByRole("button", { name: "Account Menu" }));
    expect(document.querySelector("[data-manual-outline]")).toBeNull();
    const submit = screen.getByRole("button", { name: "Submit for Review" });
    expect(document.querySelector("header")).toContainElement(submit);
    expect(screen.getAllByRole("button", { name: "Submit for Review" })).toHaveLength(1);
    m.manual = true; view.rerender(app());
    const canvas = await screen.findByTestId("canvas");
    expect(canvas.parentElement?.parentElement?.tagName).toBe("MAIN");
    const overlay = document.querySelector<HTMLDivElement>("[data-manual-outline]");
    const main = canvas.closest("main");
    expect(main).not.toContainElement(overlay);
    expect(overlay?.parentElement).toBe(main?.parentElement);
    expect(overlay).toHaveClass("pointer-events-none", "absolute");
    expect(overlay).not.toContainElement(canvas);
    expect(screen.getByText("Editing Homepage")).toBeVisible();
    expect(document.querySelector("[data-chat-header]")).toContainElement(screen.getByRole("button", { name: "Undo" }));
    expect(document.querySelector("[data-chat-header]")).toContainElement(screen.getByRole("button", { name: "Redo" }));
    expect(screen.queryByRole("button", { name: "Submit for Review" })).toBeNull();
    expect(screen.getByRole("radio", { name: "Manual Edit Mode" })).toHaveAttribute("aria-checked", "true");
    expect(document.querySelector("[data-manual-chat-bar]")).toBeNull();
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
  it.each([false, true])("removes redundant visible prompts in manual=%s", (manual) => {
    m.manual = manual; const { container } = render(app());
    expect(container.innerHTML).not.toMatch(/Ask Claude Instead|Want Claude To Do This\?|Editing By Hand/);
    expect(container.querySelector('[title*="Ask Claude Instead"], [aria-label*="Ask Claude Instead"]')).toBeNull();
  });
  it("shows the ongoing Claude notice in the tools only while busy in Manual Mode", async () => {
    m.manual = true; m.busy = true; const view = render(app());
    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("Claude Is Still Working on a Change");
    expect(notice).toBeVisible();
    expect(notice.querySelector("svg")).toHaveClass("animate-spin");
    expect(screen.getByRole("complementary", { name: "Manual Mode" })).toContainElement(notice);
    expect(document.querySelector("main")).not.toContainElement(notice);
    await waitFor(() => expect(screen.getByTestId("canvas")).toBeVisible());
    m.busy = false; view.rerender(app());
    expect(screen.queryByText("Claude Is Still Working on a Change")).toBeNull();
    m.busy = true; m.manual = false; view.rerender(app());
    expect(screen.queryByText("Claude Is Still Working on a Change")).toBeNull();
  });
  it.each([false, true])("gives the top bar and the chat header one shared fixed height (manual: %s)", (manual) => {
    m.manual = manual; render(app());
    for (const el of [document.querySelector("[data-top-bar]"), document.querySelector("[data-chat-header]")]) {
      expect(el?.className).toContain("h-14");
      expect(el?.className).toContain("border-b");
      expect(el?.className).not.toMatch(/\bpy-/);
    }
  });
});
