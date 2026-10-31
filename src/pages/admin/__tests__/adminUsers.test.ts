import { beforeEach, describe, expect, it, vi } from "vitest";
import { callAdminUsers } from "../adminUsers";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { functions: { invoke } } }));
beforeEach(() => invoke.mockReset());
describe("User Management requests", () => {
  it("lists users with GET rather than an empty POST", async () => {
    invoke.mockResolvedValue({ data: { users: [{ id: "user-1" }] }, error: null });
    expect(await callAdminUsers()).toEqual({ users: [{ id: "user-1" }] });
    expect(invoke).toHaveBeenCalledWith("admin-users", { method: "GET" });
  });
  it("retains POST for user actions", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });
    const body = { action: "set_admin", user_id: "user-1", is_admin: true };
    await callAdminUsers(body);
    expect(invoke).toHaveBeenCalledWith("admin-users", { method: "POST", body });
  });
  it("surfaces the returned error instead of the generic non-2xx message", async () => {
    invoke.mockResolvedValue({ error: { message: "Edge Function returned a non-2xx status code", context: new Response(JSON.stringify({ error: "Password must be at least 8 characters." }), { status: 400 }) } });
    await expect(callAdminUsers()).rejects.toThrow("Password must be at least 8 characters.");
  });
  it("explains a rejected admin role without weakening authorization", async () => {
    invoke.mockResolvedValue({ error: { context: new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }) } });
    await expect(callAdminUsers()).rejects.toThrow("You need an admin account to manage users.");
  });
});