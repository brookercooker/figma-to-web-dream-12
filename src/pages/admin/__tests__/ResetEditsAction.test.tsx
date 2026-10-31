import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ResetEditsAction from "../ResetEditsAction";
afterEach(cleanup);
it.each([false, true])("reset requires confirmation in page/object scope %s", object => {
  const reset = vi.fn();
  render(<ResetEditsAction name="About Us" object={object} onReset={reset} />);
  fireEvent.click(screen.getByRole("button", { name: `Restore Original ${object ? "Object" : "Page"}` }));
  expect(reset).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(reset).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: `Restore Original ${object ? "Object" : "Page"}` }));
  fireEvent.click(screen.getByRole("button", { name: `Restore Original ${object ? "Object" : "Page"}` }));
  expect(reset).toHaveBeenCalledOnce();
});