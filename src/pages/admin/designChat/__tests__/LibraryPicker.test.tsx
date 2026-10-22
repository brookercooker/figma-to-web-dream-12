import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Box, Image as ImageIcon } from "lucide-react";
import LibraryPicker from "../LibraryPicker";

const many = Array.from({ length: 70 }, (_, n) => ({ id: `i${n}`, name: `photo-${String(n).padStart(2, "0")}.jpg`, url: `https://x/${n}.webp`, alt: `photo ${n}`, labels: n === 7 ? ["Rooms/Lobby"] : [] }));
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
vi.mock("../../useAllLabels", () => ({ useLabelsForScope: () => ({ data: [{ path: "Rooms/Lobby" }], refetch: vi.fn() }) }));
beforeEach(() => { (globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }; });
afterEach(cleanup);

const setup = (kind: "images" | "objects" = "images") => {
  const onPick = vi.fn(), onOpenFull = vi.fn();
  const label = kind === "images" ? "Images" : "Objects";
  render(<LibraryPicker kind={kind} label={label} Icon={kind === "images" ? ImageIcon : Box} active={false} showLabel className="" onPick={onPick} onOpenFull={onOpenFull} />);
  fireEvent.click(screen.getByRole("button", { name: label }));
  return { onPick, onOpenFull };
};
const cards = () => within(screen.getByRole("dialog")).getAllByRole("button", { name: /^photo-|^Hero|^Flyer/ });

describe("library picker", () => {
  it("opens a large popup with search that narrows the grid", async () => {
    setup();
    expect(await screen.findByRole("heading", { name: "Pick an image" })).toBeInTheDocument();
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
  it("objects can be filtered by where they're built", async () => {
    setup("objects");
    await screen.findByText("2 of 2 shown");
    fireEvent.click(screen.getByRole("button", { name: "Built in code" }));
    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(cards()[0]).toHaveAttribute("title", "Hero");
  });
  it("Show more reveals 60 more", async () => {
    setup();
    await screen.findByText("60 of 70 shown");
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
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
    fireEvent.click(await screen.findByRole("button", { name: /Open full Images page/ }));
    expect(onOpenFull).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
