import { matchesLabelFilter } from "../labelPath";

export type LabelMatchMode = "any" | "all";

/** Search stays loader-owned; each selected parent matches its descendants. */
export function matchesObjectPickerFilter(
  row: { labels: string[] | null; search: (term: string) => boolean },
  term: string,
  selectedLabels: readonly string[],
  mode: LabelMatchMode,
): boolean {
  if (!row.search(term)) return false;
  if (selectedLabels.length === 0) return true;
  const matches = (label: string) => matchesLabelFilter(row.labels, label);
  return mode === "all" ? selectedLabels.every(matches) : selectedLabels.some(matches);
}