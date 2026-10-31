export type MaterialStyle = "outlined" | "rounded" | "sharp";
export const MATERIAL_ERROR = "That doesn't look like a Google icon. Copy the code from fonts.google.com/icons.";
export function parseMaterialIcon(input: string): { style: MaterialStyle; name: string; value: string } | null {
  const text = input.trim();
  if (text.length > 10000) return null;
  let name = text, style: MaterialStyle = "outlined";
  if (text.includes("<")) {
    // Parse inertly; never place this document or any of its nodes in the live page.
    const doc = new DOMParser().parseFromString(text, "text/html");
    if (doc.querySelector("script,iframe,object,embed,style")) return null;
    const nodes = [...doc.head.children, ...doc.body.children];
    if (nodes.some(el => !["LINK", "SPAN", "I"].includes(el.tagName))) return null;
    const candidates = nodes.filter(el => el.tagName !== "LINK");
    if (candidates.length !== 1) return null;
    const el = candidates[0];
    if (!el || el.children.length || [...el.attributes].some(a => a.name !== "class")) return null;
    const cls = el.className.split(/\s+/).find(c => /^(material-symbols-(outlined|rounded|sharp)|material-icons(-outlined|-round|-rounded|-sharp)?)$/.test(c));
    if (!cls) return null;
    style = /(?:rounded|round)$/.test(cls) ? "rounded" : /sharp$/.test(cls) ? "sharp" : "outlined";
    name = (el.textContent ?? "").trim();
  }
  if (!/^[a-z][a-z0-9_]*$/.test(name) || name.length > 100) return null;
  return { style, name, value: `material:${style}:${name}` };
}