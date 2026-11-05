import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SelectedWording from "../SelectedWording";
import { remoteSelection } from "../remoteSelection";
afterEach(cleanup);
it("shows coded wording for skipped edits and exposes explicit restoration", () => {
  const restore = vi.fn();
  const sel = remoteSelection({ key: "0", scope: "page", kind: "text", tag: "p", text: "Later chat wording", html: "Later chat wording" }, undefined, undefined, undefined, restore);
  render(<SelectedWording sel={sel} edits={{ "0": "My hand edit", "orig:0": "Old wording" }} onChange={vi.fn()} />);
  expect(screen.getByRole("textbox")).toHaveValue("Later chat wording");
  fireEvent.click(screen.getByRole("button", { name: "Put My Edit Back" }));
  expect(restore).toHaveBeenCalledOnce();
});