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
  refs: { references: [] as any[], addReference: vi.fn(), removeReference: vi.fn(), clearReferences: vi.fn(), focusTick: 0 },
}));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({
  state: { busy: false, history: [] }, offline: false, refreshSoon: mocks.refresh,
  workingPage: null, clearWorkingPage: vi.fn(), editing: mocks.editing,
  drawing: { strokes: [], on: false, available: false, cancel: vi.fn(), toggle: vi.fn() },
  preview: { loaded: false }, startEditing: mocks.start, stopEditing: vi.fn(), selectPage: mocks.select,
  previewLocation: mocks.location ? { path: mocks.location, search: "" } : mocks.candidate ? { path: mocks.candidate.path, search: "" } : null,
  previewPage: mocks.page,
  refs: mocks.refs,
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
  mocks.refs = { references: [], addReference: vi.fn(), removeReference: vi.fn(), clearReferences: vi.fn(), focusTick: 0 };
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

describe("library items in the chat", () => {
  const image = { kind: "image" as const, id: "img1", name: 'Hero "lamp"', url: "https://cdn.example/hero.webp", labels: ["Lobby"] };
  const box = () => screen.getByRole("textbox", { name: "Describe a change" });
  it("shows a removable chip for each item", () => {
    mocks.refs.references = [image];
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: 'Remove Hero "lamp"' }));
    expect(mocks.refs.removeReference).toHaveBeenCalledWith("image:img1");
  });
  it("sends the reference block after the words, without putting it in the box, and clears chips on success", async () => {
    mocks.refs.references = [image];
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.change(box(), { target: { value: "Put this in the About hero" } });
    expect(box()).toHaveValue("Put this in the About hero");
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1));
    const sent = mocks.post.mock.calls[0][1].message as string;
    expect(sent).toBe('Put this in the About hero\n\nReferences from the library:\n- Image "Hero \\"lamp\\"": https://cdn.example/hero.webp, labels: Lobby');
    expect(Object.keys(mocks.post.mock.calls[0][1]).sort()).toEqual(["message", "uploadIds"]);
    await waitFor(() => expect(mocks.refs.clearReferences).toHaveBeenCalled());
  });
  it("keeps chips after a failed send", async () => {
    mocks.refs.references = [image];
    mocks.post.mockResolvedValue({ ok: false, error: "nope" });
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.change(box(), { target: { value: "Use it" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await waitFor(() => expect(mocks.post).toHaveBeenCalled());
    expect(mocks.refs.clearReferences).not.toHaveBeenCalled();
  });
  it("asks for words when only items are attached", () => {
    mocks.refs.references = [image];
    render(<MemoryRouter><ChatPanel /></MemoryRouter>);
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(mocks.post).not.toHaveBeenCalled();
    expect(screen.getByText("Say what you'd like done with the attached item(s).")).toBeInTheDocument();
  });
});
