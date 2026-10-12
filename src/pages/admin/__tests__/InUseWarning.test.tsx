import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import InUseWarning, { inUseSummary } from "../InUseWarning";

const u = (name: string, path = `/${name}`) => ({ name, path, type: "static" as const });

describe("InUseWarning", () => {
  it("lists only the items that are on pages, capping the page names", () => {
    const s = inUseSummary([
      { label: "a.webp", usages: [u("Home"), u("About"), u("Team"), u("Contact"), u("Locations"), u("Home")] },
      { label: "b.webp", usages: [] },
    ], 3);
    expect(s).toEqual([{ label: "a.webp", pages: ["Home", "About", "Team"], more: 2 }]);
  });

  it("shows nothing when nothing is in use", () => {
    const { container } = render(<InUseWarning items={[{ label: "x", usages: [] }]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names the pages when something is in use", () => {
    render(<InUseWarning items={[{ label: "hero.webp", usages: [u("Home")] }]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("hero.webp");
    expect(screen.getByRole("alert")).toHaveTextContent("Home");
  });
});
