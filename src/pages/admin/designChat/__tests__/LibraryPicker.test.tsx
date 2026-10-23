import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Box, Image as ImageIcon } from "lucide-react";
import LibraryPicker from "../LibraryPicker";
import LibraryCard from "../LibraryCard";
import { PALETTE, colorFor } from "../../labelColors";

const many = Array.from({ length: 70 }, (_, n) => ({ id: `i${n}`, name: `photo-${String(n).padStart(2, "0")}.jpg`, url: `https://x/${n}.webp`, alt: `photo ${n}`, labels: n === 7 ? ["Rooms/Lobby"] : n === 8 ? ["Z/a", "Z/b", "Z/c", "Z/d", "Z/e"] : n === 2 ? ["Area/Kitchen"] : [], createdAt: n === 5 ? "2026-01-03T00:00:00Z" : n === 6 ? "2025-01-01T00:00:00Z" : undefined }));
const thumbs = vi.hoisted(() => ({ data: {} as Record<string, Record<string, string>>, calls: vi.fn() }));
vi.mock("../../useAdminData", () => ({ useImageThumbnails: (bucket: string, paths: string[], width: number) => {
  thumbs.calls(bucket, paths, width);
  return { data: thumbs.data[bucket] ?? {} };
} }));
vi.mock("../../ImagePickerDialog", async () => {
  const real = await vi.importActual<any>("../../ImagePickerDialog");
  return { ...real, loadLibraryImages: async () => many };
});
vi.mock("../../VideoPickerDialog", () => ({ loadLibraryVideos: async () => [], videoMatches: () => true }));
vi.mock("../../ObjectPickerDialog", async () => {
  const real = await vi.importActual<any>("../../ObjectPickerDialog");
  return { ...real, loadLibraryObjects: async () => [
    { id: "o1", name: "Hero", component_key: "Hero", labels: [] },
    { id: "o2", name: "Flyer", component_key: null, labels: [] },
  ] };
});
vi.mock("../../useAllLabels", () => ({ useLabelsForScope: () => ({ data: [{ path: "Rooms/Lobby", color_index: 7 }], refetch: vi.fn() }) }));
beforeEach(() => {
  thumbs.data = {}; thumbs.calls.mockClear();
  many.forEach((i, n) => Object.assign(i, { visibility: n % 2 === 0 ? "gated" : "public", webPath: `${n}.webp`, webUrl: `/__l5e/assets-v1/id/${n}.jpg` }));
  (globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

const setup = (kind: "images" | "objects" = "images") => {
  const onPick = vi.fn(), onOpenFull = vi.fn();
  const label = kind === "images" ? "Images" : "Objects";
  render(<LibraryPicker kind={kind} label={label} Icon={kind === "images" ? ImageIcon : Box} active={false} showLabel className="" onPick={onPick} onOpenFull={onOpenFull} />);
  fireEvent.click(screen.getByRole("button", { name: label }));
  return { onPick, onOpenFull };
};
const cards = () => within(screen.getByRole("dialog")).getAllByRole("button").filter((b) => /^(photo-|Hero|Flyer)/.test(b.getAttribute("title") ?? ""));

describe("library picker", () => {
  it("centers whole image thumbnails for both the thumbnail and web fallback", async () => {
    thumbs.data = { "images-web-gated": { "0.webp": "https://signed/0" } };
    setup(); await screen.findByText("60 of 70 shown");
    const card = screen.getByTitle("photo-00.jpg");
    const img = card.querySelector("img");
    expect(img).toHaveClass("object-contain", "object-center");
    if (!img) throw new Error("Expected thumbnail");
    fireEvent.error(img);
    expect(card.querySelector("img")).toHaveClass("object-contain", "object-center");
  });
  it.each(["video", "object"] as const)("keeps %s thumbnails cropped as before", (kind) => {
    const item = kind === "video"
      ? { kind, id: "v", name: "Video", url: "video", thumb: "poster", labels: [] }
      : { kind, id: "o", name: "Object", type: "built in code", thumb: "object-thumb" };
    const { container } = render(<LibraryCard item={item} labels={[]} selected={false} FallbackIcon={Box} onPick={vi.fn()} />);
    expect(container.querySelector("img")).toHaveClass("object-cover");
    expect(container.querySelector("img")).not.toHaveClass("object-contain");
  });
  it("uses stored Lovable asset URLs regardless of visibility while thumbnails are pending", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    expect(screen.getByTitle("photo-00.jpg").querySelector("img")).toHaveAttribute("src", "/__l5e/assets-v1/id/0.jpg");
    expect(screen.getByTitle("photo-01.jpg").querySelector("img")).toHaveAttribute("src", "/__l5e/assets-v1/id/1.jpg");
  });
  it("does not use a private staging URL while signing is pending", async () => {
    Object.assign(many[0], { webUrl: "https://x/images-web-gated/0.webp" });
    setup(); await screen.findByText("60 of 70 shown");
    expect(screen.getByTitle("photo-00.jpg").querySelector("img")).toBeNull();
  });
  it("uses signed gated and public transformed thumbnails without changing the picked URL", async () => {
    thumbs.data = { "images-web-gated": { "0.webp": "https://signed/0" }, "images-web": { "1.webp": "https://public/thumb/1" } };
    const { onPick } = setup(); await screen.findByText("60 of 70 shown");
    expect(screen.getByTitle("photo-00.jpg").querySelector("img")).toHaveAttribute("src", "https://signed/0");
    expect(screen.getByTitle("photo-01.jpg").querySelector("img")).toHaveAttribute("src", "https://public/thumb/1");
    fireEvent.click(screen.getByTitle("photo-00.jpg"));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "i0", url: "https://x/0.webp" }));
  });
  it("requests thumbnail batches only for shown images and updates them when filtering", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    expect(thumbs.calls).toHaveBeenCalledWith("images-web-gated", Array.from({ length: 30 }, (_, n) => `${n * 2}.webp`), 320);
    expect(thumbs.calls.mock.calls.every(([, paths]) => !paths.includes("60.webp"))).toBe(true);
    fireEvent.change(screen.getByLabelText("Search images"), { target: { value: "photo-60" } });
    await waitFor(() => expect(thumbs.calls).toHaveBeenCalledWith("images-web-gated", ["60.webp"], 320));
  });
  it("a failed final thumbnail remains selectable with its original reference", async () => {
    thumbs.data = { "images-web-gated": { "0.webp": "https://signed/0" } };
    const { onPick } = setup(); await screen.findByText("60 of 70 shown");
    const card = screen.getByTitle("photo-00.jpg");
    const img = card.querySelector("img");
    if (!img) throw new Error("Expected signed thumbnail");
    fireEvent.error(img);
    const fallback = card.querySelector("img");
    expect(fallback).toHaveAttribute("src", "/__l5e/assets-v1/id/0.jpg");
    if (!fallback) throw new Error("Expected web URL fallback");
    fireEvent.error(fallback);
    expect(card.querySelector("img")).toBeNull();
    fireEvent.click(card);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "i0", url: "https://x/0.webp" }));
  });
  it("keeps the picture after a storage thumbnail fails but the asset URL loads", async () => {
    thumbs.data = { "images-web": { "1.webp": "https://public/thumb/1" } };
    setup(); await screen.findByText("60 of 70 shown");
    const card = screen.getByTitle("photo-01.jpg");
    const img = card.querySelector("img");
    if (!img) throw new Error("Expected public thumbnail");
    fireEvent.error(img);
    expect(card.querySelector("img")).toHaveAttribute("src", "/__l5e/assets-v1/id/1.jpg");
    fireEvent.load(card.querySelector("img") as HTMLImageElement);
    expect(card.querySelector("img")).toHaveAttribute("src", "/__l5e/assets-v1/id/1.jpg");
  });
  it("opens a large popup with search that narrows the grid", async () => {
    setup();
    expect(await screen.findByRole("heading", { name: "Pick an Image" })).toBeInTheDocument();
    expect(await screen.findByText("60 of 70 shown")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search images"), { target: { value: "lobby" } });
    await waitFor(() => expect(cards()).toHaveLength(1));
    fireEvent.change(screen.getByLabelText("Search images"), { target: { value: "zzz" } });
    expect(await screen.findByText("No images match")).toBeInTheDocument();
    expect(screen.getByText("Try fewer words or clear the filters")).toBeInTheDocument();
  });
  it("a label chip filters and clicking it again clears", async () => {
    setup();
    await screen.findByText("60 of 70 shown");
    const chip = screen.getByRole("button", { name: "Lobby" });
    expect(chip).toHaveAttribute("title", "Rooms/Lobby");
    fireEvent.click(chip);
    await waitFor(() => expect(cards()).toHaveLength(1));
    fireEvent.click(chip);
    expect(await screen.findByText("60 of 70 shown")).toBeInTheDocument();
  });
  it("Show More reveals 60 more", async () => {
    setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(await screen.findByText("70 of 70 shown")).toBeInTheDocument();
    expect(cards()).toHaveLength(70);
  });
  it("select then Done adds items in selection order and closes", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-04.jpg"));
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByTitle("photo-04.jpg")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onPick.mock.calls.map((c) => c[0].id)).toEqual(["i4", "i3"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("clicking a selected card deselects it", async () => {
    setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    expect(screen.getByTitle("photo-03.jpg")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Nothing selected yet")).toBeInTheDocument();
  });
  it("Done is disabled with no selection", async () => {
    setup();
    await screen.findByText("60 of 70 shown");
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
  });
  it("Cancel and Escape add nothing", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Images" }));
    await screen.findByText("60 of 70 shown");
    expect(screen.getByText("Nothing selected yet")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onPick).not.toHaveBeenCalled();
  });
  it("Enter in the search box finishes only with a selection", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    const box = screen.getByLabelText("Search images");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onPick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("selection survives a search change", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    fireEvent.change(screen.getByLabelText("Search images"), { target: { value: "lobby" } });
    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "i3" }));
  });
  it("has a link to the full page that closes the popup", async () => {
    const { onOpenFull } = setup();
    fireEvent.click(await screen.findByRole("button", { name: /Open Images Page/ }));
    expect(onOpenFull).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  const titles = () => cards().map((c) => c.getAttribute("title"));
  const sortTo = (v: string) => fireEvent.change(screen.getByLabelText("Sort"), { target: { value: v } });
  it("Enter finishes after clicking a card", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    const card = screen.getByTitle("photo-03.jpg");
    fireEvent.click(card); card.focus();
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onPick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("Enter finishes even when focus is on the page body", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(onPick).toHaveBeenCalledTimes(1);
  });
  it("Enter on a card with nothing selected is left to the card (selects it)", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    const card = screen.getByTitle("photo-03.jpg");
    const ev = fireEvent.keyDown(card, { key: "Enter" });
    expect(ev).toBe(true); // not prevented, so the button's native activation runs
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("Enter on Cancel, Done or Show More is not hijacked", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    for (const name of ["Cancel", "Done", "Show More"]) {
      expect(fireEvent.keyDown(screen.getByRole("button", { name }), { key: "Enter" })).toBe(true);
    }
    expect(onPick).not.toHaveBeenCalled();
  });
  it("Enter does nothing with nothing selected", async () => {
    const { onPick } = setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
    fireEvent.keyDown(document.body, { key: "Enter" });
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("sorts by name Z–A", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    sortTo("name-desc");
    expect(titles()[0]).toBe("photo-69.jpg");
  });
  it("sorts newest and oldest first with undated items last", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    sortTo("newest");
    expect(titles().slice(0, 3)).toEqual(["photo-05.jpg", "photo-06.jpg", "photo-00.jpg"]);
    sortTo("oldest");
    expect(titles().slice(0, 3)).toEqual(["photo-06.jpg", "photo-05.jpg", "photo-00.jpg"]);
    expect(screen.getByText("60 of 70 shown")).toBeInTheDocument();
  });
  it("groups by first label with unlabelled items last", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    sortTo("label");
    expect(titles().slice(0, 4)).toEqual(["photo-02.jpg", "photo-07.jpg", "photo-08.jpg", "photo-00.jpg"]);
  });
  it("sort resets on reopen", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    sortTo("name-desc");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Images" }));
    await screen.findByText("60 of 70 shown");
    expect(screen.getByLabelText("Sort")).toHaveValue("name");
  });
  it("selection survives a sort change", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByTitle("photo-03.jpg"));
    sortTo("label");
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByTitle("photo-03.jpg")).toHaveAttribute("aria-pressed", "true");
  });
  const bgOf = (v: string) => { const d = document.createElement("div"); d.style.background = v; return d.style.background; };
  it("card pills use the registered colour, or the hash fallback when unregistered", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    const lobby = within(screen.getByTitle("photo-07.jpg")).getByTitle("Rooms/Lobby");
    expect(lobby).toHaveTextContent("Lobby");
    expect(lobby.style.background).toBe(bgOf(PALETTE[7].bg));
    const kitchen = within(screen.getByTitle("photo-02.jpg")).getByTitle("Area/Kitchen");
    expect(kitchen.style.background).toBe(bgOf(colorFor("Area/Kitchen").bg));
  });
  it("more than 3 labels shows +N listing the rest", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    const card = screen.getByTitle("photo-08.jpg");
    expect(card.querySelectorAll("[data-label-pill]")).toHaveLength(3);
    expect(within(card).getByText("+2")).toHaveAttribute("title", "Z/d, Z/e");
  });
  it("label filter chips carry the label colour", async () => {
    setup(); await screen.findByText("60 of 70 shown");
    const chip = screen.getByRole("button", { name: "Lobby" });
    expect(chip.style.background).toBe(bgOf(PALETTE[7].bg));
    fireEvent.click(chip);
    expect(chip.style.background).toBe(bgOf(PALETTE[7].swatch));
  });
});
