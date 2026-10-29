import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { TopDropContent, TOP_DROP_PANEL_CLASS } from "../TopDropPanel";
import { HEADER_HEIGHT_PX } from "../layout";
import { useRef, useState } from "react";
import { topDropPlacement } from "../topDropPlacement";

function Harness() {
  const [open, setOpen] = useState(true);
  const anchor = useRef<HTMLButtonElement>(null);
  return <><button ref={anchor}>Opener</button><Dialog open={open} onOpenChange={setOpen}><TopDropContent anchorRef={anchor} aria-describedby={undefined}><DialogTitle>Pick</DialogTitle></TopDropContent></Dialog></>;
}

describe("component selector panel", () => {
  it("aligns with the opening button and touches the measured toolbar border", () => {
    const result = topDropPlacement({ left: 350, right: 440, width: 90, bottom: 49 }, { left: 300, right: 1280, width: 980, bottom: 1800 }, 1280, 56);
    expect(result.left).toBe(350); expect(result.top).toBe(56); expect(result.width).toBe(720); expect(result.origin).toBe(45);
  });
  it("flips to the button's right edge and clamps within the editing area", () => {
    const area = { left: 300, right: 1200, width: 900, bottom: 1800 };
    expect(topDropPlacement({ left: 1080, right: 1170, width: 90, bottom: 49 }, area, 1280, 56).left).toBe(450);
    const narrow = topDropPlacement({ left: 350, right: 390, width: 40, bottom: 49 }, { ...area, right: 400, width: 100 }, 400, 56);
    expect(narrow.left).toBe(300); expect(narrow.width).toBe(100);
  });
  it("drops down from the top under the toolbar, never from the side", () => {
    expect(TOP_DROP_PANEL_CLASS).toContain("slide-in-from-top-2");
    expect(TOP_DROP_PANEL_CLASS).toContain("slide-out-to-top-2");
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
