"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const filterFieldClass =
  "w-full rounded-xl border border-slate-700 bg-slate-900/70 text-sm text-white shadow-sm outline-none transition hover:border-slate-500 focus:border-[#2E7D9A] focus:ring-2 focus:ring-[#2E7D9A]/25";

const filterSelectClass = `${filterFieldClass} appearance-none cursor-pointer px-3 py-2 pr-9`;

export function FilterSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = value !== "";

  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className={`${filterSelectClass} min-w-0 sm:min-w-[10rem] ${
            isActive ? "border-[#2E7D9A]/80 bg-[#2E7D9A]/10" : ""
          }`}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
          aria-hidden
        />
      </div>
    </label>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-400">Search</span>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${filterFieldClass} py-2 pl-9 pr-3`}
        />
      </div>
    </label>
  );
}

export type FilterOption = {
  value: string;
  label: string;
};

const LIST_MAX_HEIGHT = 320;
const LIST_GAP = 4;

function useDropdownPosition(open: boolean, anchorRef: React.RefObject<HTMLDivElement | null>) {
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP;
      const spaceAbove = rect.top - LIST_GAP;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.min(LIST_MAX_HEIGHT, Math.max(available, 120));
      const margin = 12;
      const width = Math.min(Math.max(rect.width, 260), window.innerWidth - margin * 2);
      let left = rect.left;
      if (left + width > window.innerWidth - margin) left = rect.right - width;
      left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));

      setStyle(
        openUp
          ? {
              position: "fixed",
              left,
              width,
              bottom: window.innerHeight - rect.top + LIST_GAP,
              maxHeight,
              visibility: "visible",
            }
          : {
              position: "fixed",
              left,
              width,
              top: rect.bottom + LIST_GAP,
              maxHeight,
              visibility: "visible",
            },
      );
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  return style;
}

function FilterCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition ${
        checked
          ? "border-[#2E7D9A] bg-[#2E7D9A] text-white shadow-[0_0_0_3px_rgba(46,125,154,0.2)]"
          : "border-slate-500/80 bg-slate-950/50"
      }`}
      aria-hidden
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

/**
 * Checkbox filter. Empty selection means every value. Several selections are
 * combined with OR so those groups can be compared in one table.
 */
export function FilterMultiSelect({
  label,
  values,
  onChange,
  options,
  emptyLabel,
  className,
}: {
  label: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  options: readonly FilterOption[];
  emptyLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const dropdownStyle = useDropdownPosition(open, rootRef);
  const isActive = values.length > 0;
  const searchable = options.length > 8;

  const selectedLabels = values.map(
    (value) => options.find((option) => option.value === value)?.label ?? value,
  );
  const buttonLabel =
    selectedLabels.length === 0
      ? emptyLabel
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const panel = open ? (
    <div
      ref={panelRef}
      id={listId}
      role="listbox"
      aria-multiselectable="true"
      aria-label={label}
      style={dropdownStyle}
      className="z-[70] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.75)] ring-1 ring-white/5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-3 px-3 pb-1 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
          Compare in this table
        </p>
        {values.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="shrink-0 text-xs font-medium text-[#7ec8e3] transition hover:text-white"
          >
            Clear
          </button>
        )}
      </div>
      {searchable && (
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-8 pr-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#2E7D9A] focus:ring-2 focus:ring-[#2E7D9A]/25"
              aria-label={`Search ${label}`}
            />
          </div>
        </div>
      )}
      <ul className="m-0 min-h-0 flex-1 list-none overflow-auto px-1.5 pb-1.5">
        <li>
          <button
            type="button"
            onClick={() => onChange([])}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
              values.length === 0 ? "bg-[#2E7D9A]/15 text-white" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <FilterCheck checked={values.length === 0} />
            {emptyLabel}
          </button>
        </li>
        {visibleOptions.map((option) => {
          const checked = values.includes(option.value);
          return (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(option.value)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  checked ? "bg-[#2E7D9A]/15 text-white" : "text-slate-200 hover:bg-white/5"
                }`}
              >
                <FilterCheck checked={checked} />
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            </li>
          );
        })}
        {visibleOptions.length === 0 && (
          <li className="px-2.5 py-6 text-center text-sm text-slate-500">No matches</li>
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs font-medium text-slate-400" id={`${listId}-label`}>
        {label}
      </span>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${listId}-label`}
          title={selectedLabels.length ? selectedLabels.join(", ") : emptyLabel}
          onClick={() => {
            setOpen((current) => !current);
            setQuery("");
          }}
          className={`${filterFieldClass} flex min-w-0 cursor-pointer items-center gap-2 px-3 py-2 text-left sm:min-w-[10rem] ${
            isActive ? "border-[#2E7D9A]/80 bg-[#2E7D9A]/10" : ""
          } ${open ? "border-[#2E7D9A] ring-2 ring-[#2E7D9A]/25" : ""}`}
        >
          <span className={`min-w-0 flex-1 truncate ${isActive ? "text-white" : "text-slate-300"}`}>{buttonLabel}</span>
          {isActive && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D9A] px-1.5 text-[11px] font-semibold leading-none text-white">
              {values.length}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
