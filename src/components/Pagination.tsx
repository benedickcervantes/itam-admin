"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function pluralize(singular: string, count: number) {
  if (count === 1) return singular;
  return `${singular}s`;
}

function visiblePages(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const unique = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...unique].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    if (i > 0 && page - sorted[i - 1] > 1) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

const iconBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/60";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "mt-3",
  total,
  pageSize = 20,
  itemLabel = "record",
  filteredFrom,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  total?: number;
  pageSize?: number;
  itemLabel?: string;
  filteredFrom?: number;
}) {
  const safeTotal = Math.max(totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < safeTotal;
  const hasCount = typeof total === "number";
  const rangeStart = hasCount && total > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = hasCount ? Math.min(page * pageSize, total) : 0;
  const noun = hasCount ? pluralize(itemLabel, total) : itemLabel;
  const showFilteredFrom = hasCount && typeof filteredFrom === "number" && filteredFrom !== total;
  const pages = visiblePages(page, safeTotal);

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        {hasCount ? (
          <>
            <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[#2E7D9A]/12 px-3 py-1 ring-1 ring-[#2E7D9A]/30">
              <span className="text-[1.05rem] font-semibold tabular-nums leading-none text-sky-300">
                {total.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-sky-200/75">{noun}</span>
            </span>
            {total > 0 && (
              <span className="text-xs text-slate-500">
                <span className="tabular-nums text-slate-300">{rangeStart}–{rangeEnd}</span> on this page
              </span>
            )}
            {showFilteredFrom && (
              <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-400 ring-1 ring-slate-700/80">
                of {filteredFrom.toLocaleString()} total
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-slate-400">
            Page <span className="font-semibold tabular-nums text-slate-200">{page}</span> of{" "}
            <span className="font-semibold tabular-nums text-slate-200">{safeTotal}</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-900/35 p-1">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={iconBtnClass}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {safeTotal > 1 &&
          pages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`e-${index}`}
                className="inline-flex h-8 w-7 items-center justify-center text-xs text-slate-500"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/60 ${
                  item === page
                    ? "bg-[#2E7D9A] text-white shadow-sm shadow-[#2E7D9A]/25"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item}
              </button>
            ),
          )}
        {safeTotal <= 1 && (
          <span className="px-2 text-xs font-medium tabular-nums text-slate-500">1 / 1</span>
        )}
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={iconBtnClass}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
