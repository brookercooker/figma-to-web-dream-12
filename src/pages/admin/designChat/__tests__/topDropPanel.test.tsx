import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { TopDropContent, TOP_DROP_PANEL_CLASS } from "../TopDropPanel";
import { HEADER_HEIGHT_PX } from "../layout";
import { useState } from "react";

function Harness() {
  const [open, setOpen] = useState(true);
  return <Dialog open={open} onOpenChange={setOpen}><TopDropContent aria-describedby={undefined}><DialogTitle>Pick</DialogTitle></TopDropContent></Dialog>;
}

describe("component selector panel", () => {
  it("drops down from the top under the toolbar, never from the side", () => {
    expect(TOP_DROP_PANEL_CLASS).toContain("slide-in-from-top-full");
    expect(TOP_DROP_PANEL_CLASS).toContain("slide-out-to-top-full");
    expect(TOP_DROP_PANEL_CLASS).not.toMatch(/from-(right|left)/);
    expect(TOP_DROP_PANEL_CLASS).toContain("max-w-[720px]");
    expect(TOP_DROP_PANEL_CLASS).toContain("max-h-[70vh]");
    render(<Harness />);
    expect(screen.getByRole("dialog").style.top).toBe(`${HEADER_HEIGHT_PX}px`);
  });
  it("closes with Esc", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
