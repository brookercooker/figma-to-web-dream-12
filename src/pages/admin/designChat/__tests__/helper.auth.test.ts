import { expect, it, vi } from "vitest";
vi.mock("@/lib/authGate", () => ({ hasManagerUser: async () => false, SIGN_IN_REQUIRED: "Sign in to load or save this" }));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));
import { postToHelper } from "../helper";
it.each(["/send", "/publish", "/approval", "/content/sync"])("does not send %s without a user", async path => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect(await postToHelper(path)).toEqual({ ok: false, error: "Sign in to load or save this" });
  expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals();
});