import { Suspense, useEffect, useRef, useState, type ComponentType } from "react";

/** Element at a child-index path ("0.2.1") below `root`; "" is the root itself. */
export function elementAtPath(root: Element, path: string): Element | null {
  if (!path) return root;
  let n: Element | null = root;
  for (const i of path.split(".")) {
    if (!n) return null;
    n = n.children[Number(i)] ?? null;
  }
  return n;
}

/**
 * Shows one part of a coded object exactly as built: the real component is
 * rendered and everything outside the chosen part is hidden.
 */
export default function CodedChunk({ codedKey, chunk }: { codedKey: string; chunk: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [C, setC] = useState<ComponentType | null>(null);

  useEffect(() => {
    let live = true;
    import("@/components/objects/registry").then(({ objectRegistry }) => {
      const entry = objectRegistry[codedKey];
      if (live && entry) setC(() => entry.component as ComponentType);
    });
    return () => { live = false; };
  }, [codedKey]);

  useEffect(() => {
    const root = ref.current;
    if (!root || !C) return;
    const isolate = () => {
      const obj = root.firstElementChild;
      if (!obj) return;
      const target = elementAtPath(obj, chunk);
      if (!target) return;
      let n: Element = target;
      while (n !== root && n.parentElement) {
        for (const c of n.parentElement.children) {
          if (c !== n && !c.hasAttribute("data-inline-isolated-out")) c.setAttribute("data-inline-isolated-out", "");
        }
        n = n.parentElement;
      }
    };
    isolate();
    const mo = new MutationObserver(isolate);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [C, chunk]);

  return (
    <div ref={ref}>
      {C ? (
        <Suspense fallback={<div className="h-40 animate-pulse bg-muted" />}>
          <C />
        </Suspense>
      ) : (
        <div className="h-40 animate-pulse bg-muted" />
      )}
    </div>
  );
}
