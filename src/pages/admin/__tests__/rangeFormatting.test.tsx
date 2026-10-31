import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import FramedPageEditor from "../FramedPageEditor";
import InlineStylePanel from "../InlineStylePanel";
import { remoteFormatting, remoteSelection, validSnapshot, type SelectionSnapshot } from "../remoteSelection";
import { selectionDescription } from "../selectionDescription";
import SelectionColourPicker from "../SelectionColourPicker";
import { selectionColourDisplay } from "../selectionColourDisplay";
import { inheritedFont } from "../designChat/fontOptions";

afterEach(cleanup);
const publicSelect = { source: "nova-site", type: "edit-select", selection: { key: "0.0.2.0", scope: "page", kind: "text", tag: "h1", text: "Light transforms everything.", context: { section: "Light transforms everything.", role: "heading" }, html: 'Light<br><span class="italic">…' } };
const publicRange = { source: "nova-site", type: "edit-range", scope: "page", key: "0.0.2.0", collapsed: false, text: "transforms", marks: { bold: false, italic: true, underline: false, strike: false, color: "rgb(255, 255, 255)", size: "88px", weight: "300", font: '"Cormorant Garamond", …' } };
it("opens the selection with the exact public payload and keeps it selected when range marks arrive", () => {
  const select = vi.fn(); const view = render(<FramedPageEditor base="https://public.example.com" path="/" edits={{}} objectEdits={{}} collapsed={new Set()} selectedKey={null} onSelect={select} onChange={vi.fn()} onToggle={vi.fn()} onReorder={vi.fn()} onOpenObject={vi.fn()} />);
  const source = view.container.querySelector("iframe")?.contentWindow;
  if (!source) throw new Error("Missing frame");
  const send = (data: unknown) => act(() => window.dispatchEvent(new MessageEvent("message", { origin: "https://public.example.com", source, data })));
  send({ source: "nova-site", type: "edit-ready", capabilities: { rangeFormatting: true } });
  send(publicSelect);
  expect(select).toHaveBeenCalledTimes(1);
  const selected = select.mock.calls.at(-1)?.[0];
  expect(selected).toMatchObject({ key: "0.0.2.0", kind: "text", scope: "page" });
  expect(selectionDescription(selected)).toMatchObject({ title: "“Light transforms everything.”", subtitle: "Heading · Light transforms everything. section" });
  send(publicRange);
  const updated = select.mock.calls.at(-1)?.[0];
  expect(updated).toMatchObject({ key: selected.key, kind: selected.kind, scope: selected.scope });
  expect(select.mock.calls.every(([selection]) => selection !== null)).toBe(true);
  expect(remoteFormatting(updated.el)?.range?.marks).toEqual(publicRange.marks);
  send({ ...publicRange, key: "0.1" });
  expect(select).toHaveBeenCalledTimes(2);
  render(<InlineStylePanel sel={updated} edits={{}} onChange={vi.fn()} onReplaceImage={vi.fn()} />);
  expect(screen.getByRole("button", { name: /^Italic$/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("Size (px)")).toHaveValue(88);
  expect(screen.getByRole("combobox", { name: "Font" })).toHaveTextContent("Cormorant Garamond");
});
it.each([
  ["text", "h1"], ["image", "img"], ["text", "a"], ["text", "button"], ["input", "input"], ["field", "input"], ["video", "video"],
])("accepts structured context for %s selections on %s", (kind, tag) => {
  expect(validSnapshot({ ...publicSelect.selection, kind, tag })).toBe(true);
});
it("maps computed RGB and font stacks for display without rejecting unknown values", () => {
  document.documentElement.style.setProperty("--nova-cream", "0 0% 100%");
  document.documentElement.style.setProperty("--nova-ink", "0 0% 13%");
  expect(selectionColourDisplay(publicRange.marks.color)).toMatchObject({ token: "cream", name: "Cream", hex: "#ffffff" });
  expect(selectionColourDisplay("rgb(34, 34, 34)")).toMatchObject({ token: "ink" });
  expect(selectionColourDisplay("rebeccapurple").name).toBe("rebeccapurple");
  expect(inheritedFont(publicRange.marks.font, "h1").name).toBe("Cormorant Garamond");
  expect(inheritedFont('"Custom Font", sans-serif', "h1").name).toBe("Custom Font");
  document.documentElement.style.removeProperty("--nova-cream");
  document.documentElement.style.removeProperty("--nova-ink");
});
const snapshot: SelectionSnapshot = { key: "0", scope: "object:categories", kind: "text", tag: "h2", html: "Light<strong>transforms</strong>everything.", text: "Light transforms everything.", context: "Heading · Light transforms everything. section", rect: {}, style: { fontSize: "40px", fontWeight: "400", textDecorationLine: "none" } };
const marks = { bold: true, italic: false, underline: false, strike: false, color: "#212121", size: 20, weight: 700, font: "Figtree" };
it("formats only matching trusted capable ranges and rejects stale commands", () => {
  const select = vi.fn(); const view = render(<FramedPageEditor base="https://public.example.com" path="/draft" edits={{}} objectEdits={{}} collapsed={new Set()} selectedKey={null} onSelect={select} onChange={vi.fn()} onToggle={vi.fn()} onReorder={vi.fn()} onOpenObject={vi.fn()} />);
  const frame = view.container.querySelector("iframe"); const source = frame?.contentWindow;
  if (!source) throw new Error("Missing frame");
  const post = vi.spyOn(source, "postMessage").mockImplementation(() => {});
  const send = (type: string, payload = {}, origin = "https://public.example.com", from: MessageEventSource = source) => act(() => window.dispatchEvent(new MessageEvent("message", { origin, source: from, data: { source: "nova-site", type, ...payload } })));
  send("edit-ready", { capabilities: { rangeFormatting: true } }); send("edit-select", { selection: snapshot });
  const range = { key: "0", scope: snapshot.scope, collapsed: false, text: "transforms", marks };
  send("edit-range", range, "https://evil.example"); send("edit-range", range, "https://public.example.com", window); send("edit-range", { ...range, scope: "page" }); send("edit-range", { ...range, marks: { ...marks, bold: "yes" } });
  expect(select).toHaveBeenCalledTimes(1);
  send("edit-range", range);
  const selection = select.mock.calls.at(-1)?.[0]; const words = remoteFormatting(selection.el);
  words?.format("color", "#853732");
  expect(post).toHaveBeenCalledWith({ source: "nova-manager", type: "edit-format", key: "0", scope: snapshot.scope, command: "color", value: "#853732" }, "https://public.example.com");
  send("edit-select", { selection: null }); post.mockClear(); words?.format("bold"); expect(post).not.toHaveBeenCalled();
});
it("unsupported frames use whole-element styles even when edit-range is posted", () => {
  const change = vi.fn(); render(<InlineStylePanel sel={remoteSelection(snapshot)} edits={{}} onChange={change} onReplaceImage={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Bold" }));
  expect(change).toHaveBeenCalledWith({ "style:0": JSON.stringify({ "font-weight": "700" }) });
});
it("uses frame plaintext spacing and context instead of concatenated markup", () => {
  expect(selectionDescription(remoteSelection(snapshot))).toEqual({ title: "“Light transforms everything.”", subtitle: snapshot.context, thumbnail: undefined });
  expect(selectionDescription(remoteSelection({ ...snapshot, kind: "image", tag: "img", text: "", attrs: { src: "/outdoor-lamp.jpg" }, context: "Picture · Outdoor Oasis section" }))).toEqual({ title: "outdoor-lamp.jpg", subtitle: "Picture · Outdoor Oasis section", thumbnail: "/outdoor-lamp.jpg" });
});
it("colour selection supports custom valid hex and inheritance", () => {
  const change = vi.fn(); render(<SelectionColourPicker value="#212121" onChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Colour" }));
  fireEvent.change(screen.getByLabelText("Custom Colour (Hex)"), { target: { value: "invalid" } }); expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Custom Colour (Hex)"), { target: { value: "#abc123" } }); fireEvent.click(screen.getByRole("button", { name: "Apply" })); expect(change).toHaveBeenLastCalledWith("#abc123");
  fireEvent.click(screen.getByRole("button", { name: "Colour" })); fireEvent.click(screen.getByRole("button", { name: "Default" })); expect(change).toHaveBeenLastCalledWith("");
});
it("brand swatches send the same concrete hex format as Apply to highlighted words, without optimistic edits", () => {
  document.documentElement.style.setProperty("--nova-garnet", "3 44% 36%");
  const format = vi.fn(), change = vi.fn();
  const sel = remoteSelection(snapshot, undefined, { range: { key: snapshot.key, scope: snapshot.scope, collapsed: false, text: "transforms", marks }, format });
  render(<InlineStylePanel sel={sel} edits={{}} onChange={change} onReplaceImage={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Colour" }));
  fireEvent.click(screen.getByRole("button", { name: "Garnet" }));
  expect(format).toHaveBeenCalledWith("color", "#843733");
  expect(change).not.toHaveBeenCalled();
  document.documentElement.style.removeProperty("--nova-garnet");
});
it("letter spacing entered as 4 writes 4px and line height writes a multiplier", () => {
  const change = vi.fn(); render(<InlineStylePanel sel={remoteSelection(snapshot)} edits={{}} onChange={change} onReplaceImage={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Letter Spacing (px)"), { target: { value: "4" } });
  expect(change).toHaveBeenLastCalledWith({ "style:0": JSON.stringify({ "letter-spacing": "4px" }) });
  fireEvent.change(screen.getByLabelText("Line Height (Multiplier)"), { target: { value: "1.5" } });
  expect(change).toHaveBeenLastCalledWith({ "style:0": JSON.stringify({ "line-height": "1.5" }) });
});