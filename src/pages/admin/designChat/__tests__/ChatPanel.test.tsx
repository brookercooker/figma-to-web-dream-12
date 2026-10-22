import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatPanel from "../ChatPanel";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  refresh: vi.fn(),
  stopVoice: vi.fn(),
}));
vi.mock("../DesignChatContext", () => ({ useDesignChat: () => ({
  state: { busy: false, history: [] }, offline: false, refreshSoon: mocks.refresh,
  workingPage: null, clearWorkingPage: vi.fn(), editing: false,
  drawing: { strokes: [], on: false, available: false, cancel: vi.fn(), toggle: vi.fn() },
  preview: { loaded: false }, startEditing: vi.fn(), stopEditing: vi.fn(), selectPage: vi.fn(),
}) }));
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