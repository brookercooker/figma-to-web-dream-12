import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ require: false, session: null as any, rpc: vi.fn(), invoke: vi.fn() }));
vi.mock("@/lib/authGate", () => ({ get REQUIRE_LOGIN() { return m.require; } }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: {
  getSession: async () => ({ data: { session: m.session } }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
}, rpc: m.rpc, functions: { invoke: m.invoke } } }));
vi.mock("../AdminAuth", () => ({ default: () => <div>Original Login Page</div> }));
vi.mock("../AdminIndex", () => ({ default: () => <div>Manager</div> }));
import AdminGate from "../AdminGate";
beforeEach(() => { m.require = false; m.session = null; vi.clearAllMocks(); });
afterEach(cleanup);
it("renders a guarded screen signed out when the switch is off without bootstrap writes", async () => {
  render(<AdminGate><div>Guarded Screen</div></AdminGate>);
  expect(screen.getByText("Guarded Screen")).toBeInTheDocument();
  expect(await screen.findByRole("status")).toHaveTextContent("Login is turned off for review. Saving and sending requests need a sign-in.");
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.invoke).not.toHaveBeenCalled();
});
it("restores the original signed-out login behavior when on", async () => {
  m.require = true;
  render(<AdminGate><div>Guarded Screen</div></AdminGate>);
  expect(await screen.findByText("Original Login Page")).toBeInTheDocument();
  expect(screen.queryByText("Guarded Screen")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
it("preserves signed-in staff access with login required and no review banner", async () => {
  m.require = true;
  m.session = { user: { id: "staff" } };
  m.rpc.mockResolvedValue({ data: true, error: null });
  render(<AdminGate><div>Guarded Screen</div></AdminGate>);
  expect(await screen.findByText("Guarded Screen")).toBeInTheDocument();
  expect(m.rpc).toHaveBeenCalledWith("is_site_user");
  expect(screen.queryByRole("status")).toBeNull();
  expect(m.invoke).not.toHaveBeenCalled();
});
it("preserves the original denied-staff check with login required", async () => {
  m.require = true;
  m.session = { user: { id: "non-staff" } };
  m.rpc.mockResolvedValue({ data: false, error: null });
  m.invoke.mockResolvedValue({});
  render(<AdminGate><div>Guarded Screen</div></AdminGate>);
  expect(await screen.findByText(/Your account doesn't have access/)).toBeInTheDocument();
  expect(m.invoke).toHaveBeenCalledWith("admin-bootstrap");
  expect(screen.queryByText("Guarded Screen")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
});
it("does not show the review banner with a user", async () => {
  m.session = { user: { id: "user" } };
  render(<AdminGate><div>Guarded Screen</div></AdminGate>);
  await vi.waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.getByText("Guarded Screen")).toBeInTheDocument();
});
it("retains access to the original login page from review", async () => {
  render(<AdminGate><div>Guarded Screen</div></AdminGate>);
  fireEvent.click(await screen.findByRole("button", { name: "Sign In" }));
  expect(screen.getByText("Original Login Page")).toBeInTheDocument();
});