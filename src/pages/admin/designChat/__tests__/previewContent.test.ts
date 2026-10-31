import { expect, it, vi } from "vitest";
vi.mock("@/prototype/client", () => ({ supabase: {} }));
import { previewContentPayload } from "../previewContent";
it("includes only Ready nonarchived visitor pages and all nonarchived objects regardless of status", () => {
  const p = (path: string, build_status = "ready", archived_at: string | null = null) => ({ path, build_status, archived_at, content: [{ id: "placed", type: "object", objectId: "draft-object" }], inline_edits: { "hidden:0": "1" } });
  const o = (id: string, status: string, archived_at: string | null = null) => ({ id, name: id, component_key: "Spotlight", content: [], inline_edits: {}, site_wide: false, status, archived_at });
  const payload = previewContentPayload([p("/"), p("/draft", "draft"), p("/archived", "ready", "date"), p("/__object/123"), p("/manage")], [o("draft-object", "Draft"), o("ready-object", "Ready"), o("archived", "Ready", "date")]);
  expect(payload.pages).toEqual([{ path: "/", content: [{ id: "placed", type: "object", objectId: "draft-object" }], inline_edits: { "hidden:0": "1" } }]);
  expect(payload.objects.map(o => o.id)).toEqual(["draft-object", "ready-object"]);
  expect(Object.keys(payload.objects[0])).toEqual(["id", "name", "component_key", "content", "inline_edits", "site_wide"]);
});