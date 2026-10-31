import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import FramedPageEditor from "../FramedPageEditor";
import InlineStylePanel from "../InlineStylePanel";
import { remoteFormatting, remoteSelection, type SelectionSnapshot } from "../remoteSelection";
import { selectionDescription } from "../selectionDescription";
import SelectionColourPicker from "../SelectionColourPicker";

afterEach(cleanup);
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