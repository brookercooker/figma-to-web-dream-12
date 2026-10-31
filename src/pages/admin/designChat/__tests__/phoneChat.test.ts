import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePhoneChat } from "../phoneChat";
import type { RelayState } from "../helper";

const idle: RelayState = { busy: false, job: null, history: [], previewVersion: 1 };
describe("phone-only chat presentation", () => {
  it("does not auto-open at tablet widths or during manual editing", () => {
    const state = { ...idle, history: [{ role: "error" as const, text: "Try again", ts: 1 }] };
    const { result, rerender } = renderHook(({ phone, manual }) => usePhoneChat(phone, manual, state), { initialProps: { phone: false, manual: false } });
    expect(result.current.open).toBe(false);
    rerender({ phone: true, manual: true }); expect(result.current.open).toBe(false);
  });
  it("marks unseen replies and live notes, clearing the dot on opening", () => {
    const { result, rerender } = renderHook(({ state }) => usePhoneChat(true, false, state), { initialProps: { state: idle } });
    rerender({ state: { ...idle, history: [{ role: "assistant", text: "Updated", ts: 2 }] } });
    expect(result.current.open).toBe(false); expect(result.current.unread).toBe(true);
    act(() => result.current.show()); expect(result.current.unread).toBe(false);
    act(() => result.current.close());
    rerender({ state: { ...idle, history: [{ role: "note", text: "The draft is published", ts: 3 }] } });
    expect(result.current.unread).toBe(true);
  });
  it("opens a newly arrived approval without changing its data", () => {
    const { result, rerender } = renderHook(({ state }) => usePhoneChat(true, false, state), { initialProps: { state: idle } });
    const approval = { id: "plan-1", title: "Confirm", detail: "Plan", kind: "plan" as const, rule: "ok" as const, editorUrl: null, fields: null, createdAt: 1, deciding: false };
    rerender({ state: { ...idle, approval } });
    expect(result.current.open).toBe(true); expect(approval.deciding).toBe(false);
    act(() => result.current.close()); rerender({ state: { ...idle, approval } });
    expect(result.current.open).toBe(false);
  });
  it("opens a new error and tracks builder work", () => {
    const { result, rerender } = renderHook(({ state }) => usePhoneChat(true, false, state), { initialProps: { state: idle } });
    rerender({ state: { ...idle, busy: true } }); expect(result.current.working).toBe(true);
    rerender({ state: { ...idle, history: [{ role: "error", text: "The request failed", ts: 5 }] } });
    expect(result.current.open).toBe(true); expect(result.current.working).toBe(false);
  });
});