import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ObjectPickerDialog from "../ObjectPickerDialog";
import { rememberTopDropAnchor } from "../designChat/TopDropPanel";
const library = vi.hoisted(() => ({ items: [] as { id: string; name: string; labels: string[] }[] }));
vi.mock("@/prototype/client", () => ({ supabase: { from: () => { const q: any = { select: () => q, is: () => q, order: () => Promise.resolve({ data: library.items }) }; return q; } } }));
vi.mock("../ObjectThumbnail", () => ({ default: () => null }));
beforeEach(() => {
  library.items = [{ id: "a", name: "Categories", labels: ["Hero", "Photo", "Core"] }, { id: "b", name: "About Us", labels: ["Footer", "Editorial", "Team"] }];
  const opener = document.createElement("button"); document.body.appendChild(opener); rememberTopDropAnchor(opener);
  localStorage.removeItem("nova:picker-recent-labels");
});
it("offers Any/All on the main view for two selected chips even with only two labels", async () => {
  library.items = [
    { id: "a", name: "Hero Only", labels: ["Hero"] },
    { id: "b", name: "Photo Only", labels: ["Photo"] },
    { id: "c", name: "Both", labels: ["Hero", "Photo"] },
  ];
  render(<ObjectPickerDialog open onOpenChange={vi.fn()} onPick={vi.fn()} onPickMany={vi.fn()} />);
  await screen.findByRole("button", { name: "Both", hidden: true });
  expect(screen.queryByRole("button", { name: "More Labels", hidden: true })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Hero 2", hidden: true }));
  expect(screen.queryByRole("group", { name: "Show objects with", hidden: true })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Photo 2", hidden: true }));
  expect(screen.getByRole("button", { name: "Hero 2", hidden: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Photo 2", hidden: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Any Label", hidden: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Hero Only", hidden: true })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Photo Only", hidden: true })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Both", hidden: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All Labels", hidden: true }));
  expect(screen.getByRole("button", { name: "All Labels", hidden: true })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("button", { name: "Hero Only", hidden: true })).toBeNull();
  expect(screen.queryByRole("button", { name: "Photo Only", hidden: true })).toBeNull();
  expect(screen.getByRole("button", { name: "Both", hidden: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Photo 2", hidden: true }));
  expect(screen.queryByRole("group", { name: "Show objects with", hidden: true })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "All 3", hidden: true }));
  expect(screen.getByRole("button", { name: "Hero 2", hidden: true })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", { name: "Photo 2", hidden: true })).toHaveAttribute("aria-pressed", "false");
});
afterEach(() => { cleanup(); document.body.replaceChildren(); });
it("toggles thumbnails without adding or closing and adds all chosen objects together", async () => {
  const one = vi.fn(), many = vi.fn(), close = vi.fn();
  const opener = document.createElement("button"); document.body.appendChild(opener); rememberTopDropAnchor(opener);
  render(<ObjectPickerDialog open onOpenChange={close} onPick={one} onPickMany={many} />);
  fireEvent.click(await screen.findByRole("button", { name: "Categories", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "About Us", hidden: true }));
  expect(many).not.toHaveBeenCalled(); expect(one).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Deselect All", hidden: true }));
  expect(screen.getByRole("button", { name: "Select objects to add", hidden: true })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Categories", hidden: true })); fireEvent.click(screen.getByRole("button", { name: "About Us", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "Add 2 Objects", hidden: true }));
  expect(many).toHaveBeenCalledWith([{ id: "a", name: "Categories" }, { id: "b", name: "About Us" }]);
});
it("retains hidden selections and adds every selected object after filtering", async () => {
  const many = vi.fn();
  render(<ObjectPickerDialog open onOpenChange={vi.fn()} onPick={vi.fn()} onPickMany={many} />);
  fireEvent.click(await screen.findByRole("button", { name: "Categories", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "About Us", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "Hero 1", hidden: true }));
  expect(screen.getByRole("status", { hidden: true })).toHaveTextContent("Showing 1 of 2 objects · 1 selected hidden by filters");
  fireEvent.click(screen.getByRole("button", { name: "Add 2 Objects", hidden: true }));
  expect(many).toHaveBeenCalledWith([{ id: "a", name: "Categories" }, { id: "b", name: "About Us" }]);
});
it("filters through the label list and remembers recently selected labels", async () => {
  render(<ObjectPickerDialog open onOpenChange={vi.fn()} onPick={vi.fn()} onPickMany={vi.fn()} />);
  await screen.findByRole("button", { name: "Categories", hidden: true });
  fireEvent.click(screen.getByRole("button", { name: "More Labels 1", hidden: true }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Hero", hidden: true }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Footer", hidden: true }));
  expect(screen.getByRole("button", { name: "Show 2 Objects", hidden: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All Labels", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "Show 0 Objects", hidden: true }));
  expect(screen.getByText("No objects match these filters.")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("nova:picker-recent-labels") ?? "[]")).toEqual(["footer", "hero"]);
});
it("preserves single-pick callbacks and resets filters and selections on reopening", async () => {
  const one = vi.fn(), close = vi.fn();
  const view = render(<ObjectPickerDialog open onOpenChange={close} onPick={one} />);
  fireEvent.click(await screen.findByRole("button", { name: "Categories", hidden: true }));
  expect(one).toHaveBeenCalledWith({ id: "a", name: "Categories" });
  fireEvent.change(screen.getByPlaceholderText("Search by name or label"), { target: { value: "missing" } });
  view.rerender(<ObjectPickerDialog open={false} onOpenChange={close} onPick={one} />);
  view.rerender(<ObjectPickerDialog open onOpenChange={close} onPick={one} />);
  expect(await screen.findByRole("button", { name: "Categories", hidden: true })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Search by name or label")).toHaveValue("");
});