import { describe, expect, it } from "vitest";
import { helperPollingInterval, workingReducer, type WorkingState } from "../DesignChatContext";
import type { RelayState } from "../helper";

const empty: WorkingState = { workingPage: null, editing: false };
const a = { id: "a", name: "A", path: "/a" };
const b = { id: "b", name: "B", path: "/b" };

describe("helper polling interval", () => {
  const idle: RelayState = { busy: false, job: null, previewVersion: 0, history: [] };

  it("polls every 1000 ms while checking the preview", () => {
    expect(helperPollingInterval({ ...idle, previewChecking: true }, false)).toBe(1000);
  });
  it.each([false, undefined])("polls every 4000 ms when previewChecking is %s and otherwise idle", (previewChecking) => {
    const state = previewChecking === undefined ? idle : { ...idle, previewChecking };
    expect(helperPollingInterval(state, false)).toBe(4000);
  });
  it("keeps busy polling at 1000 ms", () => {
    expect(helperPollingInterval({ ...idle, busy: true }, false)).toBe(1000);
  });
  it("keeps review polling at 1000 ms", () => {
    expect(helperPollingInterval({ ...idle, publish: { open: 0, status: "reviewing" } }, false)).toBe(1000);
  });
  it("keeps recent-reload polling at 1000 ms", () => {
    expect(helperPollingInterval(idle, true)).toBe(1000);
  });
  it("keeps polling at 4000 ms before state is available", () => {
    expect(helperPollingInterval(null, true)).toBe(4000);
  });
});

describe("edit page rules", () => {
  it("startEditing needs a working page with an id", () => {
    expect(workingReducer(empty, { type: "start" }).editing).toBe(false);
    const noId = workingReducer(empty, { type: "select", page: { name: "X", path: "/x" } });
    expect(workingReducer(noId, { type: "start" }).editing).toBe(false);
    const withId = workingReducer(empty, { type: "select", page: a });
    expect(workingReducer(withId, { type: "start" }).editing).toBe(true);
  });
  it("clearWorkingPage ends editing", () => {
    const s = workingReducer(workingReducer(empty, { type: "select", page: a }), { type: "start" });
    expect(workingReducer(s, { type: "clear" })).toEqual(empty);
  });
  it("selecting a different page keeps editing on", () => {
    const s = workingReducer(workingReducer(empty, { type: "select", page: a }), { type: "start" });
    const next = workingReducer(s, { type: "select", page: b });
    expect(next.editing).toBe(true);
    expect(next.workingPage?.id).toBe("b");
  });
  it("selecting without editing does not start it", () => {
    expect(workingReducer(empty, { type: "select", page: a }).editing).toBe(false);
  });
});
