import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const signOut = vi.hoisted(() => vi.fn());
const gate = vi.hoisted(() => ({ require: false }));
vi.mock("@/lib/authGate", () => ({ get REQUIRE_LOGIN() { return gate.require; } }));
vi.mock("@/prototype/client", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }), signOut } } }));
import UsersPage from "../UsersPage";
beforeEach(() => { gate.require = false; signOut.mockReset(); });
afterEach(cleanup);
it("shows User Management without redirecting or signing out during review", async () => {
  render(<MemoryRouter><UsersPage /></MemoryRouter>);
  expect(await screen.findByText("User Management")).toBeVisible();
  expect(screen.getByText(/Sign in to load or save this/)).toBeVisible();
  expect(signOut).not.toHaveBeenCalled();
});
it("restores the original Users redirect and sign-out with login required", async () => {
  gate.require = true;
  render(<MemoryRouter initialEntries={["/manage/users"]}><Routes>
    <Route path="/manage/users" element={<UsersPage />} />
    <Route path="/admin" element={<p>Original admin destination</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("Original admin destination")).toBeVisible();
  expect(signOut).toHaveBeenCalledOnce();
  expect(screen.queryByText("User Management")).toBeNull();
});