import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/prototype/client";
import { CartProvider } from "@/contexts/CartContext";

// The real screens running on the prototype's in-memory data. Thumbnail capture and the page thumbnails are stubbed: they
// need a real browser.
vi.mock("../useThumbnailCapture", async (orig) => ({ ...(await orig<any>()), useAutoCaptureThumbnails: () => {}, regenerateThumbnail: async () => {} }));
vi.mock("../PageMiniPreview", () => ({ default: () => null }));
vi.mock("../useAssetPageUsages", () => ({ useImagePageUsages: () => ({ data: new Map() }), useVideoPageUsages: () => ({ data: new Map() }) }));

import PagesTab from "../PagesTab";
import DesignTab from "../DesignTab";

beforeAll(() => {
  class Obs { observe() {} unobserve() {} disconnect() {} }
  vi.stubGlobal("IntersectionObserver", Obs);
  vi.stubGlobal("ResizeObserver", Obs);
  Element.prototype.scrollIntoView = () => {};
});

const wrap = (url: string, ui: JSX.Element) => (
  <QueryClientProvider client={new QueryClient()}>
    <TooltipProvider>
      <CartProvider>
        <MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const idOf = async (path: string) => {
  const { data } = await (supabase as any).from("pages").select("id,path").eq("path", path).maybeSingle();
  return data.id as string;
};

describe("Pages tab: main-site pages", () => {
  it("offers no way to add a page, and tweaks only pages built in code", async () => {
    render(wrap("/manage/pages", <PagesTab />));
    await screen.findByText("About");
    expect(screen.queryByText(/add new page/i)).toBeNull();
    expect(screen.getByRole("button", { name: /tweak pages/i })).toBeInTheDocument();
    // Pages built in code get the pencil (pages that are not built in code get none; see pagePolicy.test.ts).
    const dataRows = screen.getAllByRole("row").filter((r) => within(r).queryByRole("button", { name: "More actions" }));
    const pencils = dataRows.filter((r) => within(r).queryByRole("button", { name: "Tweak design" }));
    const about = dataRows.find((r) => within(r).queryByText("About"))!;
    expect(within(about).getByRole("button", { name: "Tweak design" })).toBeInTheDocument();
    expect(pencils.length).toBeGreaterThan(0);
  });

  it("has no archive or delete in a page's menu", async () => {
    render(wrap("/manage/pages", <PagesTab />));
    await screen.findByText("About");
    const about = screen.getAllByRole("row").find((r) => within(r).queryByText("About"))!;
    fireEvent.keyDown(within(about).getByRole("button", { name: "More actions" }), { key: "Enter" });
    await screen.findByText("Regenerate thumbnail");
    expect(screen.queryByText("Delete")).toBeNull();
    expect(screen.queryByText("Archive")).toBeNull();
  });
});

describe("Page designer", () => {
  it("lets a main-site page be tweaked but not restructured", async () => {
    const id = await idOf("/about");
    render(wrap(`/manage/design?page=${id}`, <DesignTab />));
    await screen.findByRole("heading", { name: "About" });
    await waitFor(() => expect(screen.getByRole("button", { name: /tweak/i })).toBeInTheDocument());
    expect(screen.getByText(/can change colours, sizes and pictures/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new page/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Object" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Image" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Video" })).toBeNull();
  });

  it("only offers delete on landing pages in the page list", async () => {
    const id = await idOf("/about");
    render(wrap(`/manage/design?page=${id}`, <DesignTab />));
    await screen.findByRole("heading", { name: "About" });
    const deletes = screen.getAllByTitle("Delete page");
    // Landing pages in the seed: 5. Nothing else may be deletable.
    expect(deletes.length).toBe(5);
  });

  it("gives a landing page the full editor", async () => {
    const id = await idOf("/landing/summer-sale");
    render(wrap(`/manage/design?page=${id}`, <DesignTab />));
    await screen.findByRole("heading", { name: "Summer Sale 2026", level: 2 });
    expect(screen.getByRole("button", { name: "Object" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Image" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Video" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByText(/main-site page/i)).toBeNull();
  });
});
