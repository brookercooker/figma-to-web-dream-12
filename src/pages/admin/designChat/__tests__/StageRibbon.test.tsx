import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import StageRibbon from "../StageRibbon";
import { timedProgress } from "../waitEstimates";

afterEach(cleanup);
it("retains the estimated remaining-time label and adds elapsed time", () => {
  const progress = timedProgress("normal", 0, 20, "Making your change");
  render(<StageRibbon progress={{ ...progress, ribbon: { received: true, changed: false, built: false, ready: false, current: 1, partial: progress.value, elapsed: 20 } }} />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Making your change · about a minute left · 0:20");
  expect(screen.getByRole("progressbar")).toHaveTextContent("Making your change");
  expect(screen.getByRole("progressbar")).not.toHaveTextContent("Change made");
});