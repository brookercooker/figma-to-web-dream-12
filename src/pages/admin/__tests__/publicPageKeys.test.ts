import { describe, expect, it } from "vitest";
import { pathOf } from "@/components/InlineEditSurface";
import { resolvePath } from "@/lib/inlineEditCore";

// Read-only public snapshot b85827c9: pathOf's body is byte-identical to the manager.
// Keep this fixture local so tests do not depend on another project's filesystem.
function publicPathOf(root: Element, el: Element): string {
  const parts: number[] = [];
  let n: Element | null = el;
  while (n && n !== root) {
    const p: Element | null = n.parentElement;
    if (!p) break;
    parts.unshift([...p.children].indexOf(n));
    n = p;
  }
  return parts.join(".");
}

describe("existing public page positional keys", () => {
  it("uses 0.0.3 for the same page element in both surface copies", () => {
    const root = document.createElement("div");
    root.innerHTML = "<main><section><h1>Title</h1><p>First</p><p>Second</p><p>Saved words</p></section><section>Other section</section></main>";
    const el = root.querySelectorAll("p")[2];
    if (!el) throw new Error("Missing page element");
    expect(pathOf(root, el)).toBe("0.0.3");
    expect(publicPathOf(root, el)).toBe("0.0.3");
    expect(resolvePath(root, "0.0.3")).toBe(el);
  });
  it("keeps the target of style:0.1 at 0.1 under the same root", () => {
    const root = document.createElement("div");
    root.innerHTML = "<main><section>First</section><section>Styled section</section></main>";
    const el = root.querySelectorAll("section")[1];
    if (!el) throw new Error("Missing section");
    expect(pathOf(root, el)).toBe("0.1");
    expect(publicPathOf(root, el)).toBe("0.1");
    expect(resolvePath(root, "0.1")).toBe(el);
  });
});