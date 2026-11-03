import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import SelectionColourPicker from "../SelectionColourPicker";
import InlineStylePanel from "../InlineStylePanel";
import { remoteSelection } from "../remoteSelection";

afterEach(cleanup);
it("applies native and hex text colors, and resets the existing color style key", () => {
  const change = vi.fn(); render(<SelectionColourPicker fontColor onChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Text Color" }));
  fireEvent.change(screen.getByLabelText("Text Color Spectrum"), { target: { value: "#853732" } });
  expect(change).toHaveBeenLastCalledWith("#853732");
  fireEvent.click(screen.getByRole("button", { name: "Text Color" }));
  fireEvent.change(screen.getByLabelText("Custom Colour (Hex)"), { target: { value: "invalid" } });
  expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Custom Colour (Hex)"), { target: { value: "#abc" } });
  fireEvent.keyDown(screen.getByLabelText("Custom Colour (Hex)"), { key: "Enter" });
  expect(change).toHaveBeenLastCalledWith("#aabbcc");
  fireEvent.click(screen.getByRole("button", { name: "Text Color" })); fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(change).toHaveBeenLastCalledWith("");
});
it("text color Reset preserves unrelated styles and uses the existing edit callback", () => {
  const sel = remoteSelection({ key: "0", scope: "page", kind: "text", tag: "p", text: "Nova", style: { color: "#853732" } });
  const change = vi.fn(); render(<InlineStylePanel sel={sel} edits={{ "style:0": JSON.stringify({ color: "#853732", "font-weight": "700" }) }} onChange={change} onReplaceImage={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Text Color" })); fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(change).toHaveBeenCalledWith({ "style:0": JSON.stringify({ "font-weight": "700" }) });
});