import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkingPageChip from "../WorkingPageChip";

const m = vi.hoisted(() => ({ ctx: {} as any, clear: vi.fn() }));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({ clearWorkingPage: m.clear, ...m.ctx }) }));
beforeEach(() => { m.clear.mockClear(); m.ctx = { mode: "chat", workingPage: null, previewPage: null, previewLocation: null }; });
afterEach(cleanup);

const chip = () => screen.getByLabelText("Page the chat is working on");

describe("WorkingPageChip", () => {
  it("shows a picked working page, which can be cleared", () => {
    m.ctx.workingPage = { id: "a", name: "About", path: "/about" };
    render(<WorkingPageChip />);
    expect(chip()).toHaveTextContent("Working on About/about");
    fireEvent.click(screen.getByRole("button", { name: "Stop Working on This Page" }));
    expect(m.clear).toHaveBeenCalledOnce();
  });
  it("falls back to the page open in the preview when none is picked", () => {
    m.ctx.previewLocation = { path: "/contact", search: "" };
    m.ctx.previewPage = { id: "c", name: "Contact", path: "/contact" };
    render(<WorkingPageChip />);
    expect(chip()).toHaveTextContent("Viewing Contact/contact");
    expect(screen.queryByRole("button", { name: "Stop Working on This Page" })).toBeNull();
  });
  it("names an unregistered preview page by its address", () => {
    m.ctx.previewLocation = { path: "/new-thing", search: "" };
    render(<WorkingPageChip />);
    expect(chip()).toHaveTextContent("Viewing /new-thing");
  });
  it("says Editing in Manual Edit Mode and can't be cleared there", () => {
    m.ctx.mode = "manual";
    m.ctx.workingPage = { id: "h", name: "Homepage", path: "/" };
    render(<WorkingPageChip />);
    expect(chip()).toHaveTextContent("Editing Homepage/");
    expect(screen.queryByRole("button", { name: "Stop Working on This Page" })).toBeNull();
  });
  it("renders nothing when there's no page at all", () => {
    m.ctx.previewLocation = { path: "/gone", search: "", notFound: true };
    const { container } = render(<WorkingPageChip />);
    expect(container).toBeEmptyDOMElement();
  });
});
