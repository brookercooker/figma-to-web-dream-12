import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
const signOut = vi.hoisted(() => vi.fn());
vi.mock("@/lib/authGate", () => ({ REQUIRE_LOGIN: false }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }), signOut } } }));
import UsersPage from "../UsersPage";
afterEach(cleanup);
it("shows User Management without redirecting or signing out during review", async () => {
  render(<MemoryRouter><UsersPage /></MemoryRouter>);
  expect(await screen.findByText("User Management")).toBeVisible();
  expect(screen.getByText(/Sign in to load or save this/)).toBeVisible();
  expect(signOut).not.toHaveBeenCalled();
});