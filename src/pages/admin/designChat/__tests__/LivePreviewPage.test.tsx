import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import LivePreviewPage from "../LivePreviewPage";

vi.mock("../../siteManifest", () => ({ loadSiteManifest: async () => ({ pages: [{ path: "/race-test-page", file: "/src/pages/RaceTestPage.tsx" }] }) }));
vi.mock("@/pages/RaceTestPage", () => ({ default: () => <h1>Live race page</h1> }));
afterEach(cleanup);

it("renders an unlisted public page within a Site Manager route without nesting router errors", async () => {
  render(<MemoryRouter initialEntries={["/manage/preview"]}>
    <Routes><Route path="/manage/preview" element={<LivePreviewPage path="/race-test-page" />} /></Routes>
  </MemoryRouter>);
  expect(await screen.findByRole("heading", { name: "Live race page" })).toBeVisible();
});