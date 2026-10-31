import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useManagerTitle } from "../useManagerTitle";
it("prevents capture mounts and unmounts from claiming the Manager title", async () => {
  const view = renderHook(({ label }) => useManagerTitle(label), { initialProps: { label: "Pages" } });
  document.title = "New & Now · Nova Lighting";
  expect(document.title).toBe("Pages · Site Manager");
  await act(async () => { const title = document.querySelector("title"); if (title) title.textContent = "The Outdoor Edit · Nova Lighting"; await Promise.resolve(); });
  expect(document.querySelector("title")?.textContent).toBe("Pages · Site Manager");
  view.rerender({ label: "Preview" });
  document.title = "Restored visitor title";
  expect(document.title).toBe("Preview · Site Manager");
  view.unmount();
});