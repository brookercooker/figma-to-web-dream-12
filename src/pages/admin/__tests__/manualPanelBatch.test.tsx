import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { parseMaterialIcon } from "../materialIcon";
import { detectLinkKind, linkAddress } from "../linkKind";
import { replaceWording, wordingText } from "../textWording";
import { createReplay, validateEdits, withoutPath } from "@/lib/inlineEditCore";
import { inlineChangeLines } from "../changeLines";
import { ManualEditHistory, type ManualEditSnapshot } from "../designChat/manualEditHistory";
import InlineStylePanel from "../InlineStylePanel";
import { remoteSelection, validSnapshot } from "../remoteSelection";
import MaterialIconField from "../MaterialIconField";
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("PointerEvent", MouseEvent);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("safe Material paste", () => {
  it.each([
    ["home", "outlined", "home"], ["arrow_forward", "outlined", "arrow_forward"], ["123", "outlined", "123"],
    ['<span class="material-symbols-outlined">home</span>', "outlined", "home"],
    ['<span class="material-symbols-rounded">home</span>', "rounded", "home"],
    ['<span class="material-symbols-sharp">home</span>', "sharp", "home"],
    ['<i class="material-icons">home</i>', "outlined", "home"],
    ['<span class="material-icons-round">home</span>', "rounded", "home"],
    ['<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"><span class="material-symbols-outlined">home</span>', "outlined", "home"],
  ])("accepts %s", (input, style, name) => expect(parseMaterialIcon(input)).toEqual({ style, name, value: `material:${style}:${name}` }));
  it.each(["Home", "two words", "home()", "home-foo", '<script>alert(1)</script><span class="material-symbols-outlined">home</span>', '<span class="material-symbols-outlined" onclick="bad()">home</span>', '<img src=x onerror=bad()>', '<span>home</span>'])("rejects %s", input => expect(parseMaterialIcon(input)).toBeNull());
});
it.each([["mailto:staff@example.com", "email"], ["tel:+1555", "phone"], ["/team", "page"], ["https://example.com", "web"]])("detects %s", (href, kind) => expect(detectLinkKind(href)).toBe(kind));
it("stores email and phone protocols once", () => { expect(linkAddress("email", "mailto:a@b.com")).toBe("mailto:a@b.com"); expect(linkAddress("phone", "+1 555")).toBe("tel:+1555"); });
it("preserves unchanged formatting and safely escapes changed words", () => {
  const html = 'Light <strong>transforms</strong> <span style="color: red">everything.</span>';
  const next = replaceWording(html, "Warm light transforms everything.");
  expect(wordingText(next)).toBe("Warm light transforms everything.");
  expect(next).toContain("<strong>transforms</strong>"); expect(next).toContain('<span style="color: red">everything.</span>');
  expect(replaceWording("Hello", "<script>bad()</script>")).not.toContain("<script>");
  expect(wordingText(replaceWording("Hello<br>world", "Hello\nNova"))).toBe("Hello\nNova");
});
it("hidden image undo redo and discard restore the original without writes", () => {
  const root = document.createElement("section"); root.innerHTML = '<img src="/light.jpg">'; const img = root.firstElementChild;
  const replay = createReplay(), history = new ManualEditHistory();
  const original = { blocks: [], inlineEdits: {}, objectEdits: {} }; const hidden = { ...original, inlineEdits: { "hidden:0": "1" } };
  replay.apply(root, original.inlineEdits); history.record(original, hidden, { label: "picture removed" }); replay.apply(root, hidden.inlineEdits);
  expect(img?.hasAttribute("hidden")).toBe(true);
  expect(img?.getAttribute("style")).toContain("display: none");
  replay.apply(root, history.undo()?.inlineEdits ?? {}); expect(img?.hasAttribute("hidden")).toBe(false);
  expect(img?.getAttribute("style")).toBeNull();
  replay.apply(root, history.redo()?.inlineEdits ?? {}); expect(img?.hasAttribute("hidden")).toBe(true);
  replay.apply(root, original.inlineEdits); history.reset(); expect(img?.hasAttribute("hidden")).toBe(false);
  expect(withoutPath(hidden.inlineEdits, "0")).toEqual({});
  expect(validateEdits({ "hidden:0": "bad" }).rejected).toHaveLength(1);
  expect(inlineChangeLines("Homepage", {}, hidden.inlineEdits)).toEqual(["Picture removed from Homepage"]);
});
it("the selected text box changes the existing html edit and follows page changes", () => {
  const sel = remoteSelection({ key: "0", scope: "page", kind: "text", tag: "h2", html: 'See <b>Nova</b>', text: "See Nova" }); const change = vi.fn();
  const view = render(<InlineStylePanel sel={sel} edits={{}} onChange={change} onReplaceImage={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Selected Text" }), { target: { value: "Visit Nova" } });
  expect(change.mock.lastCall?.[0]["0"]).toContain("<b>Nova</b>");
  view.rerender(<InlineStylePanel sel={sel} edits={{ "0": "Page changed" }} onChange={change} onReplaceImage={vi.fn()} />);
  expect(screen.getByRole("textbox", { name: "Selected Text" })).toHaveValue("Page changed");
});
it("image keyboard deletion ignores text fields and shows restore", () => {
  const snapshot = { key: "0", scope: "page", kind: "image" as const, tag: "img", context: { role: "image", section: "Categories" }, attrs: { src: "/light.jpg", alt: "Pendant" } };
  expect(validSnapshot(snapshot)).toBe(true);
  const sel = remoteSelection(snapshot);
  function Panel() { const [edits, set] = useState({}); return <><input aria-label="Other Text" /><InlineStylePanel sel={sel} edits={edits} onChange={set} onReplaceImage={vi.fn()} /></>; }
  render(<Panel />); fireEvent.keyDown(screen.getByLabelText("Other Text"), { key: "Delete" }); expect(screen.getByRole("button", { name: "Delete Image" })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "Backspace" }); expect(screen.getByRole("button", { name: "Restore Image" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Restore Image" })); expect(screen.getByRole("button", { name: "Delete Image" })).toBeInTheDocument();
});
it("Google icon help opens on hover and keyboard focus, including after pointer use", () => {
  render(<MaterialIconField value="" onChange={vi.fn()} />);
  const help = screen.getByRole("button", { name: "Google Icon Help" });
  fireEvent.pointerEnter(help);
  expect(screen.getByRole("tooltip")).toHaveTextContent("Find an icon at fonts.google.com/icons");
  fireEvent.pointerLeave(help, { clientX: 10, clientY: 10 }); expect(screen.queryByRole("tooltip")).toBeNull();
  fireEvent.focus(help); expect(screen.getByRole("tooltip")).toBeInTheDocument();
  fireEvent.pointerEnter(help); fireEvent.pointerLeave(help, { clientX: 10, clientY: 10 }); expect(screen.getByRole("tooltip")).toBeInTheDocument();
  fireEvent.blur(help); expect(screen.queryByRole("tooltip")).toBeNull();
});
it("a frame image selection deletes through scoped edits and supports Undo, Redo and Discard", () => {
  const sel = remoteSelection({ key: "0.1", scope: "page", kind: "image", tag: "img", context: { role: "image", section: "Categories" }, attrs: { src: "/light.jpg" } });
  const history = new ManualEditHistory(); const original = { blocks: [], inlineEdits: {}, objectEdits: {} };
  let current: ManualEditSnapshot = original;
  const view = render(<InlineStylePanel sel={sel} edits={current.inlineEdits} onChange={next => {
    const after = { ...current, inlineEdits: next }; history.record(current, after, { label: "picture removed" }); current = after;
  }} onReplaceImage={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete Image" }));
  expect(current.inlineEdits).toEqual({ "hidden:0.1": "1" });
  current = history.undo() ?? current; expect(current.inlineEdits).toEqual({});
  current = history.redo() ?? current; expect(current.inlineEdits).toEqual({ "hidden:0.1": "1" });
  current = original; history.reset();
  view.rerender(<InlineStylePanel sel={sel} edits={current.inlineEdits} onChange={vi.fn()} onReplaceImage={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Delete Image" })).toBeInTheDocument(); expect(history.undo()).toBeNull();
});