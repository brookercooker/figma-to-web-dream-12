import { describe, expect, it } from "vitest";
import { tierFor, clampPanelWidth, LABEL_MIN_WIDTH } from "../useManagerLayout";
import { fitScale, scaleLabel, scaleRect, unscalePoint, DESKTOP_VIRTUAL_WIDTH } from "../previewScale";
import { objectAddLabel } from "../../ObjectPickerDialog";

describe("Manager layout tiers", () => {
  it("puts phones under 640, tablets under 1024 and laptops under 1280", () => {
    expect(tierFor(390)).toBe("phone");
    expect(tierFor(639)).toBe("phone");
    expect(tierFor(640)).toBe("tablet");
    expect(tierFor(768)).toBe("tablet");
    expect(tierFor(1024)).toBe("laptop");
    expect(tierFor(1280)).toBe("wide");
  });
  it("shows toolbar words from 1100 px", () => expect(LABEL_MIN_WIDTH).toBe(1100));
  it("keeps the tablet panel between 280 and 420 px and the laptop panel at least 300 px", () => {
    expect(clampPanelWidth(200, "tablet")).toBe(280);
    expect(clampPanelWidth(500, "tablet")).toBe(420);
    expect(clampPanelWidth(280, "laptop")).toBe(300);
  });
});

describe("Scaled desktop preview", () => {
  it("renders desktop at 1280 px and shrinks to fit", () => {
    expect(DESKTOP_VIRTUAL_WIDTH).toBe(1280);
    expect(fitScale(794, 1280)).toBeCloseTo(0.62, 2);
    expect(fitScale(1600, 1280)).toBe(1);
    expect(scaleLabel(fitScale(794, 1280))).toBe("Showing desktop at 62%");
    expect(scaleLabel(1)).toBeNull();
  });
  it("maps frame rects to the screen and pointer positions back into the frame", () => {
    expect(scaleRect({ x: 100, y: 200, width: 50, height: 10 }, 0.5)).toEqual({ x: 50, y: 100, width: 25, height: 5 });
    expect(unscalePoint(50, 100, 0.5)).toEqual({ x: 100, y: 200 });
  });
});

describe("Object picker add button", () => {
  it("asks for a selection until something is picked", () => {
    expect(objectAddLabel(0)).toBe("Select objects to add");
    expect(objectAddLabel(1)).toBe("Add 1 Object");
    expect(objectAddLabel(3)).toBe("Add 3 Objects");
  });
});

import { scaledViewportPlan, MAX_VIRTUAL_HEIGHT, deviceViewportHeight } from "../previewScale";
describe("Scaled viewport plan", () => {
  it("defaults to Tablet when desktop would show below 50%", () => {
    const plan = scaledViewportPlan({ available: 448, height: 967, virtualWidth: 1280, enabled: true, fallbackWidth: 768 });
    expect(plan.width).toBe(768);
    expect(plan.label).toBe("Showing tablet at 58% (recommended at this size)");
  });
  it("keeps Desktop when chosen, with a recommendation", () => {
    const plan = scaledViewportPlan({ available: 448, height: 967, virtualWidth: 1280, enabled: true, fallbackWidth: 768, explicit: true });
    expect(plan.width).toBe(1280);
    expect(plan.label).toBe("Showing desktop at 35%; Tablet recommended at this size");
  });
  it("fills the available height (virtual height = available ÷ scale)", () => {
    const plan = scaledViewportPlan({ available: 704, height: 712, virtualWidth: 1280, enabled: true, fallbackWidth: 768 });
    expect(plan.scale).toBeCloseTo(0.55, 2);
    expect(plan.height * plan.scale).toBeCloseTo(712, 0);
  });
  it("reports realistic device heights: Desktop 800, Tablet 1024, Phone 844", () => {
    expect(MAX_VIRTUAL_HEIGHT).toBe(800);
    expect([deviceViewportHeight(1280), deviceViewportHeight(768), deviceViewportHeight(390)]).toEqual([800, 1024, 844]);
  });
  it("does not scale when it fits", () => {
    expect(scaledViewportPlan({ available: 1400, height: 900, virtualWidth: 1280, enabled: true }).scaled).toBe(false);
  });
});
