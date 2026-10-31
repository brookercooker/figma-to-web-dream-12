import { expect, it, vi } from "vitest";
vi.mock("@/prototype/client", () => ({ supabase: {} }));
import { previewContentPayload } from "../previewContent";
it("preserves the saved Ready /draft Spotlight block and its coded object row", () => {
  const objectId = "dfff040f-a387-494d-af9d-cc10e3955b8e";
  const block = { align: "left", id: "44b108d1-5266-4d39-b37c-ff4c7319c9b0", name: "Example Fixture Spotlight", objectId, type: "object" };
  const snapshot = previewContentPayload([{ path: "/draft", build_status: "ready", content: [block] }], [{ id: objectId, name: "Example Fixture Spotlight", component_key: "ExampleFixtureSpotlight" }]);
  expect(snapshot.pages).toEqual([{ path: "/draft", content: [block], inline_edits: {} }]);
  expect(snapshot.objects[0]).toMatchObject({ id: objectId, component_key: "ExampleFixtureSpotlight" });
});
it("includes only Ready nonarchived visitor pages and all nonarchived objects regardless of status", () => {
  const p = (path: string, build_status = "ready", archived_at: string | null = null) => ({ path, build_status, archived_at, content: [{ id: "placed", type: "object", objectId: "draft-object" }], inline_edits: { "hidden:0": "1" } });
  const o = (id: string, status: string, archived_at: string | null = null) => ({ id, name: id, component_key: "Spotlight", content: [], inline_edits: {}, site_wide: false, status, archived_at });
  const payload = previewContentPayload([p("/"), p("/draft", "draft"), p("/archived", "ready", "date"), p("/__object/123"), p("/manage")], [o("draft-object", "Draft"), o("ready-object", "Ready"), o("archived", "Ready", "date")]);
  expect(payload.pages).toEqual([{ path: "/", content: [{ id: "placed", type: "object", objectId: "draft-object" }], inline_edits: { "hidden:0": "1" } }]);
  expect(payload.objects.map(o => o.id)).toEqual(["draft-object", "ready-object"]);
  expect(Object.keys(payload.objects[0])).toEqual(["id", "name", "component_key", "content", "inline_edits", "site_wide"]);
});