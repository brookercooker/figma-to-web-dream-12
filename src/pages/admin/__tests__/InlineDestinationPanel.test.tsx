import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import InlineDestinationPanel from "../InlineDestinationPanel";
import { createReplay, type InlineEdits } from "@/lib/inlineEditCore";
import type { InlineSelection } from "@/components/InlineEditSurface";
afterEach(cleanup);
function setup(tag = "a") {
  const root = document.createElement("section"), el = document.createElement(tag);
  if (tag === "a") el.setAttribute("href", "/original");
  el.textContent = "Explore"; root.append(el);
  const selection: InlineSelection = { key: "0", kind: "text", el, scope: "page", ...(tag !== "h3" ? { link: { key: "0", el, scope: "page" } } : {}) };
  const change = vi.fn(), replay = createReplay(); replay.apply(root, {});
  function Panel() {
    const [edits, setEdits] = useState<InlineEdits>({});
    return <InlineDestinationPanel selection={selection} pages={[{ id: "1", name: "Lighting", path: "/lighting" }]} editsFor={() => edits} onChange={(scope, next) => { change(scope, next); setEdits(next); replay.apply(root, next); }} />;
  }
  render(<Panel />); return { el, change };
}
it.each(["a", "button"])("edits %s without changing its appearance and restores/off works", (tag) => {
  const { el, change } = setup(tag), children = el.firstChild;
  const field = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(field, { target: { value: "/lighting" } }); fireEvent.keyDown(field, { key: "Enter" });
  expect(JSON.parse(change.mock.lastCall?.[1]["link:0"])).toEqual({ href: "/lighting" });
  fireEvent.click(screen.getByRole("switch", { name: "Open in New Tab" }));
  expect(JSON.parse(change.mock.lastCall?.[1]["link:0"])).toEqual({ href: "/lighting", target: "_blank" });
  fireEvent.click(screen.getByRole("button", { name: "Turn Link Off" }));
  expect(el.getAttribute("data-inline-link")).toBe("off"); expect(el.firstChild).toBe(children);
  fireEvent.click(screen.getByRole("button", { name: "Restore Original Link" }));
  expect(change.mock.lastCall?.[1]).toEqual({}); expect(el.getAttribute("href")).toBe(tag === "a" ? "/original" : null);
  expect(el.getAttribute("data-inline-link")).toBeNull();
});
it("does not show link tools for a heading", () => { setup("h3"); expect(screen.queryByRole("textbox", { name: "Link Address" })).toBeNull(); });
it("rejects invalid addresses without saving and applies on blur", () => {
  const { change } = setup(), field = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(field, { target: { value: "javascript:bad()" } }); fireEvent.blur(field);
  expect(screen.getByRole("alert")).toBeInTheDocument(); expect(change).not.toHaveBeenCalled();
  fireEvent.change(field, { target: { value: "https://example.com" } }); fireEvent.blur(field);
  expect(JSON.parse(change.mock.lastCall?.[1]["link:0"]).href).toBe("https://example.com");
});
it.each([["Email", "mailto:staff@example.com", "staff@example.com"], ["Phone", "tel:+15555555555", "+15555555555"]])("provides the %s prefix", (helper, href, input) => {
  const { change } = setup("button"), field = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(field, { target: { value: input } }); fireEvent.click(screen.getByRole("button", { name: helper }));
  expect(field).toHaveValue(href); fireEvent.blur(field);
  expect(JSON.parse(change.mock.lastCall?.[1]["link:0"]).href).toBe(href);
});