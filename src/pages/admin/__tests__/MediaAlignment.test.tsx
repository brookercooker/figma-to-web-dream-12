import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import MediaAlignment from "../MediaAlignment";
afterEach(cleanup);
it("reports all three alignment choices and highlights only the active one", () => {
  const onChange = vi.fn(); render(<MediaAlignment value="left" onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Align Left" })).toHaveAttribute("aria-pressed", "true");
  for (const [label, value] of [["Left", "left"], ["Center", "center"], ["Right", "right"]]) {
    fireEvent.click(screen.getByRole("button", { name: `Align ${label}` })); expect(onChange).toHaveBeenLastCalledWith(value);
  }
});