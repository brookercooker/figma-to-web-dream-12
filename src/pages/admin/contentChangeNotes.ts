/** Human-readable notes shared by successful library mutations. */
export function pageChangeNote(action: string, page: { name: string; path: string }) {
  return `${action} the page "${page.name}" (${page.path})`;
}
export function objectChangeNote(action: string, object: { name: string }) {
  return `${action} the object "${object.name}"`;
}