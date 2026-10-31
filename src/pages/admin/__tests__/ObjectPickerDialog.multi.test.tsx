import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ObjectPickerDialog from "../ObjectPickerDialog";
vi.mock("@/prototype/client", () => ({ supabase: { from: () => { const q: any = { select: () => q, is: () => q, order: () => Promise.resolve({ data: [{ id: "a", name: "Categories" }, { id: "b", name: "About Us" }] }) }; return q; } } }));
vi.mock("../ObjectThumbnail", () => ({ default: () => null }));
afterEach(cleanup);
it("toggles thumbnails without adding or closing and adds all chosen objects together", async () => {
  const one = vi.fn(), many = vi.fn(), close = vi.fn();
  render(<ObjectPickerDialog open onOpenChange={close} onPick={one} onPickMany={many} />);
  fireEvent.click(await screen.findByRole("button", { name: "Categories", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "About Us", hidden: true }));
  expect(many).not.toHaveBeenCalled(); expect(one).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Deselect All", hidden: true }));
  expect(screen.getByRole("button", { name: "Add 0 Objects", hidden: true })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Categories", hidden: true })); fireEvent.click(screen.getByRole("button", { name: "About Us", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "Add 2 Objects", hidden: true }));
  expect(many).toHaveBeenCalledWith([{ id: "a", name: "Categories" }, { id: "b", name: "About Us" }]);
});