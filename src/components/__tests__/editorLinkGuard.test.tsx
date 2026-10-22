import { useRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Link, useNavigate, useLocation } from "react-router-dom";
import { useEditorLinkGuard } from "../useEditorLinkGuard";

afterEach(cleanup);

function Canvas({ editing, select, open }: { editing: boolean; select: () => void; open: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const guard = useEditorLinkGuard(ref, editing, select, true);
  return <>
    <output>{location.pathname}</output>
    <div ref={ref} {...guard}>
      <button onClick={open}>Editor control</button>
      <div data-editor-content onClick={select}>
        <Link to="/elsewhere"><span>Router link</span></Link>
        <button onClick={() => navigate("/button-destination")}>Navigation button</button>
        <button onClick={open}>Open window</button>
        <div role="link" tabIndex={0} onClick={open} onAuxClick={open} onKeyDown={open}>Role link</div>
        {["#section", "mailto:hello@example.com", "tel:123", "https://example.com"].map((href) => <a key={href} href={href} onClick={open}>{href}</a>)}
      </div>
    </div>
  </>;
}

describe("editor link guard", () => {
  it("blocks router navigation, scripted buttons, and nested links but still selects each clicked item", () => {
    const select = vi.fn(), open = vi.fn();
    render(<MemoryRouter><Canvas editing select={select} open={open} /></MemoryRouter>);
    for (const label of ["Router link", "Navigation button", "Open window", "Role link", "#section", "mailto:hello@example.com", "tel:123", "https://example.com"]) {
      expect(fireEvent.click(screen.getByText(label))).toBe(false);
    }
    expect(select).toHaveBeenCalledTimes(8);
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("/");
    fireEvent.click(screen.getByText("Editor control"));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("blocks middle click, Enter activation and native link drag", () => {
    const select = vi.fn(), open = vi.fn();
    render(<MemoryRouter><Canvas editing select={select} open={open} /></MemoryRouter>);
    const link = screen.getByText("Role link");
    expect(fireEvent(link, new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 }))).toBe(false);
    expect(fireEvent.keyDown(link, { key: "Enter" })).toBe(false);
    expect(fireEvent.dragStart(link)).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it("keeps preview links and buttons working when editing is off", () => {
    const select = vi.fn(), open = vi.fn();
    render(<MemoryRouter><Canvas editing={false} select={select} open={open} /></MemoryRouter>);
    fireEvent.click(screen.getByText("Router link"));
    expect(screen.getByRole("status").textContent).toBe("/elsewhere");
    fireEvent.click(screen.getByText("Navigation button"));
    expect(screen.getByRole("status").textContent).toBe("/button-destination");
    fireEvent.click(screen.getByText("Open window"));
    expect(open).toHaveBeenCalledTimes(1);
  });
});