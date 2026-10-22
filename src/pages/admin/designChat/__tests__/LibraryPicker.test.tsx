import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Image as ImageIcon } from "lucide-react";
import LibraryPicker from "../LibraryPicker";

const many = Array.from({ length: 40 }, (_, n) => ({ id: `i${n}`, name: `photo-${n}.jpg`, url: `https://x/${n}.webp`, alt: `photo ${n}`, labels: n === 7 ? ["Lobby"] : [] }));
vi.mock("../../ImagePickerDialog", async () => {
  const real = await vi.importActual<any>("../../ImagePickerDialog");
  return { ...real, loadLibraryImages: async () => many };
});
vi.mock("../../VideoPickerDialog", () => ({ loadLibraryVideos: async () => [], videoMatches: () => true }));
vi.mock("../../ObjectPickerDialog", () => ({ loadLibraryObjects: async () => [], objectMatches: () => true }));
beforeEach(() => { (globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }; Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

const setup = () => {
  const onPick = vi.fn(), onOpenFull = vi.fn();
  render(<LibraryPicker kind="images" label="Images" Icon={ImageIcon} active={false} showLabel className="" onPick={onPick} onOpenFull={onOpenFull} />);
  fireEvent.click(screen.getByRole("button", { name: "Images" }));
  return { onPick, onOpenFull };
};

describe("library picker", () => {
  it("opens a searchable list with a count and filters by name or label", async () => {
    setup();
    expect(await screen.findByText("Showing 30 of 40, keep typing to narrow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Images" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.change(screen.getByPlaceholderText(/Search images/), { target: { value: "lobby" } });
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.getByText("photo-7.jpg")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Search images/), { target: { value: "zzz" } });
    expect(await screen.findByText("No images match")).toBeInTheDocument();
  });
  it("picks one item and closes", async () => {
    const { onPick } = setup();
    fireEvent.click(await screen.findByText("photo-3.jpg"));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ kind: "image", id: "i3", url: "https://x/3.webp" }));
    await waitFor(() => expect(screen.queryByText("photo-3.jpg")).toBeNull());
  });
  it("has a footer link to the full page", async () => {
    const { onOpenFull } = setup();
    fireEvent.click(await screen.findByRole("button", { name: /Open full Images page/ }));
    expect(onOpenFull).toHaveBeenCalled();
  });
});
