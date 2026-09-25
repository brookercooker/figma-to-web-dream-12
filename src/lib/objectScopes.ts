/**
 * Finds which parts of a rendered page come from shared Objects, by walking
 * React's internal tree from a DOM node. Edits made inside an object are then
 * saved on the object itself, so every page that uses it picks them up.
 */
import { objectRegistry } from "@/components/objects/registry";

const modules = import.meta.glob([
  "/src/components/objects/*.tsx",
  "/src/components/GoogleReviews.tsx",
  "/src/components/TeamPreview.tsx",
]);

let loaded: Map<unknown, string> | null = null;
let loading: Promise<Map<unknown, string>> | null = null;

/** Map of object component function → its registry key. */
export function loadObjectComponents(): Promise<Map<unknown, string>> {
  if (loaded) return Promise.resolve(loaded);
  loading ??= (async () => {
    const map = new Map<unknown, string>();
    await Promise.all(Object.entries(modules).map(async ([file, load]) => {
      const name = file.split("/").pop()!.replace(/\.tsx$/, "");
      if (!(name in objectRegistry)) return;
      try {
        const mod = (await load()) as { default?: unknown };
        if (mod.default) map.set(mod.default, name);
      } catch { /* ignore */ }
    }));
    loaded = map;
    return map;
  })();
  return loading;
}
export const objectComponentsNow = () => loaded;

export interface ObjectRoot { key: string; el: HTMLElement }

const fiberOf = (el: Element): any => {
  const k = Object.keys(el).find((x) => x.startsWith("__reactFiber$"));
  return k ? (el as any)[k] : null;
};
const firstHost = (fiber: any): HTMLElement | null => {
  let f = fiber?.child;
  while (f) {
    if (f.stateNode instanceof HTMLElement) return f.stateNode;
    f = f.child;
  }
  return null;
};

/** Outermost object instances rendered under root. */
export function findObjectRoots(root: Element, map: Map<unknown, string>): ObjectRoot[] {
  const start = fiberOf(root);
  if (!start) return [];
  const out: ObjectRoot[] = [];
  const stack: any[] = start.child ? [start.child] : [];
  while (stack.length) {
    const f = stack.pop();
    if (f.sibling) stack.push(f.sibling);
    const t = f.type;
    const key = map.get(t) ?? map.get(t?.type);
    if (key) {
      const el = firstHost(f);
      if (el && root.contains(el)) { out.push({ key, el }); continue; }
    }
    if (f.child) stack.push(f.child);
  }
  return out;
}
