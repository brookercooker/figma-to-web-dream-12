import { cleanup, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lazy } from "react";
import ObjectLiveThumbnail from "../ObjectLiveThumbnail";

vi.mock("@/components/objects/registry", () => ({ objectRegistry: {
  Known: { component: () => <a href="/">Real Object</a> },
  Throws: { component: () => { throw new Error("render failed"); } },
  Never: { component: lazy(() => new Promise(() => {})) },
} }));
let observed: { callback: IntersectionObserverCallback; element?: Element }[] = [];
const show = (visible: boolean) => act(() => observed.forEach((o) => o.callback([{ target: o.element, isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)));
beforeEach(() => {
  observed = [];
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 160 } as DOMRect);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class {
    entry: (typeof observed)[number];
    constructor(callback: IntersectionObserverCallback) { this.entry = { callback }; observed.push(this.entry); }
    observe(element: Element) { this.entry.element = element; }
    disconnect() { observed = observed.filter((o) => o !== this.entry); }
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("live object thumbnails", () => {
  it("stored thumbnail wins without mounting the component", () => {
    const { container } = render(<ObjectLiveThumbnail componentKey="Known" storedThumb="snapshot" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "snapshot");
    expect(screen.queryByText("Real Object")).toBeNull();
    expect(observed).toHaveLength(0);
  });
  it("mounts registered components only on screen inside an inert wrapper", () => {
    const { container } = render(<ObjectLiveThumbnail componentKey="Known" />);
    expect(screen.queryByText("Real Object")).toBeNull();
    show(true);
    expect(screen.getByText("Real Object")).toBeInTheDocument();
    const wrapper = container.querySelector("[data-object-thumbnail]");
    expect(wrapper).toHaveAttribute("inert");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveClass("pointer-events-none", "overflow-hidden");
    show(false);
    expect(screen.queryByText("Real Object")).toBeNull();
  });
  it("falls back for unknown and throwing components", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<><ObjectLiveThumbnail componentKey="Unknown" /><ObjectLiveThumbnail componentKey="Throws" /></>);
    show(true);
    expect(container.querySelectorAll('[data-object-thumbnail="fallback"]')).toHaveLength(2);
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
  it("caps simultaneously mounted components at 12 and releases slots offscreen", () => {
    const { container } = render(<>{Array.from({ length: 20 }, (_, n) => <ObjectLiveThumbnail key={n} componentKey="Known" />)}</>);
    show(true);
    expect(screen.getAllByText("Real Object")).toHaveLength(12);
    expect(container.querySelectorAll('[data-object-thumbnail="pending"]')).toHaveLength(8);
    act(() => observed[0].callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(screen.getAllByText("Real Object")).toHaveLength(12);
    show(false);
    expect(screen.queryByText("Real Object")).toBeNull();
  });
  it("gives waiting visible cells a turn without exceeding the cap", () => {
    vi.useFakeTimers();
    const { container } = render(<>{Array.from({ length: 20 }, (_, n) => <ObjectLiveThumbnail key={n} componentKey="Known" />)}</>);
    show(true);
    const cells = container.querySelectorAll("[data-object-thumbnail]");
    expect(cells[19]).toHaveAttribute("data-object-thumbnail", "pending");
    act(() => vi.advanceTimersByTime(10000));
    expect(cells[19]).toHaveAttribute("data-object-thumbnail", "live");
    expect(screen.getAllByText("Real Object")).toHaveLength(12);
  });
  it("falls back and releases a slot when a suspended component never mounts", () => {
    vi.useFakeTimers();
    const { container } = render(<ObjectLiveThumbnail componentKey="Never" />);
    show(true);
    act(() => vi.advanceTimersByTime(8000));
    expect(container.querySelector('[data-object-thumbnail="fallback"]')).toHaveAttribute("data-preview-reason", "Component mount timed out");
  });
});