import { expect, it, vi } from "vitest";
vi.mock("@/lib/authGate", () => ({ SIGN_IN_REQUIRED: "Sign in to load or save this" }));
import { reviewClient } from "./reviewClient";
it.each(["insert", "update", "upsert", "delete"])("blocks signed-out %s at execution including lifecycle writes", async method => {
  const executed = vi.fn();
  const builder: any = { then: (resolve: any) => { executed(); resolve({ data: [], error: null }); }, eq: () => builder, select: () => builder };
  builder[method] = () => builder;
  const client = reviewClient({ from: () => builder }, async () => false);
  expect((await client.from("pages")[method]({}).eq("id", "p").select()).error.message).toBe("Sign in to load or save this");
  expect(executed).not.toHaveBeenCalled();
});
it("retains reads and signed-in writes", async () => {
  const builder: any = { then: (resolve: any) => resolve({ data: ["row"], error: null }), select: () => builder, update: () => builder };
  expect((await reviewClient({ from: () => builder }, async () => false).from("pages").select()).data).toEqual(["row"]);
  expect((await reviewClient({ from: () => builder }, async () => true).from("pages").update({})).data).toEqual(["row"]);
});
it("blocks function actions and file uploads without a user", async () => {
  const invoke = vi.fn(), upload = vi.fn();
  const client = reviewClient({ functions: { invoke }, storage: { from: () => ({ upload }) } }, async () => false);
  expect((await client.functions.invoke("action")).error.message).toBe("Sign in to load or save this");
  expect((await client.storage.from("images").upload("x", {})).error.message).toBe("Sign in to load or save this");
  expect(invoke).not.toHaveBeenCalled(); expect(upload).not.toHaveBeenCalled();
});