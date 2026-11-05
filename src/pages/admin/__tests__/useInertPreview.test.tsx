import { act, cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, it } from "vitest";
import { useInertPreview } from "../useInertPreview";
afterEach(cleanup);
it("removes existing and asynchronously added preview controls from tab order", async () => {
  function Preview() { const ref = useRef<HTMLDivElement>(null); useInertPreview(ref); return <div ref={ref}><a href="/">Link</a><button>Menu</button></div>; }
  const view = render(<Preview />);
  const root = view.container.firstElementChild;
  expect(root?.hasAttribute("inert")).toBe(true);
  expect(root?.getAttribute("aria-hidden")).toBe("true");
  expect(root?.querySelector("a")?.tabIndex).toBe(-1);
  await act(async () => { const button = document.createElement("button"); root?.append(button); });
  expect([...view.container.querySelectorAll("button")].every(button => button.tabIndex === -1)).toBe(true);
});