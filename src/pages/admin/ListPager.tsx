import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 15;

/** Tracks the current list page; resets to the first page when the list changes size. */
export function usePager(total: number, size = PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(total / size));
  useEffect(() => { if (page > pages - 1) setPage(pages - 1); }, [page, pages]);
  return { page, setPage, pages, start: page * size, end: page * size + size, size };
}

export default function ListPager({ page, pages, setPage, total, start, end }: {
  page: number; pages: number; setPage: (n: number) => void; total: number; start: number; end: number;
}) {
  if (total <= end - start) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs text-muted-foreground">
      <span>{start + 1}–{Math.min(end, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" className="p-1.5 rounded border hover:bg-muted disabled:opacity-40" disabled={page === 0}
          onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
        <span className="px-2">Page {page + 1} of {pages}</span>
        <button type="button" className="p-1.5 rounded border hover:bg-muted disabled:opacity-40" disabled={page >= pages - 1}
          onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
