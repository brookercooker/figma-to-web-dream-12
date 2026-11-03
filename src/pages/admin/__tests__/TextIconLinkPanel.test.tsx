import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import TextIconLinkPanel from "../TextIconLinkPanel";
import { remoteSelection } from "../remoteSelection";
import { ManualEditHistory } from "../designChat/manualEditHistory";
import type { InlineEdits } from "@/lib/inlineEditCore";

beforeEach(() => vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function setup(tag = "h2", initial: InlineEdits = {}) {
  const sel = remoteSelection({ key: "0", scope: "page", kind: "text", tag, text: "Nova" });
  const change = vi.fn();
  function Panel() { const [edits, set] = useState(initial); return <TextIconLinkPanel sel={sel} edits={edits} onChange={next => { change(next); set(next); }} />; }
  render(<Panel />);
  const header = screen.getByRole("button", { name: "Icon None" });
  expect(header).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("textbox", { name: "Link Address" })).toBeNull();
  fireEvent.click(header);
  fireEvent.click(screen.getByRole("button", { name: "Link None" }));
  expect(screen.getByRole("button", { name: "No Icon" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("textbox", { name: "Link Address" })).toHaveAttribute("placeholder", "None");
  return { change };
}
it.each(["h1", "h2", "p", "button", "label"])("supports icons and links on a %s", tag => {
  const { change } = setup(tag);
  fireEvent.click(screen.getByRole("button", { name: "Mail" }));
  expect(change).toHaveBeenLastCalledWith({ "icon:0": "Mail" });
  fireEvent.click(screen.getByRole("button", { name: "Before Text" }));
  expect(change.mock.lastCall?.[0]["icon-position:0"]).toBe("before");
  const address = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(address, { target: { value: "/about" } }); fireEvent.keyDown(address, { key: "Enter" });
  expect(JSON.parse(change.mock.lastCall?.[0]["link:0"])).toEqual({ href: "/about" });
  fireEvent.click(screen.getByRole("switch", { name: "Open in New Tab" }));
  expect(JSON.parse(change.mock.lastCall?.[0]["link:0"])).toEqual({ href: "/about", target: "_blank" });
  fireEvent.click(screen.getByRole("button", { name: "Icon" }));
  expect(screen.getByRole("button", { name: "Icon Mail" })).toHaveAttribute("aria-expanded", "false");
});
it.each(["javascript:bad()", "http://example.com", "//example.com", "ftp://example.com"])("shows an inline error and never saves %s", address => {
  const { change } = setup(); const field = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(field, { target: { value: address } }); fireEvent.blur(field);
  expect(screen.getByRole("alert")).toBeInTheDocument(); expect(change).not.toHaveBeenCalled();
});
it("clears icon/link values through existing undo and redo snapshots", () => {
  const { change } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Mail" }));
  const before = { blocks: [], inlineEdits: change.mock.lastCall?.[0] as InlineEdits, objectEdits: {} };
  fireEvent.click(screen.getByRole("button", { name: "No Icon" }));
  const after = { ...before, inlineEdits: change.mock.lastCall?.[0] as InlineEdits };
  const history = new ManualEditHistory(); history.record(before, after, { label: "icon removed" });
  expect(history.undo()?.inlineEdits).toEqual({ "icon:0": "Mail" });
  expect(history.redo()?.inlineEdits).toEqual({ "icon:0": "none" });
  const address = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(address, { target: { value: "/about" } }); fireEvent.blur(address);
  fireEvent.change(address, { target: { value: "" } }); fireEvent.blur(address);
  expect(JSON.parse(change.mock.lastCall?.[0]["link:0"])).toEqual({ unlinked: true });
});
it("uses an existing link ancestor's independent scope and path", () => {
  const sel = remoteSelection({ key: "0.1", scope: "page", kind: "text", tag: "span", text: "Nova", link: { key: "2", scope: "Header", tag: "a", attrs: { href: "/old" } } });
  const change = vi.fn(); render(<TextIconLinkPanel sel={sel} edits={{}} onChange={vi.fn()} editsFor={() => ({})} onScopeChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Link /old" }));
  const field = screen.getByRole("textbox", { name: "Link Address" }); fireEvent.change(field, { target: { value: "/new" } }); fireEvent.blur(field);
  expect(change).toHaveBeenCalledWith("Header", { "link:2": JSON.stringify({ href: "/new" }) });
});
it.each(["home", "arrow_forward", "123", "Home"])("accepts pasted Google icon name %s", name => {
  const { change } = setup();
  fireEvent.change(screen.getByLabelText("Paste a Google Icon"), { target: { value: name } });
  expect(change.mock.lastCall?.[0]["icon:0"]).toBe(`material:outlined:${name.toLowerCase()}`);
});
it.each(["two words", "home-foo", "home()", '<span>home</span>'])("rejects pasted icon name %s without editing", name => {
  const { change } = setup();
  fireEvent.change(screen.getByLabelText("Paste a Google Icon"), { target: { value: name } });
  expect(screen.getByRole("alert")).toBeVisible(); expect(change).not.toHaveBeenCalled();
});
it("None in Link removes the scoped link and reflects its state", () => {
  const { change } = setup(); const field = screen.getByRole("textbox", { name: "Link Address" });
  fireEvent.change(field, { target: { value: "/about" } }); fireEvent.blur(field);
  fireEvent.focus(field); fireEvent.click(screen.getByRole("button", { name: /^None$/ }));
  expect(JSON.parse(change.mock.lastCall?.[0]["link:0"])).toEqual({ unlinked: true });
  fireEvent.focus(field); expect(screen.getByRole("button", { name: /^None$/ })).toHaveAttribute("aria-pressed", "true");
});
