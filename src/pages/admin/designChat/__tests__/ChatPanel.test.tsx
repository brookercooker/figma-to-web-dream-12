import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatPanel from "../ChatPanel";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  refresh: vi.fn(),
  stopVoice: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  start: vi.fn(),
  sync: vi.fn(),
  candidate: null as null | { name: string; path: string },
  location: null as null | string,
  page: null as null | { id: string; name: string; path: string },
  editing: false,
}));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({
  state: { busy: false, history: [] }, offline: false, refreshSoon: mocks.refresh,
  workingPage: null, clearWorkingPage: vi.fn(), editing: mocks.editing,
  drawing: { strokes: [], on: false, available: false, cancel: vi.fn(), toggle: vi.fn() },
  preview: { loaded: false }, startEditing: mocks.start, stopEditing: vi.fn(), selectPage: mocks.select,
  previewLocation: mocks.location ? { path: mocks.location, search: "" } : mocks.candidate ? { path: mocks.candidate.path, search: "" } : null,
  previewPage: mocks.page,
  previewRegistrable: mocks.candidate,
}) }));
vi.mock("../contentSync", () => ({ notifyContentEdited: mocks.sync }));
vi.mock("@/prototype/client", () => ({ supabase: {
  from: () => ({ insert: mocks.insert }),
} }));
vi.mock("../EditorSlot", () => ({ useEditorSlot: () => ({ saveAll: vi.fn() }) }));
vi.mock("../helper", () => ({
  DEFAULT_UPLOADS: { accept: ".png", maxFiles: 5, maxBytes: 1024 },
  postToHelper: mocks.post,
}));
vi.mock("../useAttachments", () => ({ useAttachments: () => ({
  files: [], uploading: false, ids: () => [], clear: vi.fn(),
}) }));
vi.mock("../useVoice", () => ({ useVoice: () => ({ supported: false, stop: mocks.stopVoice }) }));
vi.mock("../ApprovalCard", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.post.mockResolvedValue({ ok: true, data: {} });
  mocks.candidate = null;
  mocks.location = null;
  mocks.page = null;
  mocks.editing = false;
  mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: "registered", name: "Race Test Page", path: "/race-test-page" }, error: null }) }) });
});

describe("manual editing registration", () => {
  it("keeps the editing button in the header outside the form, including while editing", () => {
    const view = render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Edit this page by hand (without the chat)" });
    const section = screen.getByRole("region", { name: "Design chat" });
    const header = section.querySelector("header");
    expect(header).toContainElement(button);
    expect(section.firstElementChild).toBe(header);
    expect(button.closest("form")).toBeNull();
    expect(button).toHaveTextContent("Edit manually");

    mocks.editing = true;
    view.rerender(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const done = screen.getByRole("button", { name: "Edit this page by hand (without the chat)" });
    expect(header).toBeVisible();
    expect(header).toContainElement(done);
    expect(done).toBeVisible();
    expect(done).toHaveTextContent("Done editing");
    expect(done).toHaveAttribute("aria-pressed", "true");
    expect(done.closest("form")).toBeNull();
    expect(section.querySelector("form")?.lastElementChild).toContainElement(screen.getByRole("button", { name: /^Send$/ }));
  });
  it("enables a registrable page, creates exactly one ready draft row, and opens it", async () => {
    mocks.candidate = { name: "Race Test Page", path: "/race-test-page" };
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Edit this page by hand (without the chat)" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(1));
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledWith({
      name: "Race Test Page", path: "/race-test-page", page_type: "static", status: "draft", build_status: "ready",
      content: null, inline_edits: {}, slug_id: expect.stringMatching(/^race-test-page-[a-f0-9]{6}$/),
    });
    expect(mocks.select).toHaveBeenCalledWith({ id: "registered", name: "Race Test Page", path: "/race-test-page" });
    expect(mocks.sync).toHaveBeenCalledTimes(1);
  });
});
afterEach(cleanup);

function messageBox() {
  render(<MemoryRouter><ChatPanel /></MemoryRouter>);
  const input = screen.getByRole("textbox", { name: "Describe a change" });
  fireEvent.change(input, { target: { value: "Make the headline larger" } });
  return input;
}

describe("chat sending shortcuts", () => {
  it("leaves Shift+Enter to the browser without sending", () => {
    const input = messageBox();
    expect(fireEvent.keyDown(input, { key: "Enter", shiftKey: true })).toBe(true);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.stopVoice).not.toHaveBeenCalled();
  });

  it("sends with Enter", async () => {
    const input = messageBox();
    expect(fireEvent.keyDown(input, { key: "Enter" })).toBe(false);
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/send", {
      message: "Make the headline larger", uploadIds: [],
    }));
    expect(mocks.post).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("does not send during IME composition", () => {
    const input = messageBox();
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("still sends with the Send button", async () => {
    messageBox();
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1));
  });
});

describe("Edit manually on the front page", () => {
  const button = () => screen.getByRole("button", { name: "Edit this page by hand (without the chat)" });
  it("is enabled for /home when the home row is stored at /, and opens that row", async () => {
    mocks.location = "/home";
    mocks.page = { id: "home", name: "Homepage", path: "/" };
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(button()).toBeEnabled();
    fireEvent.click(button());
    await waitFor(() => expect(mocks.select).toHaveBeenCalledWith({ id: "home", name: "Homepage", path: "/" }));
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("stays disabled with its hint for an unknown address", () => {
    mocks.location = "/manage/somewhere";
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    expect(button()).toBeDisabled();
    expect(button()).toHaveAttribute("title", "This address isn't a page that can be edited.");
  });
  it("leaves /about unchanged", async () => {
    mocks.location = "/about";
    mocks.page = { id: "about", name: "About", path: "/about" };
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.click(button());
    await waitFor(() => expect(mocks.select).toHaveBeenCalledWith({ id: "about", name: "About", path: "/about" }));
  });
});
