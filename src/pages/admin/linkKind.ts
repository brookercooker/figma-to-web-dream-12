export type LinkKind = "web" | "page" | "email" | "phone";
export function detectLinkKind(address: string): LinkKind {
  if (/^mailto:/i.test(address)) return "email";
  if (/^tel:/i.test(address)) return "phone";
  if (/^\/(?!\/)/.test(address)) return "page";
  return "web";
}
export function linkAddress(kind: LinkKind, value: string): string {
  return kind === "email" ? `mailto:${value.replace(/^mailto:/i, "")}` : kind === "phone" ? `tel:${value.replace(/^tel:/i, "").replace(/\s/g, "")}` : value;
}