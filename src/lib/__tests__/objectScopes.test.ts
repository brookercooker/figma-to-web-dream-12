import { describe, it, expect } from "vitest";
import { findObjectRoots } from "../objectScopes";

const ObjA = () => null;
const ObjB = () => null;
const Other = () => null;

/** Build a tiny fake React fiber tree attached to `root`. */
function setup() {
  const root = document.createElement("div");
  const a = document.createElement("section");
  const b = document.createElement("section");
  const inner = document.createElement("div");
  root.append(a, b);
  a.append(inner);
  const host = (el: HTMLElement, child?: any) => ({ stateNode: el, child, type: el.tagName.toLowerCase() });
  const nestedInA = { type: ObjB, child: host(inner) }; // nested object: should be ignored
  const fiberA = { type: ObjA, child: host(a, nestedInA) };
  const fiberB = { type: { type: ObjB }, child: host(b) }; // memo-wrapped
  fiberA.sibling = { type: Other, child: fiberB } as any;
  (root as any)["__reactFiber$test"] = { child: fiberA };
  return { root, a, b };
}

describe("findObjectRoots", () => {
  it("returns outermost objects, including memo-wrapped ones", () => {
    const { root, a, b } = setup();
    const map = new Map<unknown, string>([[ObjA, "A"], [ObjB, "B"]]);
    const out = findObjectRoots(root, map);
    expect(out).toHaveLength(2);
    expect(out).toEqual(expect.arrayContaining([{ key: "A", el: a }, { key: "B", el: b }]));
  });
  it("returns nothing without a fiber", () => {
    expect(findObjectRoots(document.createElement("div"), new Map())).toEqual([]);
  });
});
