import { expect, it } from "vitest";
import { frameObjectPaths, rememberFrameObjects } from "../frameObjectUsages";
it("counts coded-page placements from section object IDs and replaces changed snapshots", () => {
  const row = { key: "categories", name: "Categories", kind: "object" as const, objectId: "categories-test", collapsed: false, movable: false, deletable: false };
  rememberFrameObjects("/home", [row]); rememberFrameObjects("/draft", [row]);
  expect(frameObjectPaths("categories-test")).toEqual(["/", "/draft"]);
  rememberFrameObjects("/draft", []);
  expect(frameObjectPaths("categories-test")).toEqual(["/"]);
});