import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import LibraryImageThumbnail from "../LibraryImageThumbnail";
afterEach(cleanup);
it("advances through stored URLs and ends in a neutral placeholder", () => {
  const view = render(<LibraryImageThumbnail candidates={["/web", "/fallback", "/original"]} />);
  for (const url of ["/web", "/fallback", "/original"]) {
    const img = view.container.querySelector("img");
    if (!img) throw new Error("Missing thumbnail");
    expect(img.getAttribute("src")).toBe(url);
    fireEvent.error(img);
  }
  expect(view.container.querySelector("img")).toBeNull();
  expect(view.container.querySelector("svg")).not.toBeNull();
});