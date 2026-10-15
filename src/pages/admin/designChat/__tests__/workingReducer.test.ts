import { describe, expect, it } from "vitest";
import { workingReducer, type WorkingState } from "../DesignChatContext";

const empty: WorkingState = { workingPage: null, editing: false };
const a = { id: "a", name: "A", path: "/a" };
const b = { id: "b", name: "B", path: "/b" };

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
