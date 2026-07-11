"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const buttonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-[#2E7D9A] hover:bg-[#2E7D9A]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-600 disabled:hover:bg-transparent disabled:hover:text-slate-200";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const safeTotal = Math.max(totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < safeTotal;

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-400">
        Page <span className="font-semibold text-slate-200">{page}</span> of{" "}
        <span className="font-semibold text-slate-200">{safeTotal}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={buttonClass}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={buttonClass}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
