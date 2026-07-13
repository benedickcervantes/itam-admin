"use client";

import { useEffect, useState } from "react";
import { Columns3, FileSpreadsheet, FileText, Loader2, X } from "lucide-react";

export type ExportColumnSection<T extends string> = {
  title: string;
  columns: Array<{ key: T; header: string; required?: boolean }>;
};

export function ExportColumnDialog<T extends string>({
  open,
  titleId,
  allColumnKeys,
  columnSections,
  filterSummary,
  exporting = false,
  onClose,
  onExport,
}: {
  open: boolean;
  titleId: string;
  allColumnKeys: readonly T[];
  columnSections: ExportColumnSection<T>[];
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: "excel" | "pdf", columns: T[]) => void;
}) {
  const [draft, setDraft] = useState<T[]>([...allColumnKeys]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDraft([...allColumnKeys]);
      setError("");
    }
  }, [open, allColumnKeys]);

  if (!open) return null;

  const activeFilters =
    filterSummary && filterSummary !== "None (all records)" ? filterSummary : undefined;
  const selectedSet = new Set(draft);
  const allSelected = draft.length === allColumnKeys.length;
  const selectedCount = draft.length;
  const totalCount = allColumnKeys.length;

  const toggleColumn = (key: T) => {
    setDraft((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
    setError("");
  };

  const toggleSection = (keys: T[]) => {
    setDraft((current) => {
      const currentSet = new Set(current);
      const allInSection = keys.every((key) => currentSet.has(key));
      if (allInSection) {
        return current.filter((key) => !keys.includes(key));
      }
      const next = new Set(current);
      keys.forEach((key) => next.add(key));
      return allColumnKeys.filter((key) => next.has(key));
    });
    setError("");
  };

  const selectAll = () => {
    setDraft([...allColumnKeys]);
    setError("");
  };

  const clearAll = () => {
    setDraft([]);
    setError("");
  };

  const applyAndExport = (format: "excel" | "pdf") => {
    if (draft.length === 0) {
      setError("Select at least one column to export.");
      return;
    }
    const ordered = allColumnKeys.filter((key) => draft.includes(key));
    onExport(format, ordered);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close export options"
        onClick={onClose}
        disabled={exporting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[min(90vh,44rem)] w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-[#1E293B] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-700 px-5 py-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2E7D9A]/15 text-[#2E7D9A]">
              <Columns3 className="h-5 w-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-semibold text-white">
                Customize export columns
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Choose which fields to include in PDF and Excel exports. All columns are selected by default.
              </p>
              {activeFilters ? (
                <p className="mt-2 rounded-md border border-[#2E7D9A]/30 bg-[#2E7D9A]/10 px-2.5 py-1.5 text-xs text-slate-300">
                  <span className="font-medium text-[#7ec4d8]">Records to export:</span> {activeFilters}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">All records will be exported (no filters active).</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
          <p className="text-sm text-slate-300">
            <span className="font-medium text-white">{selectedCount}</span> of {totalCount} columns selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={exporting || allSelected}
              className="rounded-md border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={exporting || selectedCount === 0}
              className="rounded-md border border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {columnSections.map((section) => {
              const sectionKeys = section.columns.map((column) => column.key);
              const sectionSelected = sectionKeys.filter((key) => selectedSet.has(key)).length;
              const sectionAllSelected = sectionSelected === sectionKeys.length;

              return (
                <section key={section.title}>
                  <label className="mb-2 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sectionAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = sectionSelected > 0 && !sectionAllSelected;
                        }
                      }}
                      onChange={() => toggleSection(sectionKeys)}
                      disabled={exporting}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-[#2E7D9A] focus:ring-[#2E7D9A]/40"
                    />
                    <span className="text-sm font-semibold tracking-wide text-slate-200">{section.title}</span>
                    <span className="text-xs text-slate-500">
                      ({sectionSelected}/{sectionKeys.length})
                    </span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {section.columns.map((column) => (
                      <label
                        key={column.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:border-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          disabled={exporting}
                          className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-[#2E7D9A] focus:ring-[#2E7D9A]/40"
                        />
                        <span className="min-w-0 flex-1">
                          {column.header}
                          {column.required ? <span className="ml-1 text-[#2E7D9A]">*</span> : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mx-5 mb-0 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-700 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-600 px-4 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => applyAndExport("excel")}
              disabled={exporting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-4 text-sm font-medium text-emerald-300 hover:bg-emerald-950/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => applyAndExport("pdf")}
              disabled={exporting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2E7D9A] px-4 text-sm font-medium text-white hover:bg-[#256b85] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
