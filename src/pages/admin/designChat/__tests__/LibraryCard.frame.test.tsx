import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Box } from "lucide-react";
import LibraryCard from "../LibraryCard";

const base = { labels: ["Room/Kitchen"], selected: true, FallbackIcon: Box, onPick: () => {} };

describe("LibraryCard thumbnail frame", () => {
  it("keeps a fixed 4:3 frame that a tall image cannot resize", () => {
    const { container } = render(<LibraryCard {...base} item={{ kind: "image", id: "1", name: "Tall", url: "/t.jpg", thumb: "/t.jpg" } as any} />);
    const frame = container.querySelector("[data-thumb-frame]")!;
    expect(frame.className).toContain("aspect-[4/3]");
    expect(frame.className).toContain("overflow-hidden");
    const fill = frame.querySelector("[data-thumb-fill]")!;
    expect(fill.className).toMatch(/absolute inset-0/);
    const img = fill.querySelector("img")!;
    Object.defineProperty(img, "naturalWidth", { value: 100 });
    Object.defineProperty(img, "naturalHeight", { value: 1000 });
    expect(img.className).toMatch(/absolute inset-0/);
    expect(img.className).toContain("object-contain");
  });

  it("puts custom thumbnails inside the absolute fill layer", () => {
    const { container } = render(<LibraryCard {...base} item={{ kind: "object", id: "o", name: "Obj" } as any} thumbnail={<i data-x="" />} />);
    expect(container.querySelector("[data-thumb-fill] [data-x]")).not.toBeNull();
  });
});
