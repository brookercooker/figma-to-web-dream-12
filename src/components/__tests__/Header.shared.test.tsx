import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import Header from "../Header";
import InlineEditSurface, { type InlineEditController } from "../InlineEditSurface";
import InlineEditsLayer from "../InlineEditsLayer";
import SharedObjectNotice from "@/pages/admin/SharedObjectNotice";
import { loadObjectComponents } from "@/lib/objectScopes";
import { objectRegistry } from "../objects/registry";
import type { InlineEdits } from "@/lib/inlineEditCore";

const database = vi.hoisted(() => ({ edits: {} as Record<string, string>, pageReads: vi.fn() }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ count: 0 }) }));
vi.mock("@/lib/db", () => ({ supabase: { from: (table: string) => {
  const result = { data: table === "object_registry" ? [{ component_key: "Header", inline_edits: database.edits }] : null };
  if (table === "pages") database.pageReads();
  const query: any = { select: () => query, eq: () => query, is: () => query, maybeSingle: () => Promise.resolve(result), then: (resolve: any) => Promise.resolve(result).then(resolve) };
  return query;
} } }));
afterEach(() => { cleanup(); database.edits = {}; database.pageReads.mockClear(); });

describe("shared Header", () => {
  it("registers the real Header component under the same fiber key exposed to Objects", async () => {
    expect(objectRegistry.Header).toBeDefined();
    expect((await loadObjectComponents()).get(Header)).toBe("Header");
  });
  it("keeps navigation wording and the logo selectable in Header scope and blocks visitor menus/actions", async () => {
    const select = vi.fn(), change = vi.fn();
    const view = render(<MemoryRouter><InlineEditSurface edits={{}} editing sections={false} onSelect={select} onChange={change}><Header /></InlineEditSurface></MemoryRouter>);
    const locations = screen.getByText("Locations");
    await waitFor(() => expect(locations).toHaveAttribute("data-inline-editable"));
    fireEvent.click(locations);
    expect(select.mock.lastCall?.[0].scope).toBe("Header");
    expect(select.mock.lastCall?.[0].link.scope).toBe("Header");
    fireEvent.click(screen.getAllByAltText("Nova Lighting")[0]);
    expect(select.mock.lastCall?.[0]).toMatchObject({ scope: "Header", kind: "image" });
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Menu", { exact: true })).toBeNull();
    fireEvent.mouseOver(screen.getByRole("button", { name: "Ceiling Lights" }));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 180)); });
    expect(view.container.querySelector('[class*="top-full"]')).toBeNull();
    locations.innerHTML = "Our Locations"; fireEvent.input(locations);
    expect(change.mock.lastCall?.[0]).toBe("Header");
    expect(Object.keys(change.mock.lastCall?.[1] ?? {}).some((key) => key.startsWith("fp:"))).toBe(true);
  });
  it("reapplies fingerprinted Header text and destinations on two pages through objects-only InlineEditsLayer", async () => {
    const api = { current: null as InlineEditController | null };
    const original = render(<MemoryRouter><InlineEditSurface edits={{}} sections={false} apiRef={api}><Header /></InlineEditSurface></MemoryRouter>);
    await act(async () => { await loadObjectComponents(); });
    const root = original.container.querySelector("header");
    const locations = screen.getByText("Locations");
    if (!root) throw Error("Missing header");
    const { pathOf } = await import("../InlineEditSurface");
    database.edits = api.current?.prepare("Header", { [pathOf(root, locations)]: "Our Locations", [`link:${pathOf(root, locations)}`]: JSON.stringify({ href: "/team" }) }) ?? {};
    original.unmount();
    const view = render(<MemoryRouter><InlineEditsLayer path="/about" objectsOnly><Header /></InlineEditsLayer></MemoryRouter>);
    await screen.findByText("Our Locations");
    expect(screen.getByText("Our Locations")).toHaveAttribute("href", "/team");
    view.rerender(<MemoryRouter><InlineEditsLayer path="/team" objectsOnly><Header /></InlineEditsLayer></MemoryRouter>);
    await screen.findByText("Our Locations");
    expect(screen.getByText("Our Locations")).toHaveAttribute("href", "/team");
    expect(database.pageReads).not.toHaveBeenCalled();
  });
  it("shows the shared-header notice before a manual change is staged", async () => {
    function Canvas() {
      const [edits, setEdits] = useState<InlineEdits>({});
      return <><SharedObjectNotice componentKey="Header" /><InlineEditSurface editing edits={{}} objectEdits={{ Header: edits }} sections={false} onChange={(_, next) => setEdits(next)}><Header /></InlineEditSurface></>;
    }
    render(<MemoryRouter><Canvas /></MemoryRouter>);
    const notice = screen.getByRole("note");
    const locations = screen.getByText("Locations");
    expect(notice).toHaveTextContent("This edit changes the header on every page");
    await waitFor(() => expect(locations).toHaveAttribute("data-inline-editable"));
    locations.innerHTML = "Our Locations"; fireEvent.input(locations);
    expect(notice.compareDocumentPosition(locations) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
