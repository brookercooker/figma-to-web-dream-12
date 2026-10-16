import { describe, expect, it } from "vitest";
import { addPoint, boxOf, buildMarks, lengthPx, shapeOf, thin, type Stroke } from "../drawing";

describe("drawing", () => {
  it("boxOf is the smallest box around a stroke", () => {
    expect(boxOf([{ x: 0.2, y: 0.4 }, { x: 0.5, y: 0.1 }, { x: 0.3, y: 0.6 }])).toEqual({ x: 0.2, y: 0.1, w: 0.3, h: 0.5 });
    expect(boxOf([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  it("lengthPx tells a drawing from a click", () => {
    expect(lengthPx([{ x: 0.5, y: 0.5 }], 1000, 600)).toBe(0);
    expect(lengthPx([{ x: 0, y: 0 }, { x: 0.1, y: 0 }], 1000, 600)).toBeCloseTo(100);
  });

  it("thin keeps the ends and the order", () => {
    const s: Stroke = Array.from({ length: 1000 }, (_, i) => ({ x: i / 999, y: 0 }));
    const t = thin(s, 50);
    expect(t).toHaveLength(50);
    expect(t[0]).toEqual(s[0]);
    expect(t[49]).toEqual(s[999]);
    expect(thin(s.slice(0, 10), 50)).toHaveLength(10);
  });

  it("addPoint ignores tiny moves and clamps to the sheet", () => {
    const s: Stroke = [{ x: 0.5, y: 0.5 }];
    expect(addPoint(s, { x: 0.5001, y: 0.5 }, 1000, 600)).toBe(false);
    expect(addPoint(s, { x: 1.4, y: -0.2 }, 1000, 600)).toBe(true);
    expect(s[1]).toEqual({ x: 1, y: 0 });
  });

  it("buildMarks combines the strokes with what the site reported, and copes with no answer", () => {
    const strokes: Stroke[] = [[{ x: 0.1, y: 0.1 }, { x: 0.3, y: 0.2 }]];
    const withReply = buildMarks({
      strokes, width: 900.4, height: 600, device: "desktop", path: "/about",
      reply: { view: { scrollY: 120, pageHeight: 2000, width: 900, height: 600 }, strokes: [{ elements: [{ tag: "h1", text: "Our Story" }] }] },
    });
    expect(withReply.width).toBe(900);
    expect(withReply.scrollY).toBe(120);
    expect(withReply.marks[0]).toMatchObject({ x: 0.1, y: 0.1, elements: [{ tag: "h1", text: "Our Story" }] });
    const none = buildMarks({ strokes, width: 900, height: 600, device: "mobile", path: null, reply: null });
    expect(none.scrollY).toBeNull();
    expect(none.marks[0].elements).toEqual([]);
  });

  it("shapeOf tells a line, a ring, a freehand stroke and a dot apart, and levels a nearly straight line", () => {
    const W = 1000, H = 600;
    const wobbly: Stroke = [{ x: 0.1, y: 0.4 }, { x: 0.3, y: 0.405 }, { x: 0.5, y: 0.395 }, { x: 0.7, y: 0.402 }];
    const h = shapeOf(wobbly, W, H);
    expect(h.kind).toBe("line");
    expect(h.direction).toBe("horizontal");
    expect(h.from.y).toBeCloseTo(h.to.y, 10);
    expect(h.from.x).toBe(0.1);
    expect(h.to.x).toBe(0.7);
    const v = shapeOf([{ x: 0.2, y: 0.1 }, { x: 0.203, y: 0.3 }, { x: 0.199, y: 0.6 }], W, H);
    expect(v).toMatchObject({ kind: "line", direction: "vertical" });
    expect(v.from.x).toBeCloseTo(v.to.x, 10);
    expect(shapeOf([{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }], W, H)).toMatchObject({ kind: "line", direction: "diagonal" });
    const ring: Stroke = Array.from({ length: 20 }, (_, i) => ({ x: 0.5 + 0.1 * Math.cos((i / 19) * Math.PI * 2), y: 0.5 + 0.15 * Math.sin((i / 19) * Math.PI * 2) }));
    expect(shapeOf(ring, W, H).kind).toBe("ring");
    const zigzag: Stroke = [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.4 }, { x: 0.3, y: 0.1 }, { x: 0.4, y: 0.4 }, { x: 0.5, y: 0.1 }];
    expect(shapeOf(zigzag, W, H).kind).toBe("squiggle");
    expect(shapeOf([{ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 }], W, H).kind).toBe("dot");
    expect(shapeOf([], W, H).kind).toBe("dot");
  });

  it("buildMarks carries the shape, and what the site found at the ends and beside a line", () => {
    const strokes: Stroke[] = [[{ x: 0.1, y: 0.4 }, { x: 0.4, y: 0.4 }, { x: 0.7, y: 0.4 }]];
    const above = { tag: "h1", text: "Example Header", box: [40, 90, 400, 50] as [number, number, number, number] };
    const out = buildMarks({
      strokes, width: 1000, height: 600, device: "desktop", path: "/",
      reply: { view: { scrollY: 0, pageHeight: 1200, width: 1000, height: 600 }, strokes: [{ elements: [], near: [{ side: "above", element: above }] }] },
    });
    expect(out.marks[0]).toMatchObject({ kind: "line", direction: "horizontal", from: { x: 0.1, y: 0.4 }, to: { x: 0.7, y: 0.4 }, near: [{ side: "above", element: above }] });
    expect(out.marks[0]).not.toHaveProperty("ends");
  });
});
