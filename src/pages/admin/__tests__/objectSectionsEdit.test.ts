import { describe, expect, it } from "vitest";
import { imageSection, layoutFields, moveSection, sectionLabel, setLayout, videoSection } from "../objectSectionsEdit";
import type { Section } from "@/components/ObjectSections";

const button = { id: "b", type: "button", label: "Go", href: "/", align: "center", variant: "solid" } as Section;
const row = { id: "r", type: "imageRow", heading: "Rooms", columns: 3, images: [] } as Section;
describe("designed object sections", () => {
  it("moves within the object's own list and clamps", () => {
    expect(moveSection([button, row], "b", 5).map(s => s.id)).toEqual(["r", "b"]);
    expect(moveSection([button, row], "r", -3).map(s => s.id)).toEqual(["r", "b"]);
    expect(moveSection([button, row], "missing", 0)).toEqual([button, row]);
  });
  it("labels sections in plain words", () => {
    expect(sectionLabel(row)).toBe("Row of images: Rooms");
    expect(sectionLabel(button)).toBe("Button");
  });
  it("picked pictures and videos become block sections holding them", () => {
    expect(imageSection("/a.jpg", "A")).toMatchObject({ type: "free", images: [{ url: "/a.jpg", alt: "A" }] });
    expect(videoSection("/v.mp4", "/p.jpg")).toMatchObject({ type: "free", images: [], videos: [{ url: "/v.mp4", poster: "/p.jpg" }] });
  });
  it("offers only the selected section's own settings", () => {
    expect(layoutFields(row).map(f => f.key)).toEqual(["flow", "columns"]);
    expect(layoutFields(button).map(f => f.key)).toEqual(["flow", "align", "variant"]);
    expect(layoutFields({ ...button, flow: "inline" } as Section).map(f => f.key)).toContain("flowWidth");
  });
  it("sets and clears layout values without touching other settings", () => {
    expect(setLayout(row, "columns", "4")).toMatchObject({ columns: 4, heading: "Rooms" });
    expect(setLayout({ ...row, flow: "inline" } as Section, "flow", "")).not.toHaveProperty("flow");
  });
});
