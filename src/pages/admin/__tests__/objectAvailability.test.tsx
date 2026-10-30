import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import CreateObjectDialog from "../CreateObjectDialog";
import { useCreateObject } from "../useObjectRegistry";

const db = vi.hoisted(() => ({ inserts: vi.fn() }));
vi.mock("@/prototype/client", () => ({ supabase: { from: () => {
  let patch: Record<string, unknown> = {};
  const q = { select: () => q, is: async () => ({ data: [] }), insert: (value: Record<string, unknown>) => { patch = value; db.inserts(value); return q; }, single: async () => ({ data: { id: "new-object", ...patch }, error: null }) };
  return q;
} } }));
afterEach(cleanup);
beforeEach(() => db.inserts.mockClear());
const wrap = (node: React.ReactNode) => render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{node}</QueryClientProvider></MemoryRouter>);

it("creates a named object with the compatibility value and no status choice", async () => {
  const created = vi.fn();
  wrap(<CreateObjectDialog open onOpenChange={vi.fn()} onCreated={created} />);
  expect(screen.queryByText(/Draft|Ready|Work Status/)).toBeNull();
  fireEvent.change(screen.getByPlaceholderText("e.g. Hot Deal Product"), { target: { value: "New Spotlight" } });
  fireEvent.click(screen.getByRole("button", { name: "Create object" }));
  await waitFor(() => expect(created).toHaveBeenCalledWith(expect.objectContaining({ id: "new-object", name: "New Spotlight", status: "Ready" })));
  expect(db.inserts).toHaveBeenCalledWith(expect.objectContaining({ status: "Ready" }));
});

it("the shared creation hook also writes Ready, never Draft", async () => {
  const created = vi.fn();
  function Create() {
    const mutation = useCreateObject();
    return <button onClick={() => mutation.mutateAsync({ name: "Hook Spotlight" }).then(created)}>Create</button>;
  }
  wrap(<Create />);
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  await waitFor(() => expect(created).toHaveBeenCalledWith(expect.objectContaining({ name: "Hook Spotlight", status: "Ready" })));
});