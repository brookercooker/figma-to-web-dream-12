import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupObjectCopies } from "../objectCopyCleanup";
const mocks = vi.hoisted(() => ({ pages: [] as unknown[], deleted: vi.fn(), fail: false }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => ({
  select: async () => ({ data: mocks.pages, error: null }),
  delete: () => ({ in: (_key: string, ids: string[]) => ({ then: (resolve: (value: unknown) => void) => {
    mocks.deleted(table, ids);
    resolve({ error: mocks.fail ? { message: "failed" } : null });
  } }) }),
}) } }));
beforeEach(() => { mocks.pages = []; mocks.fail = false; mocks.deleted.mockClear(); });
describe("page copy cleanup", () => {
  it.each(["Discard", "leave without saving", "undo copy then save"])("%s executes the delete for an unreferenced coded-slot copy", async () => {
    mocks.pages = [{ content: null, inline_edits: {} }];
    expect(await cleanupObjectCopies(["9b18c8f6-3ff8-442a-a653-a6219212abdd"])).toEqual(["9b18c8f6-3ff8-442a-a653-a6219212abdd"]);
    expect(mocks.deleted).toHaveBeenCalledWith("object_registry", ["9b18c8f6-3ff8-442a-a653-a6219212abdd"]);
  });
  it("keeps copies referenced by any saved page's content or swaps", async () => {
    mocks.pages = [{ content: [{ type: "object", objectId: "block-copy" }], inline_edits: { "objectSwap:code:home-categories": "slot-copy" } }];
    expect(await cleanupObjectCopies(["block-copy", "slot-copy", "unused"])).toEqual(["unused"]);
    expect(mocks.deleted).toHaveBeenCalledWith("object_registry", ["unused"]);
  });
  it("reports deletion failures instead of forgetting the pending copies", async () => {
    mocks.fail = true;
    await expect(cleanupObjectCopies(["unused"])).rejects.toThrow("Couldn't remove");
  });
});