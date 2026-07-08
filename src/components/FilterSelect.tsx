"use client";

import { ChevronDown, Search } from "lucide-react";

const filterSelectClass =
  "w-full appearance-none rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 pr-9 text-sm text-white outline-none transition-colors cursor-pointer hover:border-slate-500 focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40";

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
          className={`${filterSelectClass} min-w-[10rem] ${
            isActive ? "border-[#2E7D9A]/70 bg-[#2E7D9A]/10" : ""
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
          className="w-full rounded-lg border border-slate-600 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40"
        />
      </div>
    </label>
  );
}
