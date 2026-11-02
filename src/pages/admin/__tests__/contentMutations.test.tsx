import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useArchiveObject, useRestoreObject, useDeleteObjectPermanent } from "../useObjectRegistry";
import { renameLanding, renameObject } from "../renameHelpers";

const mocks = vi.hoisted(() => ({ notify: vi.fn(), writes: [] as any[], fail: false }));
vi.mock("../designChat/contentSync", () => ({ notifyContentEdited: mocks.notify }));
vi.mock("@/prototype/client", () => ({ supabase: { from: (table: string) => {
  let operation = "select";
  let payload: unknown;
  const chain: any = {
    select: () => chain,
    update: (value: unknown) => { operation = "update"; payload = value; return chain; },
    delete: () => { operation = "delete"; return chain; },
    upsert: (value: unknown) => { operation = "upsert"; payload = value; return chain; },
    eq: () => chain, neq: () => chain, ilike: () => chain, limit: () => chain, single: () => chain,
    then: (resolve: (value: unknown) => void) => {
      if (operation !== "select") mocks.writes.push({ table, operation, payload });
      return Promise.resolve({ data: operation === "select" ? [] : { id: "object", name: "Flyer" }, error: mocks.fail && operation !== "select" ? { message: "Write failed" } : null }).then(resolve);
    },
  };
  return chain;
} } }));
beforeEach(() => { mocks.notify.mockClear(); mocks.writes = []; mocks.fail = false; });
afterEach(cleanup);
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>;
}
describe("public object mutations", () => {
  it.each([
    ["Archived", useArchiveObject], ["Restored", useRestoreObject], ["Deleted", useDeleteObjectPermanent],
  ] as const)("%s objects notify only after success", async (action, hook) => {
    const { result } = renderHook(hook, { wrapper });
    await act(async () => { await result.current.mutateAsync("object"); });
    expect(mocks.notify).toHaveBeenCalledExactlyOnceWith([`${action} the object "Flyer"`]);
  });
  it("failed object archive does not notify", async () => {
    mocks.fail = true;
    const { result } = renderHook(useArchiveObject, { wrapper });
    await act(async () => { await expect(result.current.mutateAsync("object")).rejects.toEqual({ message: "Write failed" }); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("object rename notifies after persistence", async () => {
    await renameObject({ id: "object", newName: "Flyer", newSlug: "flyer" });
    expect(mocks.notify).toHaveBeenCalledExactlyOnceWith(['Renamed the object "Flyer"']);
    expect(mocks.writes).toEqual([{ table: "object_registry", operation: "update", payload: { name: "Flyer", slug_id: "flyer" } }]);
  });
});
describe("page rename and redirects", () => {
  it("queues path rename and every successful redirect action", async () => {
    await renameLanding({ id: "page", currentPath: "/landing/old", newName: "Race Test Page", newSlug: "race-test-page" });
    expect(mocks.notify.mock.calls.map(([notes]) => notes[0])).toEqual([
      'Renamed the page "Race Test Page" (/landing/race-test-page)',
      "Removed any old redirect from /landing/race-test-page",
      "Changed redirects pointing to /landing/old to point to /landing/race-test-page",
      "Added a redirect from /landing/old to /landing/race-test-page",
    ]);
    expect(mocks.writes.map(({ table, operation }) => [table, operation])).toEqual([
      ["pages", "update"], ["page_redirects", "delete"], ["page_redirects", "update"], ["page_redirects", "upsert"],
    ]);
  });
  it("failed page rename does not notify", async () => {
    mocks.fail = true;
    await expect(renameLanding({ id: "page", currentPath: "/landing/old", newName: "Race", newSlug: "race" })).rejects.toEqual({ message: "Write failed" });
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});