import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDrawing } from "../useDrawing";

describe("drawing availability", () => {
  it("does not start until the preview is available", () => {
    const { result } = renderHook(() => useDrawing({ device: "desktop", path: "/" }));
    expect(result.current.available).toBe(false);
    act(() => result.current.start());
    expect(result.current.on).toBe(false);
    act(() => result.current.setAvailable(true));
    expect(result.current.available).toBe(true);
    act(() => result.current.start());
    expect(result.current.on).toBe(true);
  });

  it("clears strokes and turns drawing off when the preview becomes unavailable", () => {
    const { result } = renderHook(() => useDrawing({ device: "desktop", path: "/" }));
    act(() => result.current.setAvailable(true));
    act(() => {
      result.current.start();
      result.current.add([{ x: 0.1, y: 0.1 }, { x: 0.4, y: 0.4 }]);
    });
    expect(result.current.on).toBe(true);
    expect(result.current.strokes).toHaveLength(1);
    act(() => result.current.setAvailable(false));
    expect(result.current.available).toBe(false);
    expect(result.current.on).toBe(false);
    expect(result.current.strokes).toEqual([]);
    act(() => result.current.start());
    expect(result.current.on).toBe(false);
  });
});