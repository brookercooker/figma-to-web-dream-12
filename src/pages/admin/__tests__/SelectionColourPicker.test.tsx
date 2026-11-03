import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SelectionColourPicker from "../SelectionColourPicker";
import InlineStylePanel from "../InlineStylePanel";
import { remoteSelection } from "../remoteSelection";

afterEach(cleanup);
it("only applies native/hex colors after confirmation", () => {
  const change = vi.fn(); render(<SelectionColourPicker fontColor value="#212121" onChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Text Color" }));
  fireEvent.click(screen.getByRole("button", { name: "Custom Color" }));
  fireEvent.change(screen.getByLabelText("Text Color Spectrum"), { target: { value: "#853732" } });
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(change).toHaveBeenLastCalledWith("#853732");
  fireEvent.click(screen.getByRole("button", { name: "Text Color" }));
  fireEvent.click(screen.getByRole("button", { name: "Custom Color" }));
  fireEvent.change(screen.getByLabelText("Custom Colour (Hex)"), { target: { value: "invalid" } });
  expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Custom Colour (Hex)"), { target: { value: "#abc" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(change).toHaveBeenLastCalledWith("#aabbcc");
});
it.each(["Cancel", "Escape"])("%s drops a color preview", action => {
  const change = vi.fn(); render(<SelectionColourPicker fontColor value="#212121" onChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Text Color" }));
  fireEvent.click(screen.getByRole("button", { name: "Garnet" }));
  expect(change).not.toHaveBeenCalled();
  if (action === "Cancel") fireEvent.click(screen.getByRole("button", { name: action }));
  else fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Text Color" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(change).toHaveBeenLastCalledWith("#212121");
});
it("text color Reset preserves unrelated styles and uses the existing edit callback", () => {
  const sel = remoteSelection({ key: "0", scope: "page", kind: "text", tag: "p", text: "Nova", style: { color: "#853732" } });
  const change = vi.fn(); render(<InlineStylePanel sel={sel} edits={{ "style:0": JSON.stringify({ color: "#853732", "font-weight": "700" }) }} onChange={change} onReplaceImage={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Text Color" })); fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(change).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(change).toHaveBeenCalledWith({ "style:0": JSON.stringify({ "font-weight": "700" }) });
});