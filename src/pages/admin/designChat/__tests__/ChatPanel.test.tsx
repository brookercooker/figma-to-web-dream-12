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
  guard: vi.fn(),
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
vi.mock("../ModeSwitchContext", () => ({ useModeSwitch: () => ({ requestChat: mocks.guard, requestManual: async (open: () => void) => open() }) }));
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
  mocks.guard.mockResolvedValue(false);
  mocks.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: "registered", name: "Race Test Page", path: "/race-test-page" }, error: null }) }) });
});

afterEach(cleanup);

function messageBox() {
  render(<MemoryRouter><ChatPanel /></MemoryRouter>);
  const input = screen.getByRole("textbox", { name: "Describe a Change" });
  fireEvent.change(input, { target: { value: "Make the headline larger" } });
  return input;
}

describe("chat sending shortcuts", () => {
  it("uses the shared switch guard before sending from Manual Mode", async () => {
    mocks.editing = true;
    const input = messageBox();
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(mocks.guard).toHaveBeenCalledTimes(1));
    expect(mocks.post).not.toHaveBeenCalled();
    expect(input).toHaveValue("Make the headline larger");
    mocks.guard.mockResolvedValue(true);
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(1));
  });
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

describe("library items in the chat", () => {
  const image = { kind: "image" as const, id: "img1", name: 'Hero "lamp"', url: "https://cdn.example/hero.webp", labels: ["Lobby"] };
  const box = () => screen.getByRole("textbox", { name: "Describe a Change" });
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
