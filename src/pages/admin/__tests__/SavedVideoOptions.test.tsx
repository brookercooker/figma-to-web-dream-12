import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SavedVideoOptions, { videoThumbnail } from "../SavedVideoOptions";
afterEach(cleanup);
it("uses poster first, otherwise the standard YouTube thumbnail", () => {
  expect(videoThumbnail({ url: "https://www.youtube.com/watch?v=abcdefghijk" })).toBe("https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg");
  expect(videoThumbnail({ url: "https://youtu.be/abcdefghijk", poster: "/poster.jpg" })).toBe("/poster.jpg");
});
it("offers independent delete/reset commands and never creates a player", () => {
  const onDelete = vi.fn(), onReset = vi.fn();
  const view = render(<SavedVideoOptions video={{ url: "https://youtu.be/abcdefghijk" }} onDelete={onDelete} onReset={onReset} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete Video" })); expect(onDelete).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Undo All Changes to Video" })); expect(onReset).toHaveBeenCalledOnce();
  expect(view.container.querySelector("iframe,video")).toBeNull();
});
it("falls back from an unavailable poster to the standard YouTube thumbnail", () => {
  const view = render(<SavedVideoOptions video={{ url: "https://youtu.be/abcdefghijk", poster: "/missing.jpg" }} onDelete={vi.fn()} onReset={vi.fn()} />);
  const image = view.container.querySelector("img"); if (!image) throw new Error("Missing poster");
  fireEvent.error(image);
  expect(view.container.querySelector("img")?.src).toContain("https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg");
});
it("selects alignment and percentage width through the existing layout callbacks", () => {
  const onAlign = vi.fn(), onWidth = vi.fn();
  render(<SavedVideoOptions video={{ url: "/clip.mp4" }} onDelete={vi.fn()} onReset={vi.fn()} layout={{ align: "center", width: 50, onAlign, onWidth }} />);
  expect(screen.getByRole("button", { name: "Align Center" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Align Right" })); expect(onAlign).toHaveBeenCalledWith("right");
  fireEvent.click(screen.getByRole("button", { name: "Small" })); expect(onWidth).toHaveBeenCalledWith(25);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Video Width" }), { target: { value: "68" } }); expect(onWidth).toHaveBeenCalledWith(68);
  const del = screen.getByRole("button", { name: "Delete Video" });
  expect(del.nextElementSibling).toBe(screen.getByRole("button", { name: "Undo All Changes to Video" }));
});