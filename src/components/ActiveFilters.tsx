"use client";

import { X } from "lucide-react";

export type ActiveFilterItem = {
  key: string;
  /** Optional field name shown before the value, e.g. "Employee" → "Employee: Active" */
  label?: string;
  value: string;
  onRemove: () => void;
};

export function ActiveFilters({
  filters,
  onClearAll,
}: {
  filters: ActiveFilterItem[];
  onClearAll: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-2"
      role="status"
      aria-label="Active filters"
    >
      <span className="shrink-0 text-xs font-medium text-slate-400">Active filters</span>

      <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {filters.map((filter) => (
          <li key={filter.key}>
            <button
              type="button"
              onClick={filter.onRemove}
              title={
                filter.label
                  ? `Remove ${filter.label}: ${filter.value}`
                  : `Remove filter: ${filter.value}`
              }
              className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#2E7D9A]/45 bg-[#2E7D9A]/12 py-1 pl-2.5 pr-1 text-left text-xs transition hover:border-[#2E7D9A]/75 hover:bg-[#2E7D9A]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/50"
            >
              <span className="min-w-0 truncate">
                {filter.label ? (
                  <>
                    <span className="text-slate-400">{filter.label}:</span>{" "}
                    <span className="font-medium text-slate-100">{filter.value}</span>
                  </>
                ) : (
                  <span className="font-medium text-slate-100">{filter.value}</span>
                )}
              </span>
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition group-hover:bg-[#2E7D9A]/35 group-hover:text-white"
                aria-hidden
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </span>
              <span className="sr-only">
                {filter.label
                  ? `Remove ${filter.label} filter`
                  : `Remove ${filter.value} filter`}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClearAll}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-[#7ec4d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D9A]/50 sm:ml-0.5"
      >
        Clear all
      </button>
    </div>
  );
}
