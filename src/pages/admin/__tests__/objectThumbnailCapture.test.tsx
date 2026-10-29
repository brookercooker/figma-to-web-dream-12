import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { requestObjectThumbnail } from "../objectThumbnailCapture";

const capture = vi.hoisted(() => vi.fn());
vi.mock("html2canvas", () => ({ default: capture }));
vi.mock("@/components/objects/registry", () => ({ objectRegistry: { Example: { component: () => <h1>Original</h1> } } }));
vi.mock("@/components/ObjectSections", () => ({ default: () => null, parseSections: () => [] }));
vi.mock("@/prototype/client", () => ({ supabase: {
  from: () => {
    const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { component_key: "Example", inline_edits: { "": "Captured wording" } } }), update: () => ({ eq: async () => ({ error: null }) }) };
    return q;
  },
  storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: "https://example.com/thumb.jpg" } }) }) },
} }));
afterEach(() => { cleanup(); capture.mockReset(); });
it("applies and restores saved edits only inside its own capture container", async () => {
  const live = render(<div><h1>Live manager panel</h1><p>Live hint</p></div>);
  const heading = live.getByText("Live manager panel");
  const originalNode = heading.firstChild;
  capture.mockImplementation(async (container: HTMLElement) => {
    expect(container).not.toBe(document.body);
    expect(container.contains(heading)).toBe(false);
    expect(container.querySelector("h1")?.textContent).toBe("Captured wording");
    expect(heading.textContent).toBe("Live manager panel");
    return { toBlob: (done: (blob: Blob) => void) => done(new Blob(["thumbnail"])) };
  });
  expect(await requestObjectThumbnail("isolated-object")).toMatch(/^https:\/\/example.com\/thumb.jpg/);
  expect(capture).toHaveBeenCalledOnce();
  expect(heading.firstChild).toBe(originalNode);
  expect(live.container.querySelectorAll("h1")).toHaveLength(1);
  expect(live.getByText("Live hint")).toBeInTheDocument();
});