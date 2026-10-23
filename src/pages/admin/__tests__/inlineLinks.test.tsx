import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import InlineLinkControl from "../InlineLinkControl";
import PictureLinkControl from "../PictureLinkControl";
import { changeInlineLink, mergePictureChanges, validInlineHref } from "../inlineLinks";
import { cleanEditedHtml, sanitizeInline, type SectionImage } from "@/components/ObjectSections";

afterEach(() => { cleanup(); document.body.innerHTML = ""; });
function words(html = "Some words here") {
  const host = document.createElement("p");
  host.contentEditable = "true";
  host.setAttribute("contenteditable", "true");
  host.innerHTML = html;
  document.body.append(host);
  const range = document.createRange();
  range.selectNodeContents(host);
  return { host, range };
}
function select(range: Range) {
  act(() => { window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range); document.dispatchEvent(new Event("selectionchange")); });
}

describe("whole-card picture links", () => {
  it("writes true on selection and deletes the field on deselection", () => {
    let saved: SectionImage = { url: "picture.jpg", alt: "Picture", href: "/about" };
    function Form() {
      const [image, setImage] = useState(saved);
      return <PictureLinkControl image={image} onChange={(changes) => { saved = mergePictureChanges(image, changes); setImage(saved); }} />;
    }
    render(<Form />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(saved).toEqual({ url: "picture.jpg", alt: "Picture", href: "/about", linkCard: true });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(saved).not.toHaveProperty("linkCard");
    expect(saved.href).toBe("/about");
  });
  it("is disabled without a nonblank picture href", () => {
    render(<PictureLinkControl image={{ url: "picture.jpg", alt: "", href: "  " }} onChange={() => { throw new Error("must not write"); }} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });
});

describe("inline text links", () => {
  it("wraps selected words and stores normalized markup", () => {
    const { host, range } = words();
    const text = host.firstChild;
    if (!text) throw new Error("missing text");
    range.setStart(text, 5); range.setEnd(text, 10);
    expect(changeInlineLink(host, range, "/about")).toBe('Some <a href="/about">words</a> here');
  });
  it("edits an existing link instead of nesting one and removes it without losing formatting", () => {
    const { host, range } = words('Some <a href="/old"><b>words</b></a> here');
    const bold = host.querySelector("b");
    if (!bold) throw new Error("missing bold");
    range.selectNodeContents(bold);
    expect(changeInlineLink(host, range, "https://example.com", { underline: false, color: "garnet" })).toBe('Some <a href="https://example.com" data-color="garnet" data-underline="0"><b>words</b></a> here');
    expect(host.querySelectorAll("a")).toHaveLength(1);
    expect(changeInlineLink(host, range, null)).toBe("Some <b>words</b> here");
  });
  it.each(["https://example.com", "http://example.com", "mailto:hello@example.com", "tel:123", "/page", "#section"])("accepts %s exactly like the renderer", (href) => {
    expect(validInlineHref(href)).toBe(true);
    expect(sanitizeInline(`<a href="${href}">words</a>`)).toContain(`<a href="${href}"`);
  });
  it.each(["javascript:alert(1)", "//evil.example", "https://", "/a b", "/a\\b", "data:text/html,hello", "foo", "\u0000/page"])("rejects %s without changing text", (href) => {
    const { host, range } = words();
    expect(validInlineHref(href)).toBe(false);
    expect(changeInlineLink(host, range, href)).toBeNull();
    expect(host.innerHTML).toBe("Some words here");
    expect(sanitizeInline(`<a href="${href}">words</a>`)).not.toContain("<a ");
  });
  it("opens the selection popover, rejects an invalid address and applies with Enter", () => {
    const { host, range } = words("Selected words");
    render(<InlineLinkControl />); select(range);
    fireEvent.click(screen.getByRole("button", { name: /^Link$/ }));
    const input = screen.getByRole("textbox", { name: "Address" });
    fireEvent.change(input, { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Link" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(host.querySelector("a")).toBeNull();
    fireEvent.change(input, { target: { value: "/team" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(cleanEditedHtml(host.innerHTML)).toBe('<a href="/team" data-underline="1">Selected words</a>');
  });
  it("shows active at a caret inside a link and offers editing/removal", () => {
    const { host, range } = words('<a href="/old">words</a>');
    const text = host.querySelector("a")?.firstChild;
    if (!text) throw new Error("missing text");
    range.setStart(text, 2); range.collapse(true);
    render(<InlineLinkControl />); select(range);
    expect(screen.getByRole("button", { name: /^Link$/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^Link$/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Address" }), { target: { value: "/new" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Link" }));
    expect(cleanEditedHtml(host.innerHTML)).toBe('<a href="/new" data-underline="1">words</a>');
    select(range);
    fireEvent.click(screen.getByRole("button", { name: /^Link$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Link" }));
    expect(cleanEditedHtml(host.innerHTML)).toBe("words");
  });
  it.each(["button", "card"])("disables links inside a %s", (kind) => {
    const { host, range } = words();
    if (kind === "card") host.dataset.inlineNoLinks = "true";
    else { const button = document.createElement("button"); host.replaceWith(button); button.append(host); }
    range.selectNodeContents(host);
    render(<InlineLinkControl />); select(range);
    expect(screen.getByRole("button", { name: /^Link$/ })).toBeDisabled();
  });
  it("Cancel and Escape leave selected text unchanged", () => {
    const { host, range } = words();
    render(<InlineLinkControl />); select(range);
    for (const cancel of [false, true]) {
      fireEvent.click(screen.getByRole("button", { name: /^Link$/ }));
      fireEvent.change(screen.getByRole("textbox", { name: "Address" }), { target: { value: "/unused" } });
      if (cancel) fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      else fireEvent.keyDown(screen.getByRole("textbox", { name: "Address" }), { key: "Escape" });
      expect(host.innerHTML).toBe("Some words here");
    }
  });
});