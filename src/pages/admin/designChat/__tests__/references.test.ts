import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readableReferences, withReferences } from "../references";
import { visibleText } from "../logic";
import { useChatReferences } from "../useChatReferences";

const refs = [
  { kind: "image" as const, id: "i", name: "Lamp", url: "https://x/lamp.webp", labels: ["a", "b"] },
  { kind: "video" as const, id: "v", name: "Reel", url: "https://x/reel.mp4", altUrl: "https://x/reel.webm", poster: "https://x/p.jpg", labels: [] },
  { kind: "object" as const, id: "o1", name: "Team", componentKey: "TeamObject", type: "built in code" },
];

describe("library references", () => {
  it("adds nothing without references", () => expect(withReferences("Hi", [])).toBe("Hi"));
  it("writes one line per item with what the page editor stores", () => {
    expect(withReferences("Use these", refs)).toBe([
      "Use these", "", "References from the library:",
      '- Image "Lamp": https://x/lamp.webp, labels: a, b',
      '- Video "Reel": https://x/reel.mp4 https://x/reel.webm poster: https://x/p.jpg',
      '- Object "Team": id o1, key TeamObject, kind built in code',
    ].join("\n"));
  });
  it("shows the history bubble as short names", () => {
    const text = withReferences("Use these", refs);
    expect(readableReferences(text)).toBe("Use these\n\nImage: Lamp\nVideo: Reel\nObject: Team");
    expect(visibleText({ role: "user", text })).toBe("Use these\n\nImage: Lamp\nVideo: Reel\nObject: Team");
  });
  it("never adds the same item twice, and removes by key", () => {
    const { result } = renderHook(() => useChatReferences());
    act(() => { result.current.addReference(refs[0]); result.current.addReference(refs[0]); result.current.addReference(refs[2]); });
    expect(result.current.references).toHaveLength(2);
    act(() => result.current.removeReference("image:i"));
    expect(result.current.references.map((r) => r.id)).toEqual(["o1"]);
  });
});
