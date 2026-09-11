// Prompt + reference builders for Objects.
// Objects are curated marketing "sections" that live at /objects/<slug>.

export function buildObjectBuildPrompt(name: string, slug: string): string {
  const route = `/objects/${slug}`;
  return `Build a new marketing section (Object) in this project.

- Display name: ${name}
- Route: ${route}
- Create a reusable section component in src/components/objects/ (PascalCase filename), then register it in src/components/objects/registry.tsx under a matching component key.
- Update the object_registry row for slug "${slug}" to set component_key to that new key and status to "Ready".
- Design it as a self-contained page section using our existing theme, tokens, and typography (Cormorant Garamond serif + Figtree sans). No page chrome — the /objects/<slug> route already renders it in isolation.
- The component must be safe to drop into any page: no route-specific assumptions, no hard-coded links to production domains.
- When you're finished, open ${route} so it's the page currently shown in the preview and I can review it.

Reference: objects/${slug}`;
}

/** Paste-ready reference for using an object on another page or object. */
export function buildObjectReference(name: string, slug: string): string {
  const route = `/objects/${slug}`;
  return `Add the "${name}" object (route ${route}) to this page. Import and render its component from src/components/objects/registry.tsx.`;
}
