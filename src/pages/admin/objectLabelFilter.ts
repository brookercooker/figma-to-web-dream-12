export interface LabelledObject { id: string; name: string; description?: string; labels?: string[] | null }
export interface ObjectLabel { key: string; name: string; count: number }
export type LabelMode = "any" | "all";
export const labelKey = (label: string) => label.trim().toLowerCase();

export function objectLabels(object: LabelledObject): string[] {
  const seen = new Set<string>();
  return (object.labels ?? []).map(label => label.trim()).filter(label => {
    const key = labelKey(label);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function countObjectLabels(items: LabelledObject[]): ObjectLabel[] {
  const counts = new Map<string, ObjectLabel>();
  for (const item of items) for (const name of objectLabels(item)) {
    const key = labelKey(name), existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { key, name, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function objectSearchMatches(object: LabelledObject, term: string): boolean {
  const query = term.trim().toLowerCase();
  return !query || `${object.name} ${object.description ?? ""} ${(object.labels ?? []).join(" ")}`.toLowerCase().includes(query);
}

export function filterObjects(items: LabelledObject[], search: string, selectedLabels: ReadonlySet<string>, mode: LabelMode): LabelledObject[] {
  const keys = [...selectedLabels].map(labelKey).filter(Boolean);
  return items.filter(item => {
    if (!objectSearchMatches(item, search)) return false;
    const labels = new Set(objectLabels(item).map(labelKey));
    return !keys.length || (mode === "all" ? keys.every(key => labels.has(key)) : keys.some(key => labels.has(key)));
  });
}

export function hiddenSelectedCount(selected: ReadonlySet<string>, visible: Pick<LabelledObject, "id">[]): number {
  const ids = new Set(visible.map(item => item.id));
  return [...selected].filter(id => !ids.has(id)).length;
}

export function recentObjectLabels(previous: string[], key: string): string[] {
  return [labelKey(key), ...previous.map(labelKey).filter(item => item !== labelKey(key))].filter(Boolean).slice(0, 3);
}